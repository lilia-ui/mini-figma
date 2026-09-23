import type { Bounds, Point, Viewport } from '../types/shape'

export function screenToCanvas(
  screenPoint: Point,
  viewport: Viewport,
): Point {
  return {
    x: (screenPoint.x - viewport.x) / viewport.zoom,
    y: (screenPoint.y - viewport.y) / viewport.zoom,
  }
}

export function canvasToScreen(
  canvasPoint: Point,
  viewport: Viewport,
): Point {
  return {
    x: canvasPoint.x * viewport.zoom + viewport.x,
    y: canvasPoint.y * viewport.zoom + viewport.y,
  }
}

export function getCanvasDeltaFromDrag(
  startScreenPoint: Point,
  currentScreenPoint: Point,
  viewport: Viewport,
): Point {
  const startCanvasPoint = screenToCanvas(startScreenPoint, viewport)
  const currentCanvasPoint = screenToCanvas(currentScreenPoint, viewport)

  return {
    x: currentCanvasPoint.x - startCanvasPoint.x,
    y: currentCanvasPoint.y - startCanvasPoint.y,
  }
}

export function zoomViewportAt(
  viewport: Viewport,
  screenAnchor: Point,
  nextZoom: number,
): Viewport {
  const canvasAnchor = screenToCanvas(screenAnchor, viewport)

  return {
    x: screenAnchor.x - canvasAnchor.x * nextZoom,
    y: screenAnchor.y - canvasAnchor.y * nextZoom,
    zoom: nextZoom,
  }
}

export function getShapeBoundsFromDrag(
  startScreenPoint: Point,
  endScreenPoint: Point,
  viewport: Viewport,
  minimumSize = 1,
): Bounds | null {
  const start = screenToCanvas(startScreenPoint, viewport)
  const end = screenToCanvas(endScreenPoint, viewport)
  const width = Math.abs(end.x - start.x)
  const height = Math.abs(end.y - start.y)

  if (width < minimumSize && height < minimumSize) {
    return null
  }

  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.max(width, minimumSize),
    height: Math.max(height, minimumSize),
  }
}
