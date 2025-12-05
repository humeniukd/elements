import { BaseElement } from './lib/base-el';
import { transition, type Transition } from './lib/transition';
import { onDisappear } from './lib/on-disappear';
import { focusElement } from './lib/focus-element';
import { documentOverflow } from './lib/overflow';
import { defineCustomElement } from './lib/utils';
import { history } from './lib/active-element-history';
import { originalClose } from './lib/dialog-helper';

if (globalThis.window !== undefined) {
    let isSubmitting = false;
    document.addEventListener('submit', (e: SubmitEvent) => {
        if (isSubmitting) {
            isSubmitting = false;
            return;
        }
        let form = e.target as HTMLFormElement;
        if (form && form.method === 'dialog') {
            let dialog: Dialog | null = form.closest('ce-dialog');
            if (!dialog?._beforeClose)
                return;
            let res = dialog._beforeClose();
            if (res !== true) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
            if (typeof res === 'boolean') return;

            res.then(y => {
                if (y) {
                    isSubmitting = true;
                    form.dispatchEvent(e);
                }
            }).catch(console.error);
        }
    }, true);
}

function onEscape(el: HTMLElement, signal: AbortSignal, callback: (e: KeyboardEvent) => void) {
    el.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !e.defaultPrevented)
            callback(e);
    }, { signal });
}

