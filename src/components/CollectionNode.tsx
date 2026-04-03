import { type ReactNode, useState } from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import type { CollectionNodeData, SchemaField } from "../types";
import { BadgeInfo } from "lucide-react";

export function CollectionNode({ data }: NodeProps<CollectionNodeData>) {
  return (
    <div
      className="w-64 overflow-visible rounded-md border border-[#50535d] bg-[#40414c] shadow-[0_18px_40px_rgba(0,0,0,0.26)]"
      onClick={() => data.onCollectionFocus?.(data.collection)}
    >
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
            onFieldFocus={data.onFieldFocus}
          />
        ))}
      </div>
    </div>
  );
}

function FieldRow({
  field,
  collection,
  activeFieldKeys,
  onFieldFocus,
  depth = 0,
}: {
  field: SchemaField;
  collection: string;
  activeFieldKeys: string[];
  onFieldFocus?: (collection: string, fieldPath: string) => void;
  depth?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = Boolean(field.nestedFields?.length);
  const isActive = activeFieldKeys.includes(`${collection}:${field.path}`);
  const showHandles = depth === 0;
  const hasMetadata =
    Boolean(field.description) ||
    field.defaultValue !== undefined ||
    Boolean(field.enumValues?.length) ||
    Boolean(field.refs?.length);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`relative transition ${isActive ? "bg-cyan-400/12" : "bg-transparent"}`}
    >
      {showHandles && (
        <>
          <Handle
            id={`target-left-${field.path}`}
            type="target"
            position={Position.Left}
            className={`!left-[-5px] !top-[18px] !mt-0 !h-2 !w-2 !-translate-y-1/2 !border !bg-[#2b2b2b] ${
              isActive ? "!border-cyan-300" : "!border-slate-500"
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
        onClick={(event) => {
          event.stopPropagation();
          onFieldFocus?.(collection, field.path);
        }}
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
              {isOpen ? "▾" : "▸"}
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

          {hasMetadata && (
            <button
              type="button"
              aria-label={`Show metadata for ${field.name}`}
              className="flex h-4 w-4 items-center justify-center rounded text-cyan-300 hover:bg-cyan-400/12"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={(event) => {
                event.stopPropagation();
                setShowTooltip((value) => !value);
              }}
            >
              <BadgeInfo size={15} color="#26C6DA" />
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 text-right">
          {field.refs?.length ? (
            <span className="text-[10px] text-cyan-300">@</span>
          ) : null}
          <p className="font-mono text-[11px] text-slate-300">{field.type}</p>
        </div>
      </div>

      {showTooltip && hasMetadata && (
        <div
          className="absolute left-6 top-full z-40 mt-1.5 w-64 rounded-xl border border-[#3a4049] bg-[#171b21] p-3 text-[11px] text-slate-200 shadow-2xl"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="mb-2 flex items-center justify-between border-b border-white/8 pb-2">
            <p className="font-mono text-[11px] text-white">{field.name}</p>
            <span className="rounded bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
              {field.type}
            </span>
          </div>

          <div className="space-y-2">
            {field.description && (
              <MetadataRow
                label="Description"
                value={
                  <span className="whitespace-pre-wrap text-slate-300">
                    {field.description}
                  </span>
                }
              />
            )}

            {field.defaultValue !== undefined && (
              <MetadataRow
                label="Default"
                value={
                  <code className="rounded bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-amber-200">
                    {JSON.stringify(field.defaultValue)}
                  </code>
                }
              />
            )}

            {field.refs?.length ? (
              <MetadataRow
                label="Refs"
                value={
                  <div className="flex flex-wrap gap-1">
                    {field.refs.map((ref) => (
                      <span
                        key={ref}
                        className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-200"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                }
              />
            ) : null}

            {field.enumValues?.length ? (
              <MetadataRow
                label="Enum"
                value={
                  <div className="flex flex-wrap gap-1">
                    {field.enumValues.map((value) => {
                      const key = JSON.stringify(value);

                      return (
                        <span
                          key={key}
                          className="rounded-md border border-white/8 bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-slate-200"
                        >
                          {key}
                        </span>
                      );
                    })}
                  </div>
                }
              />
            ) : null}
          </div>
        </div>
      )}

      {hasChildren && isOpen && (
        <div className="border-t border-white/5 bg-black/8 py-1">
          {field.nestedFields?.map((nestedField) => (
            <FieldRow
              key={nestedField.path}
              field={nestedField}
              collection={collection}
              activeFieldKeys={activeFieldKeys}
              onFieldFocus={onFieldFocus}
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
              isActive ? "!border-cyan-300" : "!border-slate-500"
            }`}
          />
        </>
      )}
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[78px_1fr] items-start gap-2">
      <span className="pt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <div className="min-w-0">{value}</div>
    </div>
  );
}
