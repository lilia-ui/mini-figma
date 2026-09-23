import { useMemo, useState } from 'react'
import { TOOL_SHORTCUTS } from './constants/tools'
import { Canvas } from './components/Canvas'
import { LayersPanel } from './components/LayersPanel'
import { PropertiesPanel } from './components/PropertiesPanel'
import { Toolbar } from './components/Toolbar'
import { useHotkeys } from './hooks/useHotkeys'
import { useShapes } from './hooks/useShapes'
import { useViewport } from './hooks/useViewport'
import type { Tool } from './types/shape'

function App() {
  const [activeTool, setActiveTool] = useState<Tool>('select')
  const {
    viewport,
    containerRef,
    isSpacePressed,
    isPanning,
    startPanning,
    panTo,
    stopPanning,
    zoomBy,
    centerViewport,
  } = useViewport()
  const {
    shapes,
    selectedShapeIds,
    draggingShapeId,
    createShapeFromDrag,
    updateShape,
    selectShape,
    clearSelection,
    startShapeDrag,
    moveShapeDrag,
    endShapeDrag,
    cancelShapeDrag,
    undo,
    redo,
  } = useShapes()
  const hotkeyHandlers = useMemo(() => {
    const handlers: Record<string, () => void> = {}

    Object.entries(TOOL_SHORTCUTS).forEach(([shortcut, tool]) => {
      handlers[shortcut] = () => setActiveTool(tool)
    })

    return {
      ...handlers,
      'ctrl+z': undo,
      'ctrl+shift+z': redo,
    }
  }, [redo, undo])

  useHotkeys(hotkeyHandlers)

  const selectedShape =
    selectedShapeIds.length === 1
      ? (shapes.find((shape) => shape.id === selectedShapeIds[0]) ?? null)
      : null

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[#eef1f3] font-sans text-slate-900 antialiased">
      <Canvas
        containerRef={containerRef}
        viewport={viewport}
        activeTool={activeTool}
        shapes={shapes}
        selectedShapeIds={selectedShapeIds}
        draggingShapeId={draggingShapeId}
        isSpacePressed={isSpacePressed}
        isPanning={isPanning}
        onStartPanning={startPanning}
        onPan={panTo}
        onStopPanning={stopPanning}
        onCreateShape={createShapeFromDrag}
        onSelectShape={selectShape}
        onStartShapeDrag={startShapeDrag}
        onMoveShapeDrag={moveShapeDrag}
        onEndShapeDrag={endShapeDrag}
        onCancelShapeDrag={cancelShapeDrag}
        onZoomBy={zoomBy}
        onCenterViewport={centerViewport}
        onClearSelection={clearSelection}
      />

      <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />

      <aside className="pointer-events-none absolute right-4 top-4 z-20 flex h-[calc(100dvh-2rem)] w-64 flex-col gap-3 max-lg:w-60">
        <div className="pointer-events-auto">
          <PropertiesPanel
            shape={selectedShape}
            onFillChange={(id, fill) => updateShape(id, { fill })}
          />
        </div>
        <div className="pointer-events-auto flex min-h-0 flex-1">
          <LayersPanel
            shapes={shapes}
            selectedShapeIds={selectedShapeIds}
            onSelectShape={selectShape}
          />
        </div>
      </aside>
    </main>
  )
}

export default App
