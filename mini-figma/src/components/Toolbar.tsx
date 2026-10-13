import { Fragment, useMemo, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { TOOL_DEFINITIONS } from '../constants/tools'
import type { Tool } from '../types/shape'

interface ToolbarProps {
  activeTool: Tool
  onToolChange: (tool: Tool) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

type ToolbarItem =
  | {
      kind: 'tool'
      id: string
      label: string
      shortcut: string
      tool: Tool
      isActive: boolean
    }
  | {
      kind: 'action'
      id: string
      label: string
      shortcut: string
      isDisabled: boolean
      onClick: () => void
    }

function ToolIcon({ tool }: { tool: Tool }) {
  const sharedProps = {
    'aria-hidden': true,
    viewBox: '0 0 24 24',
    className: 'size-5',
    fill: 'none',
  }

  if (tool === 'rectangle') {
    return (
      <svg {...sharedProps}>
        <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  }

  if (tool === 'ellipse') {
    return (
      <svg {...sharedProps}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  }

  return (
    <svg {...sharedProps}>
      <path d="m6 3 12 9-6.2 1.2L9 19 6 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  )
}

function HistoryIcon({ action }: { action: 'undo' | 'redo' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor">
      <path
        d={
          action === 'undo'
            ? 'M12.5 8c-2.65 0-5.05.98-6.9 2.6L2 7v7h7l-2.62-2.62A7.6 7.6 0 0 1 12.5 10c3.8 0 6.9 2.6 7.7 6.1l1.9-.5C21 10.6 17.2 8 12.5 8Z'
            : 'M11.5 8c2.65 0 5.05.98 6.9 2.6L22 7v7h-7l2.62-2.62A7.6 7.6 0 0 0 11.5 10c-3.8 0-6.9 2.6-7.7 6.1l-1.9-.5C3 10.6 6.8 8 11.5 8Z'
        }
      />
    </svg>
  )
}

export function Toolbar({
  activeTool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: ToolbarProps) {
  const items: ToolbarItem[] = useMemo(
    () => [
      ...TOOL_DEFINITIONS.map((tool) => ({
        kind: 'tool' as const,
        id: tool.id,
        label: tool.label,
        shortcut: tool.shortcut,
        tool: tool.id,
        isActive: activeTool === tool.id,
      })),
      {
        kind: 'action' as const,
        id: 'undo',
        label: 'Отменить',
        shortcut: 'Ctrl+Z',
        isDisabled: !canUndo,
        onClick: onUndo,
      },
      {
        kind: 'action' as const,
        id: 'redo',
        label: 'Повторить',
        shortcut: 'Ctrl+Shift+Z',
        isDisabled: !canRedo,
        onClick: onRedo,
      },
    ],
    [activeTool, canRedo, canUndo, onRedo, onUndo],
  )

  // Roving tabindex: в tab-порядок попадает только активный инструмент,
  // остальные достигаются стрелками, как требует паттерн role="toolbar".
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activeToolIndex = items.findIndex(
    (item) => item.kind === 'tool' && item.isActive,
  )

  const focusItemAt = (index: number) => {
    const total = items.length
    const nextIndex = (index + total) % total

    buttonRefs.current[nextIndex]?.focus()
  }

  const handleToolbarKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) => {
    const currentIndex = buttonRefs.current.findIndex(
      (button) => button === document.activeElement,
    )

    if (currentIndex === -1) {
      return
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        focusItemAt(currentIndex + 1)
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        focusItemAt(currentIndex - 1)
        break
      case 'Home':
        focusItemAt(0)
        break
      case 'End':
        focusItemAt(items.length - 1)
        break
      default:
        return
    }

    event.preventDefault()
  }

  return (
    <aside
      aria-label="Панель инструментов"
      className="pointer-events-auto absolute left-4 top-4 z-30 flex w-14 flex-col items-center rounded-2xl border border-slate-200/90 bg-white/94 py-2.5 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur-md"
    >
      <div
        className="mb-3 grid size-9 place-items-center rounded-xl bg-slate-950 text-xs font-bold tracking-tight text-white shadow-sm"
        aria-label="Mini Figma"
        title="Mini Figma"
      >
        M
      </div>

      <div className="h-px w-7 bg-slate-200" />

      <div
        role="toolbar"
        aria-orientation="vertical"
        aria-label="Инструменты"
        className="mt-2 flex flex-col gap-1.5"
        onKeyDown={handleToolbarKeyDown}
      >
        {items.map((item, itemIndex) => {
          const isTool = item.kind === 'tool'
          const isDisabled = isTool ? false : item.isDisabled
          const isActive = isTool && item.isActive
          const isSelectedItem = itemIndex === activeToolIndex

          return (
            <Fragment key={item.id}>
              {item.id === 'undo' ? (
                <div
                  className="my-0.5 h-px w-7 self-center bg-slate-200"
                  aria-hidden="true"
                />
              ) : null}

              <button
                ref={(button) => {
                  buttonRefs.current[itemIndex] = button
                }}
                type="button"
                tabIndex={isSelectedItem ? 0 : -1}
                disabled={isDisabled}
                aria-label={`${item.label}, ${item.shortcut}`}
                aria-pressed={isTool ? isActive : undefined}
                onClick={() => {
                  if (isTool) {
                    onToolChange(item.tool)
                  } else {
                    item.onClick()
                  }
                }}
                className={`group relative grid size-10 place-items-center rounded-xl transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0d9488] ${
                  isActive
                    ? 'bg-[#0d9488] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent'
                }`}
              >
                {isTool ? (
                  <ToolIcon tool={item.tool} />
                ) : (
                  <HistoryIcon action={item.id === 'undo' ? 'undo' : 'redo'} />
                )}
                <span
                  className="pointer-events-none absolute left-[52px] z-40 hidden whitespace-nowrap rounded-md border border-slate-200 bg-slate-950 px-2 py-1.5 text-[11px] font-medium text-white shadow-lg group-hover:block group-focus-visible:block"
                  role="tooltip"
                >
                  {item.label}
                  <kbd className="ml-2 text-slate-400">{item.shortcut}</kbd>
                </span>
              </button>
            </Fragment>
          )
        })}
      </div>

      <div className="mt-auto pt-3 text-[9px] font-bold tracking-wide text-slate-300">
        M.F
      </div>
    </aside>
  )
}
