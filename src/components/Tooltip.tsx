import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  children: ReactNode;
  content: string;
  side?: "top" | "bottom";
};

export function Tooltip({ children, content, side = "top" }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const tooltipId = useId();
  const anchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !anchorRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!anchorRef.current) {
        return;
      }

      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        left: rect.left + rect.width / 2,
        top: side === "bottom" ? rect.bottom + 8 : rect.top - 8,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, side]);

  return (
    <div
      ref={anchorRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <div aria-describedby={open ? tooltipId : undefined}>{children}</div>
      {open &&
        position &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none fixed z-[140] w-max max-w-56 rounded-md border border-[#454c57] bg-[#171b21] px-2.5 py-1.5 text-[11px] font-medium text-slate-100 shadow-2xl"
            style={{
              left: position.left,
              top: position.top,
              transform:
                side === "bottom"
                  ? "translateX(-50%)"
                  : "translate(-50%, -100%)",
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </div>
  );
}
