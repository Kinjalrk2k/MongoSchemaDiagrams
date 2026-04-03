import type { Edge, Node } from 'reactflow'

export type SchemaField = {
  name: string
  type: string
  required: boolean
  refs?: string[]
  path: string
  description?: string
  defaultValue?: unknown
  enumValues?: unknown[]
  nestedFields?: SchemaField[]
}

export type ParsedCollection = {
  collection: string
  fields: SchemaField[]
}

export type CollectionNodeData = {
  collection: string
  fields: SchemaField[]
  activeFieldKeys?: string[]
  onFieldFocus?: (collection: string, fieldPath: string) => void
  onCollectionFocus?: (collection: string) => void
}

export type CollectionNode = Node<CollectionNodeData, 'collection'>

export type DiagramEdge = Edge<{
  sourceFieldKey: string
  targetFieldKey: string
  sourceFieldPath: string
  targetFieldPath: string
}>

export type MongoSchemaInput =
  | MongoSchemaDocument
  | MongoSchemaDocument[]

export type NodePositionMap = Record<string, { x: number; y: number }>

export type MongoMlWorkspaceDocument = {
  format?: 'mongoml'
  version?: 1
  schema: MongoSchemaInput
  layout?: {
    nodePositions?: NodePositionMap
  }
}

export type MongoSchemaDocument = {
  collection?: string
  name?: string
  $jsonSchema?: MongoJsonSchema
  schema?: MongoJsonSchema
}

export type MongoJsonSchema = {
  bsonType?: string | string[]
  title?: string
  required?: string[]
  properties?: Record<string, MongoJsonSchemaProperty>
}

export type MongoJsonSchemaProperty = MongoJsonSchema & {
  description?: string
  items?: MongoJsonSchemaProperty
  __ref?: string | string[]
  enum?: unknown[]
  default?: unknown
}
