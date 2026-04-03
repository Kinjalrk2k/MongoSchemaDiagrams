import { create } from 'zustand'
import { applyNodeChanges } from 'reactflow'
import { parseMongoSchemaInput } from '../lib/schemaParser'
import type { CollectionNode, DiagramEdge, ParsedCollection } from '../types'
import type { NodeChange } from 'reactflow'

const LOCAL_STORAGE_KEY = 'mongo-schema-studio:source'

export const starterSchema = JSON.stringify(
  [
    {
      collection: 'users',
      schema: {
        bsonType: 'object',
        required: ['_id', 'email', 'companyId'],
        properties: {
          _id: { bsonType: 'objectId' },
          email: { bsonType: 'string' },
          name: { bsonType: 'string' },
          companyId: { bsonType: 'objectId', __ref: 'companies' },
          postIds: {
            bsonType: 'array',
            items: { bsonType: 'objectId', __ref: 'posts' },
          },
          profile: {
            bsonType: 'object',
            properties: {
              timezone: { bsonType: 'string' },
              bio: { bsonType: 'string' },
            },
          },
        },
      },
    },
    {
      collection: 'companies',
      schema: {
        bsonType: 'object',
        required: ['_id', 'name'],
        properties: {
          _id: { bsonType: 'objectId' },
          name: { bsonType: 'string' },
          plan: { bsonType: 'string' },
        },
      },
    },
    {
      collection: 'posts',
      schema: {
        bsonType: 'object',
        required: ['_id', 'authorId', 'title'],
        properties: {
          _id: { bsonType: 'objectId' },
          authorId: { bsonType: 'objectId', __ref: 'users' },
          title: { bsonType: 'string' },
          tags: {
            bsonType: 'array',
            items: { bsonType: 'string' },
          },
        },
      },
    },
  ],
  null,
  2,
)

type SchemaState = {
  source: string
  collections: ParsedCollection[]
  nodes: CollectionNode[]
  edges: DiagramEdge[]
  error: string | null
  setSource: (source: string) => void
  updateNodes: (changes: NodeChange[]) => void
}

function getInitialState() {
  const initialSource =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? starterSchema
      : starterSchema
  const parsed = parseMongoSchemaInput(initialSource)

  return {
    source: initialSource,
    collections: parsed.collections,
    nodes: parsed.nodes,
    edges: parsed.edges,
    error: null,
  }
}

function mergeNodePositions(
  nextNodes: CollectionNode[],
  previousNodes: CollectionNode[],
): CollectionNode[] {
  const previousNodeMap = new Map(previousNodes.map((node) => [node.id, node]))

  return nextNodes.map((node) => {
    const previousNode = previousNodeMap.get(node.id)

    if (!previousNode) {
      return node
    }

    return {
      ...node,
      position: previousNode.position,
    }
  })
}

export const useSchemaStore = create<SchemaState>((set) => ({
  ...getInitialState(),
  setSource: (source) => {
    set((state) => {
      try {
        const parsed = parseMongoSchemaInput(source)

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(LOCAL_STORAGE_KEY, source)
        }

        return {
          source,
          collections: parsed.collections,
          nodes: mergeNodePositions(parsed.nodes, state.nodes),
          edges: parsed.edges,
          error: null,
        }
      } catch (error) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(LOCAL_STORAGE_KEY, source)
        }

        return {
          ...state,
          source,
          error: error instanceof Error ? error.message : 'Invalid JSON input.',
        }
      }
    })
  },
  updateNodes: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as CollectionNode[],
    }))
  },
}))
