import { DEFAULT_SHAPE_FILL } from '../constants/shapes'
import type { Shape } from '../types/shape'

interface PropertiesPanelProps {
  shape: Shape | null
  onFillChange?: (id: string, fill: string) => void
}

interface CoordinateFieldProps {
  label: string
  value: number | undefined
  disabled: boolean
}

function CoordinateField({ label, value, disabled }: CoordinateFieldProps) {
  return (
    <label className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2">
      <span className="text-[10px] font-bold text-slate-400">{label}</span>
      <input
        aria-label={`Координата ${label}`}
        value={value === undefined ? '—' : Math.round(value)}
        readOnly
        disabled={disabled}
        className="min-w-0 flex-1 bg-transparent text-right text-xs font-medium tabular-nums text-slate-700 outline-none disabled:text-slate-300"
      />
    </label>
  )
}

export function PropertiesPanel({ shape, onFillChange }: PropertiesPanelProps) {
  const isDisabled = shape === null
  const fill = shape?.fill ?? DEFAULT_SHAPE_FILL

  return (
    <section
      aria-labelledby="properties-title"
      className="shrink-0 rounded-2xl border border-slate-200/90 bg-white/94 shadow-[0_16px_40px_rgba(15,23,42,0.10)] backdrop-blur-md"
    >
      <header className="flex h-12 items-center justify-between border-b border-slate-100 px-4">
        <h2
          id="properties-title"
          className="text-xs font-semibold tracking-wide text-slate-800"
        >
          Свойства
        </h2>
        <span className="rounded-md bg-slate-100 px-1.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
          Скоро
        </span>
      </header>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          <CoordinateField label="X" value={shape?.x} disabled={isDisabled} />
          <CoordinateField label="Y" value={shape?.y} disabled={isDisabled} />
          <CoordinateField label="W" value={shape?.width} disabled={isDisabled} />
          <CoordinateField label="H" value={shape?.height} disabled={isDisabled} />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2">
          <label
            className="text-[11px] font-medium text-slate-500"
            htmlFor="shape-fill"
          >
            Заливка
          </label>
          <div className="flex items-center gap-2">
            <input
              id="shape-fill"
              type="color"
              aria-label="Цвет заливки выбранной фигуры"
              value={fill}
              disabled={isDisabled}
              onChange={(event) => {
                if (shape) {
                  onFillChange?.(shape.id, event.target.value)
                }
              }}
              className="size-5 cursor-pointer rounded border border-slate-300 bg-white p-0.5 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="text-[11px] font-medium tabular-nums text-slate-600">
              {shape?.fill ?? '—'}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
