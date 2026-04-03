import { LayoutGrid, Maximize, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  Background,
  MiniMap,
  Panel,
  ReactFlow,
  type Edge,
  useReactFlow,
} from 'reactflow'
import type { useSchemaStore } from '../store/useSchemaStore'
import { CollectionNode } from './CollectionNode'
import { Tooltip } from './Tooltip'

const nodeTypes = {
  collection: CollectionNode,
}

type FlowViewportProps = {
  nodes: ReturnType<typeof useSchemaStore.getState>['nodes']
  edges: Edge[]
  updateNodes: ReturnType<typeof useSchemaStore.getState>['updateNodes']
  setSelectedEdgeId: (edgeId: string | null) => void
  autoArrange: () => void
}

export function FlowViewport({
  nodes,
  edges,
  updateNodes,
  setSelectedEdgeId,
  autoArrange,
}: FlowViewportProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow()
  const [showMiniMap, setShowMiniMap] = useState(false)
  const hideMiniMapTimerRef = useRef<number | null>(null)
  const previousZoomRef = useRef<number | null>(null)

  useEffect(() => {
    void fitView({ duration: 500, padding: 0.18 })
  }, [fitView, nodes.length, edges.length])

  useEffect(() => {
    return () => {
      if (hideMiniMapTimerRef.current) {
        window.clearTimeout(hideMiniMapTimerRef.current)
      }
    }
  }, [])

  const showMiniMapTemporarily = () => {
    setShowMiniMap(true)

    if (hideMiniMapTimerRef.current) {
      window.clearTimeout(hideMiniMapTimerRef.current)
    }

    hideMiniMapTimerRef.current = window.setTimeout(() => {
      setShowMiniMap(false)
    }, 800)
  }

  const handleMove = (_: unknown, viewport: { x: number; y: number; zoom: number }) => {
    const zoomChanged =
      previousZoomRef.current !== null && previousZoomRef.current !== viewport.zoom

    if (zoomChanged || previousZoomRef.current !== null) {
      showMiniMapTemporarily()
    }

    previousZoomRef.current = viewport.zoom
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={updateNodes}
      onEdgeClick={(_, edge) => {
        setSelectedEdgeId(edge.id)
      }}
      onPaneClick={() => {
        setSelectedEdgeId(null)
      }}
      onMove={handleMove}
      fitView
      minZoom={0.35}
      maxZoom={1.75}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable
      panOnDrag
      panActivationKeyCode={null}
      elevateEdgesOnSelect={false}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{
        style: { stroke: '#94a3b8', strokeWidth: 1.15 },
        type: 'smoothstep',
      }}
    >
      {showMiniMap && (
        <Panel position="bottom-right" className="mb-14 mr-4">
          <div className="rounded-xl border border-[#3a4049] bg-[#202329]/98 p-2 shadow-2xl backdrop-blur">
            <MiniMap
              pannable
              zoomable
              nodeStrokeWidth={2}
              nodeColor="#2d3138"
              nodeBorderRadius={2}
              maskColor="rgba(10, 12, 16, 0.82)"
              style={{
                width: 140,
                height: 90,
                background: '#171a1f',
              }}
            />
          </div>
        </Panel>
      )}
      <Panel position="bottom-center" className="mb-4">
        <div className="flex items-center overflow-hidden rounded-xl border border-white/10 bg-[#1d2128]/95 shadow-xl backdrop-blur">
          <ViewportButton
            label="Zoom Out"
            onClick={() => {
              void zoomOut({ duration: 160 })
              showMiniMapTemporarily()
            }}
          >
            <ZoomOut className="h-4 w-4" />
          </ViewportButton>
          <ViewportButton
            label="Fit View"
            onClick={() => {
              void fitView({ duration: 260, padding: 0.18 })
              showMiniMapTemporarily()
            }}
          >
            <Maximize className="h-4 w-4" />
          </ViewportButton>
          <ViewportButton
            label="Auto-arrange diagram"
            onClick={() => {
              autoArrange()
              window.setTimeout(() => {
                void fitView({ duration: 260, padding: 0.18 })
              }, 0)
            }}
          >
            <LayoutGrid className="h-4 w-4" />
          </ViewportButton>
          <ViewportButton
            label="Zoom In"
            onClick={() => {
              void zoomIn({ duration: 160 })
              showMiniMapTemporarily()
            }}
          >
            <ZoomIn className="h-4 w-4" />
          </ViewportButton>
        </div>
      </Panel>
      <Background color="#566171" gap={18} size={1} />
    </ReactFlow>
  )
}

function ViewportButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Tooltip content={label} side="top">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="flex items-center justify-center border-r border-[#3a4049] px-4 py-2 text-xs font-medium text-slate-200 transition last:border-r-0 hover:bg-[#353b45]"
      >
        {children}
      </button>
    </Tooltip>
  )
}
