import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
} from '../constants/viewport'
import type { Point, Viewport } from '../types/shape'
import { zoomViewportAt } from '../utils/geometry'

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const interactiveTags = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

  return target.isContentEditable || interactiveTags.has(target.tagName)
}

export function useViewport() {
  const containerRef = useRef<HTMLDivElement>(null)
  const panOriginRef = useRef<Point | null>(null)
  const hasCenteredRef = useRef(false)

  const [viewport, setViewport] = useState<Viewport>({
    x: 0,
    y: 0,
    zoom: DEFAULT_ZOOM,
  })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)

  const stopPanning = useCallback(() => {
    panOriginRef.current = null
    setIsPanning(false)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || isTypingTarget(event.target)) {
        return
      }

      event.preventDefault()
      setIsSpacePressed(true)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') {
        return
      }

      event.preventDefault()
      setIsSpacePressed(false)
      stopPanning()
    }

    const handleWindowBlur = () => {
      setIsSpacePressed(false)
      stopPanning()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [stopPanning])

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const centerOnce = (width: number, height: number) => {
      if (hasCenteredRef.current || width === 0 || height === 0) {
        return
      }

      hasCenteredRef.current = true
      setViewport((currentViewport) => ({
        ...currentViewport,
        x: width / 2,
        y: height / 2,
      }))
    }

    const bounds = container.getBoundingClientRect()
    centerOnce(bounds.width, bounds.height)

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return
      }

      centerOnce(entry.contentRect.width, entry.contentRect.height)
    })

    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  const startPanning = useCallback((screenPoint: Point) => {
    panOriginRef.current = screenPoint
    setIsPanning(true)
  }, [])

  const panTo = useCallback((screenPoint: Point) => {
    const previousPoint = panOriginRef.current

    if (!previousPoint) {
      return
    }

    const deltaX = screenPoint.x - previousPoint.x
    const deltaY = screenPoint.y - previousPoint.y
    panOriginRef.current = screenPoint

    setViewport((currentViewport) => ({
      ...currentViewport,
      x: currentViewport.x + deltaX,
      y: currentViewport.y + deltaY,
    }))
  }, [])

  const zoomBy = useCallback((factor: number, screenAnchor?: Point) => {
    setViewport((currentViewport) => {
      const bounds = containerRef.current?.getBoundingClientRect()
      const anchor = screenAnchor ?? {
        x: (bounds?.width ?? 0) / 2,
        y: (bounds?.height ?? 0) / 2,
      }
      const nextZoom = clampZoom(currentViewport.zoom * factor)

      return zoomViewportAt(currentViewport, anchor, nextZoom)
    })
  }, [])

  const centerViewport = useCallback(() => {
    const bounds = containerRef.current?.getBoundingClientRect()

    if (!bounds) {
      return
    }

    setViewport((currentViewport) => ({
      ...currentViewport,
      x: bounds.width / 2,
      y: bounds.height / 2,
    }))
  }, [])

  return {
    viewport,
    containerRef,
    isSpacePressed,
    isPanning,
    startPanning,
    panTo,
    stopPanning,
    zoomBy,
    centerViewport,
  }
}
