import type { Tool } from '../types/shape'

export const TOOL_DEFINITIONS = [
  {
    id: 'select',
    label: 'Выбрать',
    shortcut: 'V',
  },
  {
    id: 'rectangle',
    label: 'Прямоугольник',
    shortcut: 'R',
  },
  {
    id: 'ellipse',
    label: 'Эллипс',
    shortcut: 'O',
  },
] as const satisfies ReadonlyArray<{
  id: Tool
  label: string
  shortcut: string
}>

export const TOOL_SHORTCUTS = {
  r: 'rectangle',
  o: 'ellipse',
  v: 'select',
} as const satisfies Readonly<Record<string, Tool>>

export function getToolByShortcut(shortcut: string): Tool | undefined {
  const normalizedShortcut = shortcut.toLowerCase()

  if (!Object.hasOwn(TOOL_SHORTCUTS, normalizedShortcut)) {
    return undefined
  }

  return TOOL_SHORTCUTS[
    normalizedShortcut as keyof typeof TOOL_SHORTCUTS
  ]
}
