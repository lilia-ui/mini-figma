import { useCallback, useReducer, useRef, useState } from 'react'
import { DEFAULT_SHAPE_FILL } from '../constants/shapes'
import type {
  Point,
  Shape,
  ShapeType,
  Viewport,
} from '../types/shape'
import {
  getCanvasDeltaFromDrag,
  getShapeBoundsFromDrag,
} from '../utils/geometry'

type ShapeChanges = Partial<Omit<Shape, 'id'>>

interface ShapesSnapshot {
  shapes: Shape[]
  selectedShapeIds: string[]
}

interface ShapesHistoryState {
  past: ShapesSnapshot[]
  present: Shape[]
  future: ShapesSnapshot[]
  selectedShapeIds: string[]
}

type ShapesHistoryAction =
  | { type: 'add'; shape: Shape }
  | { type: 'update'; id: string; changes: ShapeChanges }
  | { type: 'select'; id: string; isMultiSelect: boolean }
  | { type: 'clear-selection' }
  | { type: 'preview-drag'; shapes: Shape[] }
  | { type: 'commit-drag'; snapshot: ShapesSnapshot }
  | { type: 'restore-drag'; snapshot: ShapesSnapshot }
  | { type: 'undo' }
  | { type: 'redo' }

interface ShapeDragState {
  pointerId: number
  startScreenPoint: Point
  viewport: Viewport
  initialPositions: ReadonlyMap<string, Point>
  initialSnapshot: ShapesSnapshot
  hasMoved: boolean
}

const INITIAL_HISTORY_STATE: ShapesHistoryState = {
  past: [],
  present: [],
  future: [],
  selectedShapeIds: [],
}

const SHAPE_LABELS: Record<ShapeType, string> = {
  rectangle: 'Прямоугольник',
  ellipse: 'Эллипс',
}

let fallbackShapeId = 0

function createShapeId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  fallbackShapeId += 1
  return `shape-${Date.now()}-${fallbackShapeId}`
}

function createSnapshot(state: ShapesHistoryState): ShapesSnapshot {
  return {
    shapes: state.present,
    selectedShapeIds: state.selectedShapeIds,
  }
}

function commitShapes(
  state: ShapesHistoryState,
  shapes: Shape[],
): ShapesHistoryState {
  return {
    past: [...state.past, createSnapshot(state)],
    present: shapes,
    future: [],
    selectedShapeIds: state.selectedShapeIds,
  }
}

function shapesHistoryReducer(
  state: ShapesHistoryState,
  action: ShapesHistoryAction,
): ShapesHistoryState {
  switch (action.type) {
    case 'add': {
      if (state.present.some((shape) => shape.id === action.shape.id)) {
        return state
      }

      return commitShapes(state, [...state.present, action.shape])
    }

    case 'update': {
      const currentShape = state.present.find((shape) => shape.id === action.id)

      if (!currentShape) {
        return state
      }

      const changeKeys = Object.keys(action.changes) as Array<
        keyof ShapeChanges
      >
      const hasChanges = changeKeys.some(
        (key) => currentShape[key] !== action.changes[key],
      )

      if (!hasChanges) {
        return state
      }

      return commitShapes(
        state,
        state.present.map((shape) =>
          shape.id === action.id ? { ...shape, ...action.changes } : shape,
        ),
      )
    }

    case 'select': {
      if (!action.isMultiSelect) {
        if (
          state.selectedShapeIds.length === 1 &&
          state.selectedShapeIds[0] === action.id
        ) {
          return state
        }

        return { ...state, selectedShapeIds: [action.id] }
      }

      return {
        ...state,
        selectedShapeIds: state.selectedShapeIds.includes(action.id)
          ? state.selectedShapeIds.filter((selectedId) => selectedId !== action.id)
          : [...state.selectedShapeIds, action.id],
      }
    }

    case 'clear-selection': {
      if (state.selectedShapeIds.length === 0) {
        return state
      }

      return { ...state, selectedShapeIds: [] }
    }

    case 'preview-drag': {
      return { ...state, present: action.shapes }
    }

    case 'commit-drag': {
      return {
        past: [...state.past, action.snapshot],
        present: state.present,
        future: [],
        selectedShapeIds: state.selectedShapeIds,
      }
    }

    case 'restore-drag': {
      return {
        ...state,
        present: action.snapshot.shapes,
        selectedShapeIds: action.snapshot.selectedShapeIds,
      }
    }

    case 'undo': {
      const previousSnapshot = state.past.at(-1)

      if (!previousSnapshot) {
        return state
      }

      return {
        past: state.past.slice(0, -1),
        present: previousSnapshot.shapes,
        future: [createSnapshot(state), ...state.future],
        selectedShapeIds: previousSnapshot.selectedShapeIds,
      }
    }

    case 'redo': {
      const nextSnapshot = state.future[0]

      if (!nextSnapshot) {
        return state
      }

      return {
        past: [...state.past, createSnapshot(state)],
        present: nextSnapshot.shapes,
        future: state.future.slice(1),
        selectedShapeIds: nextSnapshot.selectedShapeIds,
      }
    }
  }
}

