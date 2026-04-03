import { useState } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import type { CollectionNodeData, SchemaField } from '../types'

export function CollectionNode({ data }: NodeProps<CollectionNodeData>) {
  return (
    <div className="w-64 overflow-hidden rounded-md border border-[#50535d] bg-[#40414c] shadow-[0_18px_40px_rgba(0,0,0,0.26)]">
      <div className="border-b border-[#2b2b2b] bg-[#232323] px-3 py-2 text-[13px] font-semibold text-white">
        {data.collection}
      </div>
      <div className="divide-y divide-white/5">
        {data.fields.map((field) => (
          <FieldRow
            key={field.path}
            field={field}
            collection={data.collection}
            activeFieldKeys={data.activeFieldKeys ?? []}
          />
        ))}
      </div>
    </div>
  )
}

function FieldRow({
  field,
  collection,
  activeFieldKeys,
  depth = 0,
}: {
  field: SchemaField;
  collection: string;
  activeFieldKeys: string[];
  depth?: number;
}) {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = Boolean(field.nestedFields?.length)
  const isActive = activeFieldKeys.includes(`${collection}:${field.path}`)
  const showHandles = depth === 0

  return (
    <div
      className={`relative transition ${isActive ? 'bg-cyan-400/12' : 'bg-transparent'}`}
    >
      {showHandles && (
        <>
          <Handle
            id={`target-left-${field.path}`}
            type="target"
            position={Position.Left}
            className={`!left-[-5px] !top-[18px] !mt-0 !h-2 !w-2 !-translate-y-1/2 !border !bg-[#2b2b2b] ${
              isActive ? '!border-cyan-300' : '!border-slate-500'
            }`}
          />
          <Handle
            id={`source-left-${field.path}`}
            type="source"
            position={Position.Left}
            className="!left-[-5px] !top-[18px] !mt-0 !h-2 !w-2 !-translate-y-1/2 !border !border-transparent !bg-transparent !opacity-0"
          />
        </>
      )}

      <div
        className="flex items-start justify-between gap-3 px-3 py-1.5"
        style={{ paddingLeft: `${12 + depth * 14}px` }}
      >
        <div className="flex min-w-0 items-start gap-1.5">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              aria-label={
                isOpen ? `Collapse ${field.name}` : `Expand ${field.name}`
              }
              className="mt-[1px] flex h-3.5 w-3.5 items-center justify-center rounded text-[10px] text-slate-300 hover:bg-white/8"
            >
              {isOpen ? '▾' : '▸'}
            </button>
          ) : (
            <span className="block h-3.5 w-3.5 shrink-0" />
          )}

          <div className="min-w-0">
            <p className="truncate font-mono text-[12px] text-slate-100">
              {field.name}
              {field.required && (
                <span className="pt-[2px] text-xs font-semibold leading-none text-rose-400">
                  &nbsp;*
                </span>
              )}
            </p>

            {hasChildren && isOpen && (
              <p className="mt-0.5 text-[10px] text-slate-400">
                {field.nestedFields?.length} properties
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 text-right">
          {field.ref && <span className="text-[10px] text-cyan-300">@</span>}
          <p className="font-mono text-[11px] text-slate-300">{field.type}</p>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="border-t border-white/5 bg-black/8 py-1">
          {field.nestedFields?.map((nestedField) => (
            <FieldRow
              key={nestedField.path}
              field={nestedField}
              collection={collection}
              activeFieldKeys={activeFieldKeys}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {showHandles && (
        <>
          <Handle
            id={`target-right-${field.path}`}
            type="target"
            position={Position.Right}
            className="!right-[-5px] !top-[18px] !mt-0 !h-2 !w-2 !-translate-y-1/2 !border !border-transparent !bg-transparent !opacity-0"
          />
          <Handle
            id={`source-right-${field.path}`}
            type="source"
            position={Position.Right}
            className={`!right-[-5px] !top-[18px] !mt-0 !h-2 !w-2 !-translate-y-1/2 !border !bg-[#2b2b2b] ${
              isActive ? '!border-cyan-300' : '!border-slate-500'
            }`}
          />
        </>
      )}
    </div>
  )
}
