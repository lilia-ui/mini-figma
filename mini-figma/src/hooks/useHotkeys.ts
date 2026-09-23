import { useEffect } from 'react'

type HotkeyHandlers = Readonly<Record<string, (() => void) | undefined>>

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const interactiveTags = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

  return target.isContentEditable || interactiveTags.has(target.tagName)
}

function getPrimaryKey(event: KeyboardEvent): string {
  const key = event.key.toLowerCase()

  if (/^[a-z]$/.test(key)) {
    return key
  }

  const physicalKey = /^Key([A-Z])$/.exec(event.code)?.[1]

  return physicalKey?.toLowerCase() ?? key
}

function getShortcut(event: KeyboardEvent): string {
  const modifiers: string[] = []

  if (event.ctrlKey || event.metaKey) {
    modifiers.push('ctrl')
  }

  if (event.altKey) {
    modifiers.push('alt')
  }

  if (event.shiftKey) {
    modifiers.push('shift')
  }

  return [...modifiers, getPrimaryKey(event)].join('+')
}

/**
 * Подключает глобальные сочетания клавиш. Названия сочетаний регистронезависимы,
 * а модификаторы указываются в порядке Ctrl/Meta, Alt, Shift.
 */
export function useHotkeys(handlers: HotkeyHandlers = {}): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || isTypingTarget(event.target)) {
        return
      }

      const handler = handlers[getShortcut(event)]

      if (!handler) {
        return
      }

      event.preventDefault()
      handler()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
