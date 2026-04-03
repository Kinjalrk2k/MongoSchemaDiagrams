import dagre from 'dagre'
import type {
  CollectionNode,
  DiagramEdge,
  MongoJsonSchema,
  MongoJsonSchemaProperty,
  MongoMlWorkspaceDocument,
  MongoSchemaDocument,
  MongoSchemaInput,
  NodePositionMap,
  ParsedCollection,
  SchemaField,
} from '../types'

const HORIZONTAL_GAP = 320
const VERTICAL_GAP = 240
const NODE_WIDTH = 256
const NODE_HEADER_HEIGHT = 36
const NODE_ROW_HEIGHT = 31
const NODE_SECTION_PADDING = 10

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

function normalizeType(property: MongoJsonSchemaProperty | undefined): string {
  const bsonType = toArray(property?.bsonType)

  if (bsonType.length === 0) {
    return 'unknown'
  }

  return bsonType.join(' | ')
}

function normalizeRefs(value: string | string[] | undefined): string[] {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

function inferReferences(name: string, property: MongoJsonSchemaProperty): string[] {
  const explicitRefs = normalizeRefs(property.__ref).concat(
    normalizeRefs(property.items?.__ref),
  )

  if (explicitRefs.length > 0) {
    return explicitRefs
  }

  const fieldType = normalizeType(property)
  const itemType = normalizeType(property.items)
  const looksLikeObjectId =
    fieldType.includes('objectId') ||
    (fieldType.includes('array') && itemType.includes('objectId'))

  if (!looksLikeObjectId) {
    return []
  }

  const normalizedName = name.replace(/Ids?$/i, '').replace(/_ids?$/i, '')

  if (!normalizedName || normalizedName === name) {
    return []
  }

  return [normalizedName.endsWith('s') ? normalizedName : `${normalizedName}s`]
}

function parseField(
  name: string,
  property: MongoJsonSchemaProperty,
  requiredFields: string[],
  parentPath?: string,
): SchemaField {
  const type = normalizeType(property)
  const required = requiredFields.includes(name)
  const refs = inferReferences(name, property)
  const path = parentPath ? `${parentPath}.${name}` : name

  if (type.includes('array')) {
    const itemType = normalizeType(property.items)
    const nestedFields =
      property.items?.properties && itemType.includes('object')
        ? parseFields(property.items, toArray(property.items.required), path)
        : undefined

    return {
      name,
      type: `${type}<${itemType}>`,
      required,
      refs,
      path,
      description: property.description,
      defaultValue: property.default,
      enumValues: property.enum,
      nestedFields,
    }
  }

  if (type.includes('object') && property.properties) {
    return {
      name,
      type,
      required,
      refs,
      path,
      description: property.description,
      defaultValue: property.default,
      enumValues: property.enum,
      nestedFields: parseFields(property, toArray(property.required), path),
    }
  }

  return {
    name,
    type,
    required,
    refs,
    path,
    description: property.description,
    defaultValue: property.default,
    enumValues: property.enum,
  }
}

function parseFields(
  schema: MongoJsonSchema,
  requiredFields: string[] = [],
  parentPath?: string,
): SchemaField[] {
  const properties = schema.properties ?? {}

  return Object.entries(properties).map(([name, property]) =>
    parseField(name, property, requiredFields, parentPath),
  )
}

function parseCollection(document: MongoSchemaDocument): ParsedCollection {
  const schema = document.$jsonSchema ?? document.schema

  if (!schema) {
    throw new Error('Each collection entry must include `schema` or `$jsonSchema`.')
  }

  const collection = document.collection ?? document.name ?? schema.title

  if (!collection) {
    throw new Error(
      'Each collection entry must include `collection`, `name`, or a schema `title`.',
    )
  }

  return {
    collection,
    fields: parseFields(schema, toArray(schema.required)),
  }
}

function countVisibleRows(fields: SchemaField[]): number {
  return fields.reduce((count, field) => {
    const nestedCount = field.nestedFields?.length
      ? 1 + countVisibleRows(field.nestedFields)
      : 0

    return count + 1 + nestedCount
  }, 0)
}

export function buildNodes(collections: ParsedCollection[]): CollectionNode[] {
  const graph = new dagre.graphlib.Graph()

  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({
    rankdir: 'LR',
    align: 'UL',
    acyclicer: 'greedy',
    ranker: 'network-simplex',
    nodesep: 110,
    edgesep: 60,
    ranksep: 170,
    marginx: 48,
    marginy: 48,
  })

  for (const collection of collections) {
    const rowCount = countVisibleRows(collection.fields)

    graph.setNode(collection.collection, {
      width: NODE_WIDTH,
      height: NODE_HEADER_HEIGHT + rowCount * NODE_ROW_HEIGHT + NODE_SECTION_PADDING,
    })
  }

  for (const collection of collections) {
    for (const field of collection.fields) {
      if (!field.refs || field.refs.length === 0) {
        continue
      }

      for (const ref of field.refs) {
        graph.setEdge(collection.collection, ref, {
          weight: 2,
          minlen: 1,
        })
      }
    }
  }

  dagre.layout(graph)

  return collections.map((collection, index) => {
    const positionedNode = graph.node(collection.collection)

    return {
      id: collection.collection,
      type: 'collection',
      position: positionedNode
        ? {
            x: positionedNode.x - NODE_WIDTH / 2,
            y: positionedNode.y - positionedNode.height / 2,
          }
        : {
            x: (index % 3) * HORIZONTAL_GAP,
            y: Math.floor(index / 3) * VERTICAL_GAP,
          },
      data: {
        collection: collection.collection,
        fields: collection.fields,
      },
    }
  })
}

function findTargetFieldPath(collection: ParsedCollection): string {
  const exactId = collection.fields.find((field) => field.name === '_id')
  if (exactId) {
    return exactId.path
  }

  const looseId = collection.fields.find((field) => field.name === 'id')
  if (looseId) {
    return looseId.path
  }

  const requiredObjectId = collection.fields.find(
    (field) => field.required && field.type.includes('objectId'),
  )
  if (requiredObjectId) {
    return requiredObjectId.path
  }

  return collection.fields[0]?.path ?? '_id'
}

export function buildEdges(collections: ParsedCollection[]): DiagramEdge[] {
  const edges: DiagramEdge[] = []
  const collectionLookup = new Map(
    collections.map((collection) => [collection.collection, collection]),
  )

  for (const collection of collections) {
    for (const field of collection.fields) {
      if (!field.refs || field.refs.length === 0) {
        continue
      }

      for (const ref of field.refs) {
        const targetCollection = collectionLookup.get(ref)
        const targetFieldPath = targetCollection
          ? findTargetFieldPath(targetCollection)
          : '_id'

        edges.push({
          id: `${collection.collection}-${field.name}-${ref}`,
          source: collection.collection,
          target: ref,
          sourceHandle: `source-${field.path}`,
          targetHandle: `target-${targetFieldPath}`,
          type: 'smoothstep',
          data: {
            sourceFieldKey: `${collection.collection}:${field.path}`,
            targetFieldKey: `${ref}:${targetFieldPath}`,
            sourceFieldPath: field.path,
            targetFieldPath,
          },
        })
      }
    }
  }

  return edges
}

export function parseMongoSchemaInput(input: string): {
  collections: ParsedCollection[]
  nodes: CollectionNode[]
  edges: DiagramEdge[]
} {
  const parsedDocument = parseMongoMlDocument(input)
  const documents = Array.isArray(parsedDocument.schema)
    ? parsedDocument.schema
    : [parsedDocument.schema]
  const collections = documents.map(parseCollection)

  return {
    collections,
    nodes: buildNodes(collections),
    edges: buildEdges(collections),
  }
}

export function layoutCollections(collections: ParsedCollection[]) {
  return {
    collections,
    nodes: buildNodes(collections),
    edges: buildEdges(collections),
  }
}

export function parseMongoMlDocument(input: string): {
  schema: MongoSchemaInput
  nodePositions: NodePositionMap
} {
  const parsed = JSON.parse(input) as MongoSchemaInput | MongoMlWorkspaceDocument

  if (
    parsed &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    'schema' in parsed
  ) {
    const workspace = parsed as MongoMlWorkspaceDocument

    return {
      schema: workspace.schema,
      nodePositions: workspace.layout?.nodePositions ?? {},
    }
  }

  return {
    schema: parsed as MongoSchemaInput,
    nodePositions: {},
  }
}

export function serializeMongoMlDocument(
  schema: MongoSchemaInput,
  nodePositions: NodePositionMap,
) {
  return JSON.stringify(
    {
      format: 'mongoml',
      version: 1,
      schema,
      layout: {
        nodePositions,
      },
    } satisfies MongoMlWorkspaceDocument,
    null,
    2,
  )
}
