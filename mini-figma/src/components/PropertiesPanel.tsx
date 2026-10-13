import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { DEFAULT_SHAPE_FILL, MIN_SHAPE_SIZE } from '../constants/shapes'
import type { Shape } from '../types/shape'

type GeometryKey = 'x' | 'y' | 'width' | 'height'
type GeometryChanges = Partial<Pick<Shape, GeometryKey>>

interface PropertiesPanelProps {
  shape: Shape | null
  onFillPreview?: (id: string, fill: string) => void
  onFillCommit?: () => void
  onGeometryPreview?: (id: string, changes: GeometryChanges) => void
  onGeometryCommit?: () => void
}

interface NumericFieldProps {
  label: string
  fieldLabel: string
  value: number | undefined
  disabled: boolean
  minimum?: number
  onPreview: (value: number) => void
  onCommit: () => void
}

function noop(): void {}

/**
 * Собирает объект изменений без вычисляемого ключа: так TypeScript видит
 * конкретные поля и не требует подтверждающего приведения типа.
 */
function toGeometryChanges(key: GeometryKey, value: number): GeometryChanges {
  switch (key) {
    case 'x':
      return { x: value }
    case 'y':
      return { y: value }
    case 'width':
      return { width: value }
    case 'height':
      return { height: value }
  }
}

function NumericField({
  label,
  fieldLabel,
  value,
  disabled,
  minimum,
  onPreview,
  onCommit,
}: NumericFieldProps) {
  const formatted = value === undefined ? '—' : String(Math.round(value))
  const [draft, setDraft] = useState(formatted)
  const isEditingRef = useRef(false)
  const appliedRef = useRef<number | undefined>(value)

  // Пока пользователь печатает, поле нельзя возвращать к значению фигуры:
  // иначе ввод «120» проходил бы через промежуточные «1» и «12», и фигура
  // дёргалась бы под курсором. После выхода из поля синхронизация возвращается.
  useEffect(() => {
    if (isEditingRef.current) {
      return
    }

    appliedRef.current = value
    setDraft(formatted)
  }, [formatted, value])

  const handleChange = (nextDraft: string) => {
    isEditingRef.current = true
    setDraft(nextDraft)

    const parsed = Number.parseFloat(nextDraft)

    // Пустое поле, «-», «12e» — промежуточные состояния ввода. Пока число не
    // разобралось, фигуру не трогаем, но напечатанное сохраняем в поле.
    if (!Number.isFinite(parsed)) {
      return
    }

    const rounded = Math.round(parsed)
    const nextValue = minimum === undefined ? rounded : Math.max(minimum, rounded)

    appliedRef.current = nextValue
    onPreview(nextValue)
  }

  const handleCommit = () => {
    isEditingRef.current = false

    // Возвращаем к полю последнее применённое значение, а не то, что осталось
    // в строке: мусорный ввод не должен зависать в поле после ухода фокуса.
    setDraft(
      appliedRef.current === undefined ? '—' : String(appliedRef.current),
    )
    onCommit()
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    event.currentTarget.blur()
  }

  return (
    <label className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2 transition-colors focus-within:border-[#0d9488] focus-within:ring-2 focus-within:ring-[#0d9488]/30">
      <span className="text-[10px] font-bold text-slate-400">{label}</span>
      <input
        aria-label={fieldLabel}
        value={draft}
        disabled={disabled}
        onChange={(event) => handleChange(event.currentTarget.value)}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        className="min-w-0 flex-1 bg-transparent text-right text-xs font-medium tabular-nums text-slate-700 outline-none disabled:text-slate-300"
      />
    </label>
  )
}

export function PropertiesPanel({
  shape,
  onFillPreview,
  onFillCommit,
  onGeometryPreview,
  onGeometryCommit,
}: PropertiesPanelProps) {
  const isDisabled = shape === null
  const fill = shape?.fill ?? DEFAULT_SHAPE_FILL
  const colorInputRef = useRef<HTMLInputElement>(null)
  const shapeIdRef = useRef<string | undefined>(undefined)
  const onFillPreviewRef = useRef(onFillPreview)
  const onFillCommitRef = useRef(onFillCommit)

  useEffect(() => {
    shapeIdRef.current = shape?.id
  }, [shape?.id])

  useEffect(() => {
    onFillPreviewRef.current = onFillPreview
    onFillCommitRef.current = onFillCommit
  })

  // React нормализует onChange нативного input в событие input, которое
  // системный диалог цвета шлёт на каждом шаге. Нативный change приходит
  // один раз при закрытии диалога — по нему и фиксируется правка.
  useEffect(() => {
    const colorInput = colorInputRef.current

    if (!colorInput) {
      return
    }

    const handleCommit = (event: Event) => {
      const shapeId = shapeIdRef.current

      if (shapeId) {
        onFillCommitRef.current?.()
        onFillPreviewRef.current?.(
          shapeId,
          (event.target as HTMLInputElement).value,
        )
      }
    }

    colorInput.addEventListener('change', handleCommit)

    return () => colorInput.removeEventListener('change', handleCommit)
  }, [])

  const handleGeometryPreview = (key: GeometryKey, value: number) => {
    if (shape) {
      onGeometryPreview?.(shape.id, toGeometryChanges(key, value))
    }
  }

  return (
    <section
      aria-labelledby="properties-title"
      className="shrink-0 rounded-2xl border border-slate-200/90 bg-white/94 shadow-[0_16px_40px_rgba(15,23,42,0.10)] backdrop-blur-md"
    >
      <header className="flex h-12 items-center border-b border-slate-100 px-4">
        <h2
          id="properties-title"
          className="text-xs font-semibold tracking-wide text-slate-800"
        >
          Свойства
        </h2>
      </header>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          <NumericField
            label="X"
            fieldLabel="Положение по горизонтали"
            value={shape?.x}
            disabled={isDisabled}
            onPreview={(value) => handleGeometryPreview('x', value)}
            onCommit={onGeometryCommit ?? noop}
          />
          <NumericField
            label="Y"
            fieldLabel="Положение по вертикали"
            value={shape?.y}
            disabled={isDisabled}
            onPreview={(value) => handleGeometryPreview('y', value)}
            onCommit={onGeometryCommit ?? noop}
          />
          <NumericField
            label="W"
            fieldLabel="Ширина фигуры"
            value={shape?.width}
            disabled={isDisabled}
            minimum={MIN_SHAPE_SIZE}
            onPreview={(value) => handleGeometryPreview('width', value)}
            onCommit={onGeometryCommit ?? noop}
          />
          <NumericField
            label="H"
            fieldLabel="Высота фигуры"
            value={shape?.height}
            disabled={isDisabled}
            minimum={MIN_SHAPE_SIZE}
            onPreview={(value) => handleGeometryPreview('height', value)}
            onCommit={onGeometryCommit ?? noop}
          />
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
              ref={colorInputRef}
              type="color"
              aria-label="Цвет заливки выбранной фигуры"
              value={fill}
              disabled={isDisabled}
              onInput={(event) => {
                if (shape) {
                  onFillPreview?.(shape.id, event.currentTarget.value)
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
