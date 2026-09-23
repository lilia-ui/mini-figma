import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Point, Shape as ShapeData, Viewport } from '../types/shape'

interface ShapeProps {
  shape: ShapeData
  viewport: Viewport
  isSelected: boolean
  isSelectable?: boolean
  isPreview?: boolean
  isDragging?: boolean
  onSelect?: (id: string, isMultiSelect?: boolean) => void
  onDragStart?: (
    id: string,
    pointerId: number,
    clientPoint: Point,
  ) => void
  onDragMove?: (
    id: string,
    pointerId: number,
    clientPoint: Point,
  ) => void
  onDragEnd?: (id: string, pointerId: number) => void
  onDragCancel?: (id: string, pointerId: number) => void
}

const SELECTION_MARKER_SIZE = 8
const SELECTION_MARKER_POSITIONS = [
  { x: 0, y: 0 },
  { x: 0.5, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 0.5 },
  { x: 1, y: 1 },
  { x: 0.5, y: 1 },
  { x: 0, y: 1 },
  { x: 0, y: 0.5 },
] as const

function getClientPoint(
  event: ReactPointerEvent<HTMLDivElement>,
): Point {
  return {
    x: event.clientX,
    y: event.clientY,
  }
}

export function Shape({
  shape,
  viewport,
  isSelected,
  isSelectable = false,
  isPreview = false,
  isDragging = false,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
}: ShapeProps) {
  const selectionWidth = 1.5 / viewport.zoom
  const markerSize = SELECTION_MARKER_SIZE / viewport.zoom
  const markerRadius = 1.5 / viewport.zoom
  const isInteractive = isSelectable && Boolean(onSelect)
  const canDrag = isInteractive && Boolean(onDragStart)
  const shapeTypeLabel = shape.type === 'rectangle' ? 'прямоугольник' : 'эллипс'

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isInteractive || event.button !== 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onSelect?.(shape.id, event.shiftKey)

    if (canDrag) {
      event.currentTarget.setPointerCapture(event.pointerId)
      onDragStart?.(shape.id, event.pointerId, getClientPoint(event))
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      !canDrag ||
      !event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onDragMove?.(shape.id, event.pointerId, getClientPoint(event))
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canDrag) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onDragMove?.(shape.id, event.pointerId, getClientPoint(event))
    onDragEnd?.(shape.id, event.pointerId)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canDrag) {
      return
    }

    event.stopPropagation()
    onDragCancel?.(shape.id, event.pointerId)
  }

  const handleLostPointerCapture = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (canDrag) {
      onDragCancel?.(shape.id, event.pointerId)
    }
  }

  return (
    <div
      role="img"
      aria-label={`${shape.name || shapeTypeLabel}: ${shapeTypeLabel}${isSelected ? ', выбрана' : ''}`}
      className="absolute"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostPointerCapture}
      style={{
        left: shape.x,
        top: shape.y,
        width: shape.width,
        height: shape.height,
        opacity: isPreview ? 0.72 : 1,
        pointerEvents: isInteractive ? 'auto' : 'none',
        cursor: isInteractive
          ? isDragging
            ? 'grabbing'
            : 'grab'
          : undefined,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          borderRadius: shape.type === 'ellipse' ? '9999px' : '4px',
          backgroundColor: shape.fill,
        }}
      />

      {(isSelected || isPreview) && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            inset: `${-selectionWidth / 2}px`,
            border: `${selectionWidth}px ${
              isSelected ? 'solid' : 'dashed'
            } #0d9488`,
            borderRadius:
              shape.type === 'ellipse' ? '9999px' : `${4 + selectionWidth / 2}px`,
          }}
        />
      )}

      {isSelected &&
        SELECTION_MARKER_POSITIONS.map((position) => (
          <span
            key={`${position.x}-${position.y}`}
            aria-hidden="true"
            className="pointer-events-none absolute border border-[#0d9488] bg-white shadow-sm"
            style={{
              left: `${position.x * 100}%`,
              top: `${position.y * 100}%`,
              width: markerSize,
              height: markerSize,
              borderWidth: Math.max(selectionWidth, 0.75 / viewport.zoom),
              borderRadius: markerRadius,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
    </div>
  )
}
