import dagre from 'dagre'
import type {
  CollectionNode,
  DiagramEdge,
  MongoJsonSchema,
  MongoJsonSchemaProperty,
  MongoSchemaDocument,
  MongoSchemaInput,
  ParsedCollection,
  SchemaField,
} from '../types'

const HORIZONTAL_GAP = 320
const VERTICAL_GAP = 240
const NODE_WIDTH = 256
const NODE_HEADER_HEIGHT = 36
const NODE_ROW_HEIGHT = 31

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

function inferReference(name: string, property: MongoJsonSchemaProperty): string | undefined {
  const explicitRef = property.__ref ?? property.items?.__ref

  if (explicitRef) {
    return explicitRef
  }

  const fieldType = normalizeType(property)
  const itemType = normalizeType(property.items)
  const looksLikeObjectId =
    fieldType.includes('objectId') ||
    (fieldType.includes('array') && itemType.includes('objectId'))

  if (!looksLikeObjectId) {
    return undefined
  }

  const normalizedName = name.replace(/Ids?$/i, '').replace(/_ids?$/i, '')

  if (!normalizedName || normalizedName === name) {
    return undefined
  }

  return normalizedName.endsWith('s') ? normalizedName : `${normalizedName}s`
}

function parseField(
  name: string,
  property: MongoJsonSchemaProperty,
  requiredFields: string[],
  parentPath?: string,
): SchemaField {
  const type = normalizeType(property)
  const required = requiredFields.includes(name)
  const ref = inferReference(name, property)
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
      ref,
      path,
      nestedFields,
    }
  }

  if (type.includes('object') && property.properties) {
    return {
      name,
      type,
      required,
      ref,
      path,
      nestedFields: parseFields(property, toArray(property.required), path),
    }
  }

  return {
    name,
    type,
    required,
    ref,
    path,
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

function buildNodes(collections: ParsedCollection[]): CollectionNode[] {
  const graph = new dagre.graphlib.Graph()

  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({
    rankdir: 'LR',
    nodesep: 72,
    ranksep: 120,
    marginx: 24,
    marginy: 24,
  })

  for (const collection of collections) {
    graph.setNode(collection.collection, {
      width: NODE_WIDTH,
      height: NODE_HEADER_HEIGHT + collection.fields.length * NODE_ROW_HEIGHT,
    })
  }

  for (const collection of collections) {
    for (const field of collection.fields) {
      if (!field.ref) {
        continue
      }

      graph.setEdge(collection.collection, field.ref)
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

function buildEdges(collections: ParsedCollection[]): DiagramEdge[] {
  const edges: DiagramEdge[] = []
  const collectionLookup = new Map(
    collections.map((collection) => [collection.collection, collection]),
  )

  for (const collection of collections) {
    for (const field of collection.fields) {
      if (!field.ref) {
        continue
      }

      const targetCollection = collectionLookup.get(field.ref)
      const targetFieldPath = targetCollection
        ? findTargetFieldPath(targetCollection)
        : '_id'

      edges.push({
        id: `${collection.collection}-${field.name}-${field.ref}`,
        source: collection.collection,
        target: field.ref,
        sourceHandle: `source-${field.path}`,
        targetHandle: `target-${targetFieldPath}`,
        type: 'smoothstep',
        data: {
          sourceFieldKey: `${collection.collection}:${field.path}`,
          targetFieldKey: `${field.ref}:${targetFieldPath}`,
          sourceFieldPath: field.path,
          targetFieldPath,
        },
      })
    }
  }

  return edges
}

export function parseMongoSchemaInput(input: string): {
  collections: ParsedCollection[]
  nodes: CollectionNode[]
  edges: DiagramEdge[]
} {
  const parsed = JSON.parse(input) as MongoSchemaInput
  const documents = Array.isArray(parsed) ? parsed : [parsed]
  const collections = documents.map(parseCollection)

  return {
    collections,
    nodes: buildNodes(collections),
    edges: buildEdges(collections),
  }
}