export function useShapes() {
  const [state, dispatch] = useReducer(
    shapesHistoryReducer,
    INITIAL_HISTORY_STATE,
  )
  const [draggingShapeId, setDraggingShapeId] = useState<string | null>(null)
  const shapeNumberRef = useRef(0)
  const shapeDragRef = useRef<ShapeDragState | null>(null)
  const shapes = state.present
  const selectedShapeIds = state.selectedShapeIds

  const addShape = useCallback((shape: Shape) => {
    dispatch({ type: 'add', shape })
  }, [])

  const updateShape = useCallback((id: string, changes: ShapeChanges) => {
    dispatch({ type: 'update', id, changes })
  }, [])

  const selectShape = useCallback((id: string, isMultiSelect = false) => {
    dispatch({ type: 'select', id, isMultiSelect })
  }, [])

  const clearSelection = useCallback(() => {
    dispatch({ type: 'clear-selection' })
  }, [])

  const startShapeDrag = useCallback(
    (
      id: string,
      pointerId: number,
      startScreenPoint: Point,
      viewport: Viewport,
    ) => {
      if (shapeDragRef.current) {
        return
      }

      const shapeIdsToMove = selectedShapeIds.includes(id)
        ? selectedShapeIds
        : [id]
      const movableShapeIds = new Set(shapeIdsToMove)
      const initialPositions = new Map<string, Point>()

      shapes.forEach((shape) => {
        if (movableShapeIds.has(shape.id)) {
          initialPositions.set(shape.id, {
            x: shape.x,
            y: shape.y,
          })
        }
      })

      if (!initialPositions.has(id)) {
        return
      }

      shapeDragRef.current = {
        pointerId,
        startScreenPoint,
        viewport,
        initialPositions,
        initialSnapshot: {
          shapes,
          selectedShapeIds,
        },
        hasMoved: false,
      }
      setDraggingShapeId(id)
    },
    [selectedShapeIds, shapes],
  )

  const moveShapeDrag = useCallback(
    (pointerId: number, currentScreenPoint: Point) => {
      const drag = shapeDragRef.current

      if (!drag || drag.pointerId !== pointerId) {
        return
      }

      const delta = getCanvasDeltaFromDrag(
        drag.startScreenPoint,
        currentScreenPoint,
        drag.viewport,
      )

      if (delta.x === 0 && delta.y === 0) {
        return
      }

      drag.hasMoved = true
      dispatch({
        type: 'preview-drag',
        shapes: drag.initialSnapshot.shapes.map((shape) => {
          const initialPosition = drag.initialPositions.get(shape.id)

          if (!initialPosition) {
            return shape
          }

          return {
            ...shape,
            x: initialPosition.x + delta.x,
            y: initialPosition.y + delta.y,
          }
        }),
      })
    },
    [],
  )

  const endShapeDrag = useCallback((pointerId: number) => {
    const drag = shapeDragRef.current

    if (drag?.pointerId !== pointerId) {
      return
    }

    shapeDragRef.current = null
    setDraggingShapeId(null)

    if (drag.hasMoved) {
      dispatch({ type: 'commit-drag', snapshot: drag.initialSnapshot })
    }
  }, [])

  const cancelShapeDrag = useCallback((pointerId: number) => {
    const drag = shapeDragRef.current

    if (drag?.pointerId !== pointerId) {
      return
    }

    shapeDragRef.current = null
    setDraggingShapeId(null)
    dispatch({ type: 'restore-drag', snapshot: drag.initialSnapshot })
  }, [])

  const createShapeFromDrag = useCallback(
    (
      type: ShapeType,
      startScreenPoint: Point,
      endScreenPoint: Point,
      viewport: Viewport,
    ) => {
      const bounds = getShapeBoundsFromDrag(
        startScreenPoint,
        endScreenPoint,
        viewport,
      )

      if (!bounds) {
        return null
      }

      shapeNumberRef.current += 1
      const shape: Shape = {
        id: createShapeId(),
        name: `${SHAPE_LABELS[type]} ${shapeNumberRef.current}`,
        type,
        fill: DEFAULT_SHAPE_FILL,
        ...bounds,
      }

      addShape(shape)
      selectShape(shape.id)

      return shape
    },
    [addShape, selectShape],
  )

  const cancelActiveDrag = useCallback(() => {
    const drag = shapeDragRef.current

    if (!drag) {
      return
    }

    shapeDragRef.current = null
    setDraggingShapeId(null)
    dispatch({ type: 'restore-drag', snapshot: drag.initialSnapshot })
  }, [])

  const undo = useCallback(() => {
    cancelActiveDrag()
    dispatch({ type: 'undo' })
  }, [cancelActiveDrag])

  const redo = useCallback(() => {
    cancelActiveDrag()
    dispatch({ type: 'redo' })
  }, [cancelActiveDrag])

  return {
    shapes,
    selectedShapeIds,
    draggingShapeId,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    addShape,
    updateShape,
    createShapeFromDrag,
    selectShape,
    clearSelection,
    startShapeDrag,
    moveShapeDrag,
    endShapeDrag,
    cancelShapeDrag,
    undo,
    redo,
  }
}
