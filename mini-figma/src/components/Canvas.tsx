import { useRef, useState } from 'react'
import type { RefObject, WheelEvent } from 'react'
import {
  GRID_SIZE,
  WHEEL_ZOOM_SENSITIVITY,
  ZOOM_BUTTON_STEP,
} from '../constants/viewport'
import { DEFAULT_SHAPE_FILL } from '../constants/shapes'
import type {
  Bounds,
  Point,
  Shape as ShapeData,
  ShapeType,
  Tool,
  Viewport,
} from '../types/shape'
import { getShapeBoundsFromDrag } from '../utils/geometry'
import { Shape as CanvasShape } from './Shape'

interface CanvasProps {
  containerRef: RefObject<HTMLDivElement | null>
  viewport: Viewport
  activeTool: Tool
  shapes: ShapeData[]
  selectedShapeIds: string[]
  draggingShapeId: string | null
  isSpacePressed: boolean
  isPanning: boolean
  onStartPanning: (screenPoint: Point) => void
  onPan: (screenPoint: Point) => void
  onStopPanning: () => void
  onCreateShape: (
    type: ShapeType,
    startScreenPoint: Point,
    endScreenPoint: Point,
    viewport: Viewport,
  ) => void
  onSelectShape: (id: string, isMultiSelect?: boolean) => void
  onStartShapeDrag: (
    id: string,
    pointerId: number,
    startScreenPoint: Point,
    viewport: Viewport,
  ) => void
  onMoveShapeDrag: (pointerId: number, currentScreenPoint: Point) => void
  onEndShapeDrag: (pointerId: number) => void
  onCancelShapeDrag: (pointerId: number) => void
  onZoomBy: (factor: number, screenAnchor?: Point) => void
  onCenterViewport: () => void
  onClearSelection: () => void
}

interface CreationState {
  pointerId: number
  type: ShapeType
  startScreenPoint: Point
  currentScreenPoint: Point
}

interface CreationPreview {
  type: ShapeType
  bounds: Bounds
}

