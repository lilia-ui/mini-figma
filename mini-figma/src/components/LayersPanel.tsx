import { TOOL_DEFINITIONS } from '../constants/tools'
import type { Shape } from '../types/shape'

interface LayersPanelProps {
  shapes: Shape[]
  selectedShapeIds: string[]
  onSelectShape: (id: string, isMultiSelect?: boolean) => void
}

export function LayersPanel({
  shapes,
  selectedShapeIds,
  onSelectShape,
}: LayersPanelProps) {
  const layers = [...shapes].reverse()

  return (
    <section
      aria-labelledby="layers-title"
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/94 shadow-[0_16px_40px_rgba(15,23,42,0.10)] backdrop-blur-md"
    >
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-100 px-4">
        <h2
          id="layers-title"
          className="text-xs font-semibold tracking-wide text-slate-800"
        >
          Слои
        </h2>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">
          {shapes.length}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
        {layers.length > 0 ? (
          <ul className="space-y-1" aria-label="Список слоёв">
            {layers.map((shape) => {
              const tool = TOOL_DEFINITIONS.find(
                (definition) => definition.id === shape.type,
              )
              const isSelected = selectedShapeIds.includes(shape.id)

              return (
                <li key={shape.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={(event) =>
                      onSelectShape(shape.id, event.shiftKey)
                    }
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0d9488] ${
                      isSelected
                        ? 'bg-[#0d9488]/10 text-[#0f766e]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`grid size-7 shrink-0 place-items-center rounded-md border border-slate-200 bg-white ${
                        shape.type === 'ellipse' ? 'rounded-full' : ''
                      }`}
                    >
                      <span
                        className="block size-3 border border-slate-400"
                        style={{
                          backgroundColor: shape.fill,
                          borderRadius:
                            shape.type === 'ellipse' ? '9999px' : '2px',
                        }}
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {shape.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {tool?.shortcut}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="flex h-full min-h-32 flex-col items-center justify-center px-5 py-8 text-center">
            <div className="mb-3 grid size-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
              >
                <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="m4 12 8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-xs font-medium text-slate-500">Пока пусто</p>
            <p className="mt-1 text-[11px] leading-4 text-slate-400">
              Фигуры появятся здесь
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
