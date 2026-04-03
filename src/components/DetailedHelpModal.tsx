import { CircleX } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { DETAILED_HELP_MARKDOWN } from '../constants/helpContent'
import { Tooltip } from './Tooltip'

type DetailedHelpModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function DetailedHelpModal({
  isOpen,
  onClose,
}: DetailedHelpModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#3a4049] bg-[#171b21] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#343942] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Detailed Help</h2>
            <p className="text-sm text-slate-400">
              Complete guide for authoring schemas and using the diagram workspace
            </p>
          </div>
          <Tooltip content="Close detailed help" side="bottom">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close detailed help"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#3a4049] bg-[#2c313a] text-slate-300 transition hover:bg-[#353b45]"
            >
              <CircleX className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        <div className="overflow-y-auto px-6 py-5 text-sm text-slate-300">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="mb-4 text-2xl font-semibold text-white">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-slate-200">
                  {children}
                </h2>
              ),
              p: ({ children }) => (
                <p className="mb-3 leading-7 text-slate-400">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mb-4 list-disc space-y-1.5 pl-5 text-slate-400">{children}</ul>
              ),
              li: ({ children }) => <li>{children}</li>,
              code: ({ children, className }) =>
                className ? (
                  <code className={className}>{children}</code>
                ) : (
                  <code className="rounded bg-white/6 px-1.5 py-0.5 font-mono text-[12px] text-slate-200">
                    {children}
                  </code>
                ),
              pre: ({ children }) => (
                <pre className="mb-4 overflow-x-auto rounded-xl border border-[#3a4049] bg-[#10141a] p-4 text-[12px] text-slate-300">
                  {children}
                </pre>
              ),
            }}
          >
            {DETAILED_HELP_MARKDOWN}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
