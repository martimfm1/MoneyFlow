'use client'

import { useEffect } from 'react'

type HapticKind = 'tap' | 'success' | 'error'

function vibrate(kind: HapticKind) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return
  }

  const pattern: number | number[] =
    kind === 'success' ? [10, 36, 14] : kind === 'error' ? [22, 42, 22] : 9

  navigator.vibrate(pattern)
}

function getHapticTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return null

  return target.closest<HTMLElement>(
    'button, a[href], [role="button"], input[type="submit"], input[type="button"], select, summary, [data-haptic]',
  )
}

export function HapticsProvider() {
  useEffect(() => {
    function handlePointerUp(event: PointerEvent) {
      if (event.pointerType === 'mouse') return

      const control = getHapticTarget(event.target)
      if (
        !control ||
        control.hasAttribute('disabled') ||
        control.getAttribute('aria-disabled') === 'true' ||
        control.dataset.haptic === 'none'
      ) {
        return
      }

      const kind = control.dataset.haptic
      vibrate(kind === 'success' || kind === 'error' ? kind : 'tap')
    }

    function handleKeyboardClick(event: MouseEvent) {
      if (event.detail !== 0) return

      const control = getHapticTarget(event.target)
      if (
        !control ||
        control.hasAttribute('disabled') ||
        control.getAttribute('aria-disabled') === 'true' ||
        control.dataset.haptic === 'none'
      ) {
        return
      }

      const kind = control.dataset.haptic
      vibrate(kind === 'success' || kind === 'error' ? kind : 'tap')
    }

    document.addEventListener('pointerup', handlePointerUp, true)
    document.addEventListener('click', handleKeyboardClick, true)

    return () => {
      document.removeEventListener('pointerup', handlePointerUp, true)
      document.removeEventListener('click', handleKeyboardClick, true)
    }
  }, [])

  return null
}
