import { TOOL_DEFINITIONS } from '../constants/tools'
import type { Tool } from '../types/shape'

interface ToolbarProps {
  activeTool: Tool
  onToolChange: (tool: Tool) => void
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

export function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
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
      >
        {TOOL_DEFINITIONS.map((tool) => {
          const isActive = activeTool === tool.id

          return (
            <button
              key={tool.id}
              type="button"
              title={`${tool.label} (${tool.shortcut})`}
              aria-label={`${tool.label}, клавиша ${tool.shortcut}`}
              aria-pressed={isActive}
              onClick={() => onToolChange(tool.id)}
              className={`group relative grid size-10 place-items-center rounded-xl transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0d9488] ${
                isActive
                  ? 'bg-[#0d9488] text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <ToolIcon tool={tool.id} />
              <span
                className={`pointer-events-none absolute left-[52px] z-40 hidden whitespace-nowrap rounded-md border border-slate-200 bg-slate-950 px-2 py-1.5 text-[11px] font-medium text-white shadow-lg group-hover:block group-focus-visible:block ${
                  isActive ? 'opacity-0' : ''
                }`}
                role="tooltip"
              >
                {tool.label}
                <kbd className="ml-2 text-slate-400">{tool.shortcut}</kbd>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-auto pt-3 text-[9px] font-bold tracking-wide text-slate-300">
        M.F
      </div>
    </aside>
  )
}
