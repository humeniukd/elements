import type { ScrollLockStep } from './scroll-lock-step'

export function preventScroll(): ScrollLockStep {
  return {
    before({ doc, d }) {
      d.style(doc.documentElement, 'overflow', 'hidden')
    },
  }
}
