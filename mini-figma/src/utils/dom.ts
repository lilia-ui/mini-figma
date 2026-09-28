const TYPING_TARGET_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/**
 * Проверяет, что событие пришло из поля ввода или редактируемого узла.
 * Нужна, чтобы не перехватывать сочетания клавиш и пробел во время набора текста.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return target.isContentEditable || TYPING_TARGET_TAGS.has(target.tagName)
}

const SPACE_ACTIVATION_SELECTOR = 'button, a[href], [role="button"]'

/**
 * Проверяет, что элемент сам обрабатывает нажатие пробела.
 * Такие элементы нужно пропускать, иначе перехват пробела для панорамирования
 * ломает их активацию с клавиатуры.
 */
export function isSpaceActivationTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (isTypingTarget(target)) {
    return true
  }

  return target.matches(SPACE_ACTIVATION_SELECTOR)
}
