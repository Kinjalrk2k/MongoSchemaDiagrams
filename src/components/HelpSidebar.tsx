import ReactMarkdown from 'react-markdown'
import { HELP_MARKDOWN } from '../constants/helpContent'

type HelpSidebarProps = {
  isOpen: boolean
  onClose: () => void
}

export function HelpSidebar({ isOpen, onClose }: HelpSidebarProps) {
  return (
    <aside
      className={`overflow-hidden border-l border-[#343942] bg-[#1f232a] transition-all duration-300 ${
        isOpen ? 'w-[340px] opacity-100' : 'w-0 opacity-0'
      }`}
    >
      <div className="flex h-12 items-center justify-between border-b border-[#343942] px-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Help</h2>
          <p className="text-[11px] text-slate-400">Reference guide</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[#3a4049] bg-[#2c313a] px-2 py-1 text-xs text-slate-300"
        >
          Close
        </button>
      </div>
      <div className="markdown-body h-[calc(100%-3rem)] overflow-y-auto px-4 py-4 text-sm text-slate-300">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="mb-4 text-xl font-semibold text-white">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-[0.15em] text-slate-200">
                {children}
              </h2>
            ),
            p: ({ children }) => (
              <p className="mb-3 leading-6 text-slate-400">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="mb-3 list-disc space-y-1 pl-5 text-slate-400">{children}</ul>
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
              <pre className="mb-4 overflow-x-auto rounded-xl border border-[#3a4049] bg-[#1a1d22] p-3 text-[12px] text-slate-300">
                {children}
              </pre>
            ),
          }}
        >
          {HELP_MARKDOWN}
        </ReactMarkdown>
      </div>
    </aside>
  )
}
