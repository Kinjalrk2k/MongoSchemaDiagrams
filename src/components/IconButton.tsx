import type { ReactNode } from 'react'
import { Tooltip } from './Tooltip'

type IconButtonProps = {
  icon: ReactNode
  label: string
  onClick: () => void
}

export function IconButton({ icon, label, onClick }: IconButtonProps) {
  return (
    <Tooltip content={label} side="bottom">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#3a4049] bg-[#3b414a] text-slate-200 transition hover:bg-[#4a515b]"
      >
        {icon}
      </button>
    </Tooltip>
  )
}
