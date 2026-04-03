import { useEffect, useRef, useState } from 'react'

const MIN_EDITOR_WIDTH = 24
const MAX_EDITOR_WIDTH = 55
const INITIAL_EDITOR_WIDTH = 33.333

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function useResizableSplit() {
  const [editorWidth, setEditorWidth] = useState(INITIAL_EDITOR_WIDTH)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isResizingRef = useRef(false)

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isResizingRef.current || !containerRef.current) {
        return
      }

      const bounds = containerRef.current.getBoundingClientRect()
      const nextWidth = ((event.clientX - bounds.left) / bounds.width) * 100
      setEditorWidth(clamp(nextWidth, MIN_EDITOR_WIDTH, MAX_EDITOR_WIDTH))
    }

    const handlePointerUp = () => {
      isResizingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [])

  const startResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    isResizingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return {
    editorWidth,
    containerRef,
    startResize,
  }
}
