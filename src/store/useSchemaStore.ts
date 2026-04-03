import { create } from 'zustand'
import { applyNodeChanges } from 'reactflow'
import { layoutCollections, parseMongoSchemaInput } from '../lib/schemaParser'
import type { CollectionNode, DiagramEdge, ParsedCollection } from '../types'
import type { NodeChange } from 'reactflow'

const LOCAL_STORAGE_KEY = 'mongo-schema-studio:workspace'

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
  autoArrange: () => void
}

type PersistedWorkspace = {
  source: string
  lastValidSource: string
  nodePositions: Record<string, { x: number; y: number }>
}

function loadPersistedWorkspace(): PersistedWorkspace {
  if (typeof window === 'undefined') {
    return {
      source: starterSchema,
      lastValidSource: starterSchema,
      nodePositions: {},
    }
  }

  const rawValue = window.localStorage.getItem(LOCAL_STORAGE_KEY)

  if (!rawValue) {
    return {
      source: starterSchema,
      lastValidSource: starterSchema,
      nodePositions: {},
    }
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PersistedWorkspace>

    return {
      source: parsed.source ?? starterSchema,
      lastValidSource: parsed.lastValidSource ?? starterSchema,
      nodePositions: parsed.nodePositions ?? {},
    }
  } catch {
    return {
      source: starterSchema,
      lastValidSource: starterSchema,
      nodePositions: {},
    }
  }
}

function savePersistedWorkspace(payload: PersistedWorkspace) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload))
}

function applyStoredPositions(
  nodes: CollectionNode[],
  nodePositions: Record<string, { x: number; y: number }>,
): CollectionNode[] {
  return nodes.map((node) => ({
    ...node,
    position: nodePositions[node.id] ?? node.position,
  }))
}

function getInitialState() {
  const persistedWorkspace = loadPersistedWorkspace()
  const safeSource = persistedWorkspace.lastValidSource || starterSchema
  const parsed = parseMongoSchemaInput(safeSource)
  const restoredNodes = applyStoredPositions(parsed.nodes, persistedWorkspace.nodePositions)
  const hasInvalidSource = persistedWorkspace.source !== safeSource

  return {
    source: persistedWorkspace.source,
    collections: parsed.collections,
    nodes: restoredNodes,
    edges: parsed.edges,
    error: hasInvalidSource ? 'Invalid JSON input.' : null,
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
      const nodePositions = Object.fromEntries(
        state.nodes.map((node) => [node.id, node.position]),
      )

      try {
        const parsed = parseMongoSchemaInput(source)
        const nextNodes = mergeNodePositions(parsed.nodes, state.nodes)

        savePersistedWorkspace({
          source,
          lastValidSource: source,
          nodePositions: Object.fromEntries(
            nextNodes.map((node) => [node.id, node.position]),
          ),
        })

        return {
          source,
          collections: parsed.collections,
          nodes: nextNodes,
          edges: parsed.edges,
          error: null,
        }
      } catch (error) {
        savePersistedWorkspace({
          source,
          lastValidSource: state.error ? loadPersistedWorkspace().lastValidSource : state.source,
          nodePositions,
        })

        return {
          ...state,
          source,
          error: error instanceof Error ? error.message : 'Invalid JSON input.',
        }
      }
    })
  },
  updateNodes: (changes) => {
    set((state) => {
      const nextNodes = applyNodeChanges(changes, state.nodes) as CollectionNode[]
      const persistedWorkspace = loadPersistedWorkspace()

      savePersistedWorkspace({
        source: state.source,
        lastValidSource: persistedWorkspace.lastValidSource,
        nodePositions: Object.fromEntries(
          nextNodes.map((node) => [node.id, node.position]),
        ),
      })

      return {
        nodes: nextNodes,
      }
    })
  },
  autoArrange: () => {
    set((state) => {
      const laidOut = layoutCollections(state.collections)
      const persistedWorkspace = loadPersistedWorkspace()

      savePersistedWorkspace({
        source: state.source,
        lastValidSource: persistedWorkspace.lastValidSource,
        nodePositions: Object.fromEntries(
          laidOut.nodes.map((node) => [node.id, node.position]),
        ),
      })

      return {
        nodes: laidOut.nodes,
        edges: laidOut.edges,
      }
    })
  },
}))
