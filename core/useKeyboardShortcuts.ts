// ALT-STAGE3-PART22: keyboard shortcut foundation. Deliberately minimal
// per the brief's own guidance ("do not implement dozens of shortcuts");
// this is architecture more than a feature -- a single reusable hook any
// screen can opt into with whichever handlers are contextually
// meaningful for it, rather than a global shortcut registry no one
// screen fully understands.

import { useEffect } from 'react'

export interface KeyboardShortcutHandlers {
  /** Arrow Right -- context-dependent "next" action. */
  onNext?: () => void
  /** Arrow Left -- context-dependent "previous" action. */
  onPrevious?: () => void
  /** Enter -- send/confirm, whatever that means in the current context. */
  onSend?: () => void
  /** Shift+Enter -- Section 13's Send to Both, when meaningful here. */
  onSendBoth?: () => void
  /** Escape -- clear/exit the current contextual mode. */
  onEscape?: () => void
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    function onKeyDown(e: KeyboardEvent) {
      // Never hijack typing -- if focus is in a text input/textarea/
      // contenteditable, these keys should do what they normally do.
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return

      if (e.key === 'ArrowRight' && handlers.onNext) {
        handlers.onNext()
        e.preventDefault()
      } else if (e.key === 'ArrowLeft' && handlers.onPrevious) {
        handlers.onPrevious()
        e.preventDefault()
      } else if (e.key === 'Enter' && e.shiftKey && handlers.onSendBoth) {
        handlers.onSendBoth()
        e.preventDefault()
      } else if (e.key === 'Enter' && handlers.onSend) {
        handlers.onSend()
        e.preventDefault()
      } else if (e.key === 'Escape' && handlers.onEscape) {
        handlers.onEscape()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlers, enabled])
}