export class Dialog extends BaseElement {
    static _observedAttributes = ['open']
    #transition: Transition;
    #abortCtrl: AbortController | null;
    #handleOverflow: VoidFunction | null;
    #isOpen;
    #getPopover() {
        return document.querySelectorAll(`[commandfor="${this._getNativeDialog().id}"]`);
    }
    constructor() { //@ts-expect-error
        super(...arguments);
        this.#abortCtrl = null;
        this.#handleOverflow = null;
        this.#isOpen = true;
        this.#transition = transition(this, () => Array.from(this.querySelectorAll('ce-dialog-panel, ce-dialog-backdrop')))
    }
    _mount(signal: AbortSignal) {
        let nativeDialog = this._getNativeDialog();
        nativeDialog.removeAttribute('open');
        nativeDialog.style.setProperty('right', 'var(--top-layer-offset-scrollbar, 0px)');

        let open = this.hasAttribute('open');
        for (let l of this.#getPopover())
            l.setAttribute('aria-expanded', open.toString());

        onEscape(nativeDialog, signal, (evt: KeyboardEvent) => {
            evt.preventDefault();
            if (this.dispatchEvent(new Event('cancel', { bubbles: false, cancelable: true })))
                nativeDialog.close();
        });

        let dialogPanel: HTMLElement | null = this.querySelector('ce-dialog-panel');
        onDisappear(dialogPanel ?? nativeDialog, signal, () => {
            if (this.hasAttribute('open')) {
                nativeDialog.close();
            }
        });
        let activeEl: HTMLElement | null = null;
        nativeDialog.addEventListener('beforetoggle', evt => {
            if (evt.newState === 'open' && evt.oldState === 'closed') {
                this._beforeOpen();
            }
            let open = this.hasAttribute('open');
            if (evt.newState === 'open' && !open) {
                this.dispatchEvent(new CustomEvent('open', { bubbles: false, cancelable: false }));
                this.setAttribute('open', '');
            } else if (evt.newState === 'closed' && open) {
                this.dispatchEvent(new CustomEvent('close', { bubbles: false, cancelable: false }));
                this.removeAttribute('open');
            }
            if (evt.newState === 'open' && evt.oldState === 'closed') {
                if (history.length > 0 && !activeEl)
                    activeEl = history[0];
            } else if (evt.newState === 'closed' && evt.oldState === 'open') {
                let isOpen = this.#isOpen;
                setTimeout(() => {
                    if (!isOpen) {
                        if (activeEl === document.activeElement && activeEl?.isConnected)
                            activeEl.blur?.();
                        return;
                    }
                    if (activeEl !== document.activeElement && activeEl?.isConnected)
                        focusElement(activeEl);
                    activeEl = null;
                });
            }
        }, { signal });
        nativeDialog.addEventListener('focusout', evt => {
            if (evt.relatedTarget !== null) return;
            queueMicrotask(() => {
                if (!nativeDialog.contains(nativeDialog.ownerDocument.activeElement))
                    nativeDialog.focus();
            });
        }, { signal });
        signal.addEventListener('abort', () => {
            this.#transition._abort();
            this.#handleOverflow?.();
        });
        if (this.hasAttribute('open'))
            nativeDialog.showModal();
    }
    _onAttributeChange(name: string, _: string, newVal: string) {
        if (name !== 'open') return;
        let nativeDialog = this._getNativeDialog();
        for (let el of this.#getPopover())
            el.setAttribute('aria-expanded', newVal !== null ? 'true' : 'false');

        if (newVal === null) {
            nativeDialog.close();
        } else {
            nativeDialog.showModal();
        }
    }
    _getNativeDialog() {
        let dialog = this.querySelector('dialog');
        if (!dialog)
            throw new Error('[Dialog] No `<dialog>` element found');
        return dialog;
    }
    _beforeOpen() {
        this.#isOpen = true;
        if (this.#abortCtrl) {
            this.#abortCtrl.abort();
            this.#abortCtrl = null;
        }
        if (!this.#handleOverflow)
            this.#handleOverflow = documentOverflow(this.ownerDocument);

        if (this.#transition)
            this.#transition._start('in');
    }
    _beforeClose(): boolean | Promise<boolean> {
        if (this.#handleOverflow) {
            this.#handleOverflow();
            this.#handleOverflow = null;
        }
        if (this.#abortCtrl)
            return false;

        this.#abortCtrl = new AbortController();
        let signal = this.#abortCtrl.signal;

        return new Promise(res => {
            this.#transition?._start('out', () => {
                if (!signal.aborted) {
                    this.#abortCtrl = null;
                    requestAnimationFrame(() => {
                        let nativeDialog = this._getNativeDialog();
                        let css = nativeDialog.style.cssText;
                        nativeDialog.style.cssText = css + 'transition-duration: 0 !important;';
                        originalClose?.apply(nativeDialog);
                        requestAnimationFrame(() => {
                            nativeDialog.style.cssText = css;
                        });
                    });
                    res(true);
                }
            });
        });
    }
    show() {
        this._getNativeDialog().showModal();
    }
    hide({ restoreFocus = true } = {}) {
        this.#isOpen = restoreFocus;
        this._getNativeDialog().close();
    }
}

function onClickOutside(el: HTMLElement, signal: AbortSignal, callback: (e: PointerEvent) => void) {
    let currentTarget: EventTarget | null = null;

    document.addEventListener('pointerdown', (e: PointerEvent) => {
        currentTarget = e.composedPath()[0] || e.target;
    }, true);

    document.addEventListener('click', (e: PointerEvent) => {
        if (currentTarget !== e.target)
            return;
        if (e.target === el) {
            let { clientX, clientY} = e;
            let rect = el.getBoundingClientRect();
            if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom)
                return;
            callback(e);
            return;
        }
        let dialog = el.closest('dialog');
        const target = e.target as Node;
        if (dialog && dialog.contains(target) && !el.contains(target)) {
            callback(e);
            return;
        }
        if (e.target === target.ownerDocument?.documentElement) {
            callback(e);
            return;
        }
    }, { signal, capture: true });
}

class DialogPanel extends BaseElement {
    _mount(signal: AbortSignal) {
        onClickOutside(this, signal, () => {
            let dialog = this._getDialog();
            let nativeDialog = dialog._getNativeDialog();
            if (!nativeDialog.hasAttribute('open'))
                return;

            if (dialog.dispatchEvent(new Event('cancel', { bubbles: false, cancelable: true })))
                nativeDialog.close();
        });
    }
    _getDialog(): Dialog {
        let dialog: Dialog | null = this.closest('ce-dialog');
        if (!dialog)
            throw new Error('[DialogPanel] No `<ce-dialog>` parent found');
        return dialog;
    }
}

class DialogBackdrop extends BaseElement {
    _mount() {
        this.setAttribute('inert', '');
    }
}

defineCustomElement('ce-dialog', Dialog);
defineCustomElement('ce-dialog-panel', DialogPanel);
defineCustomElement('ce-dialog-backdrop', DialogBackdrop);