export function Canvas({
  containerRef,
  viewport,
  activeTool,
  shapes,
  selectedShapeIds,
  draggingShapeId,
  isSpacePressed,
  isPanning,
  onStartPanning,
  onPan,
  onStopPanning,
  onCreateShape,
  onSelectShape,
  onStartShapeDrag,
  onMoveShapeDrag,
  onEndShapeDrag,
  onCancelShapeDrag,
  onZoomBy,
  onCenterViewport,
  onClearSelection,
}: CanvasProps) {
  const [creationPreview, setCreationPreview] =
    useState<CreationPreview | null>(null)
  const creationRef = useRef<CreationState | null>(null)

  const getScreenPoint = (clientX: number, clientY: number): Point => {
    const bounds = containerRef.current?.getBoundingClientRect()

    return {
      x: clientX - (bounds?.left ?? 0),
      y: clientY - (bounds?.top ?? 0),
    }
  }

  const getPreviewBounds = (
    startScreenPoint: Point,
    endScreenPoint: Point,
  ): Bounds | null => getShapeBoundsFromDrag(startScreenPoint, endScreenPoint, viewport)

  const clearCreation = () => {
    creationRef.current = null
    setCreationPreview(null)
  }

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault()

    const screenPoint = getScreenPoint(event.clientX, event.clientY)
    const zoomFactor = Math.exp(
      -event.deltaY * WHEEL_ZOOM_SENSITIVITY,
    )

    onZoomBy(zoomFactor, screenPoint)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return
    }

    const screenPoint = getScreenPoint(event.clientX, event.clientY)

    if (isSpacePressed) {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      onStartPanning(screenPoint)
      return
    }

    if (activeTool !== 'select') {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      creationRef.current = {
        pointerId: event.pointerId,
        type: activeTool,
        startScreenPoint: screenPoint,
        currentScreenPoint: screenPoint,
      }
      setCreationPreview(null)
      return
    }

    if (event.target === event.currentTarget) {
      onClearSelection()
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const creation = creationRef.current

    if (creation && creation.pointerId === event.pointerId) {
      creation.currentScreenPoint = getScreenPoint(
        event.clientX,
        event.clientY,
      )
      const bounds = getPreviewBounds(
        creation.startScreenPoint,
        creation.currentScreenPoint,
      )
      setCreationPreview(
        bounds ? { type: creation.type, bounds } : null,
      )
      return
    }

    if (!isPanning) {
      return
    }

    onPan(getScreenPoint(event.clientX, event.clientY))
  }

  const releasePointerCapture = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const creation = creationRef.current

    if (creation && creation.pointerId === event.pointerId) {
      const endScreenPoint = getScreenPoint(event.clientX, event.clientY)
      creation.currentScreenPoint = endScreenPoint
      clearCreation()
      releasePointerCapture(event)
      onCreateShape(
        creation.type,
        creation.startScreenPoint,
        endScreenPoint,
        viewport,
      )
      onStopPanning()
      return
    }

    releasePointerCapture(event)
    onStopPanning()
  }

  const handlePointerCancel = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (creationRef.current?.pointerId === event.pointerId) {
      clearCreation()
    }

    releasePointerCapture(event)
    onStopPanning()
  }

  const handleLostPointerCapture = () => {
    if (creationRef.current) {
      clearCreation()
    }

    onStopPanning()
  }

  const gridSize = GRID_SIZE * viewport.zoom
  const cursor =
    isPanning || draggingShapeId
      ? 'grabbing'
      : isSpacePressed
        ? 'grab'
        : activeTool === 'select'
          ? 'default'
          : 'crosshair'

  const previewShape: ShapeData | null = creationPreview
    ? {
        id: 'creation-preview',
        name: '',
        type: creationPreview.type,
        fill: DEFAULT_SHAPE_FILL,
        ...creationPreview.bounds,
      }
    : null

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      aria-label="Бесконечный холст"
      className="absolute inset-0 touch-none overflow-hidden bg-[#eef1f3] outline-none select-none focus-visible:ring-2 focus-visible:ring-[#0d9488]/35 focus-visible:ring-inset"
      style={{ cursor }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostPointerCapture}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(51, 65, 85, 0.28) 1px, transparent 1.2px)',
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          opacity: Math.min(1, Math.max(0.32, viewport.zoom)),
        }}
      />

      <div
        aria-label="Слой фигур"
        className="pointer-events-none absolute left-0 top-0 origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 size-6 rounded-full border-2 border-[#0d9488]/45 bg-white/80 shadow-sm"
          style={{
            transform: `translate(-50%, -50%) scale(${1 / viewport.zoom})`,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 h-px w-12 bg-[#0d9488]/25"
          style={{
            transform: `translate(-50%, -50%) scale(${1 / viewport.zoom})`,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 h-12 w-px bg-[#0d9488]/25"
          style={{
            transform: `translate(-50%, -50%) scale(${1 / viewport.zoom})`,
          }}
        />

        {shapes.map((shape) => (
          <CanvasShape
            key={shape.id}
            shape={shape}
            viewport={viewport}
            isSelected={selectedShapeIds.includes(shape.id)}
            isSelectable={activeTool === 'select' && !isSpacePressed}
            isDragging={draggingShapeId === shape.id}
            onSelect={onSelectShape}
            onDragStart={(id, pointerId, clientPoint) =>
              onStartShapeDrag(
                id,
                pointerId,
                getScreenPoint(clientPoint.x, clientPoint.y),
                viewport,
              )
            }
            onDragMove={(_id, pointerId, clientPoint) =>
              onMoveShapeDrag(
                pointerId,
                getScreenPoint(clientPoint.x, clientPoint.y),
              )
            }
            onDragEnd={(_id, pointerId) => onEndShapeDrag(pointerId)}
            onDragCancel={(_id, pointerId) =>
              onCancelShapeDrag(pointerId)
            }
          />
        ))}

        {previewShape && (
          <CanvasShape
            shape={previewShape}
            viewport={viewport}
            isSelected={false}
            isPreview
          />
        )}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-[84px] z-20 hidden items-center gap-2 rounded-lg border border-slate-200/80 bg-white/88 px-3 py-2 text-[11px] font-medium text-slate-500 shadow-sm backdrop-blur-md sm:flex">
        <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-slate-600 shadow-[0_1px_0_#cbd5e1]">
          Space
        </kbd>
        <span>+ мышь — панорамирование</span>
      </div>

      <div
        className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-slate-200/80 bg-white/90 p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-md"
        aria-label="Управление масштабом"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="grid size-9 place-items-center rounded-lg text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0d9488]"
          aria-label="Уменьшить масштаб"
          onClick={() => onZoomBy(1 / ZOOM_BUTTON_STEP)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
          >
            <path d="M5 10h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <span
          aria-live="polite"
          className="min-w-14 text-center text-xs font-semibold tabular-nums text-slate-700"
        >
          {Math.round(viewport.zoom * 100)}%
        </span>

        <button
          type="button"
          className="grid size-9 place-items-center rounded-lg text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0d9488]"
          aria-label="Увеличить масштаб"
          onClick={() => onZoomBy(ZOOM_BUTTON_STEP)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
          >
            <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <div className="mx-0.5 h-5 w-px bg-slate-200" />

        <button
          type="button"
          className="grid size-9 place-items-center rounded-lg text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0d9488]"
          aria-label="Центрировать холст"
          onClick={onCenterViewport}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
          >
            <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 2v3M10 15v3M2 10h3M15 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
