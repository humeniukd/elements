import type { Disposables } from '../disposables';

export interface Context {
    doc: Document
    d: Disposables
}

export interface ScrollLockStep {
    before?: (ctx: Context) => void
    after?: (ctx: Context) => void
}
