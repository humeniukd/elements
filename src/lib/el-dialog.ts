import {BaseElement} from "./base-el.js";
import { transition, type Transition } from "./transition";
import {onDisappear} from "./on-disappear";
import {focusElement} from "./focus-element";
import {documentOverflow} from "./overflow";
import {defineCustomElement} from "./utils.js";
import {history} from "./active-element-history.js";
import { originalClose } from './polyfill/dialog';

if (globalThis.window !== undefined) {
    let isSubmitting = false;
    document.addEventListener("submit", (e: SubmitEvent) => {
        if (isSubmitting) {
            isSubmitting = false;
            return;
        }
        let form = e.target as HTMLFormElement;
        if (form && form.method === "dialog") {
            let dialog: ElDialog | null = form.closest("el-dialog");
            if (!dialog?.beforeClose)
                return;
            let res = dialog.beforeClose();
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
    el.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Escape" && !e.defaultPrevented)
            callback(e);
    }, { signal });
}

export class ElDialog extends BaseElement {
    static observedAttributes = ["open"]
    #transition: Transition;
    #abortCtrl: AbortController | null;
    #handleOverflow: VoidFunction | null;
    #isOpen;
    #getPopover() {
        return document.querySelectorAll(`[commandfor="${this.getNativeDialog().id}"]`);
    }
    constructor() { //@ts-expect-error
        super(...arguments);
        this.#abortCtrl = null;
        this.#handleOverflow = null;
        this.#isOpen = true;
        this.#transition = transition(this, () => Array.from(this.querySelectorAll('el-dialog-panel, el-dialog-backdrop')))
    }
    mount(signal: AbortSignal) {
        let nativeDialog = this.getNativeDialog();
        nativeDialog.removeAttribute("open");
        nativeDialog.style.setProperty("right", "const(--el-top-layer-scrollbar-offset, 0px)");

        let open = this.hasAttribute("open");
        for (let l of this.#getPopover())
            l.setAttribute("aria-expanded", open.toString());

        onEscape(nativeDialog, signal, (evt: KeyboardEvent) => {
            evt.preventDefault();
            if (this.dispatchEvent(new Event("cancel", { bubbles: false, cancelable: true })))
                nativeDialog.close();
        });

        let dialogPanel: HTMLElement | null = this.querySelector('el-dialog-panel');
        onDisappear(dialogPanel ?? nativeDialog, signal, () => {
            if (this.hasAttribute("open")) {
                nativeDialog.close();
            }
        });
        let activeEl: HTMLElement | null = null;
        nativeDialog.addEventListener("beforetoggle", evt => {
            if (evt.newState === "open" && evt.oldState === "closed") {
                this.beforeOpen();
            }
            let open = this.hasAttribute("open");
            if (evt.newState === "open" && !open) {
                this.dispatchEvent(new CustomEvent("open", { bubbles: false, cancelable: false }));
                this.setAttribute("open", "");
            } else if (evt.newState === "closed" && open) {
                this.dispatchEvent(new CustomEvent("close", { bubbles: false, cancelable: false }));
                this.removeAttribute("open");
            }
            if (evt.newState === "open" && evt.oldState === "closed") {
                if (history.length > 0 && !activeEl)
                    activeEl = history[0];
            } else if (evt.newState === "closed" && evt.oldState === "open") {
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
        nativeDialog.addEventListener("focusout", evt => {
            if (evt.relatedTarget !== null) return;
            queueMicrotask(() => {
                if (!nativeDialog.contains(nativeDialog.ownerDocument.activeElement))
                    nativeDialog.focus();
            });
        }, { signal });
        signal.addEventListener("abort", () => {
            this.#transition.abort();
            this.#handleOverflow?.();
        });
        if (this.hasAttribute("open"))
            nativeDialog.showModal();
    }
    onAttributeChange(name: string, _: string, newVal: string) {
        if (name !== 'open') return;
        let nativeDialog = this.getNativeDialog();
        for (let el of this.#getPopover())
            el.setAttribute("aria-expanded", newVal !== null ? "true" : "false");

        if (newVal === null) {
            nativeDialog.close();
        } else {
            nativeDialog.showModal();
        }
    }
    getNativeDialog() {
        let dialog = this.querySelector("dialog");
        if (!dialog)
            throw new Error("[ElDialog] No `<dialog>` element found");
        return dialog;
    }
    beforeOpen() {
        this.#isOpen = true;
        if (this.#abortCtrl) {
            this.#abortCtrl.abort();
            this.#abortCtrl = null;
        }
        if (!this.#handleOverflow)
            this.#handleOverflow = documentOverflow(this.ownerDocument);

        if (this.#transition)
            this.#transition.start("in");
    }
    beforeClose(): boolean | Promise<boolean> {
        if (this.#handleOverflow) {
            this.#handleOverflow();
            this.#handleOverflow = null;
        }
        if (this.#abortCtrl)
            return false;

        this.#abortCtrl = new AbortController();
        let signal = this.#abortCtrl.signal;

        return new Promise(res => {
            this.#transition?.start("out", () => {
                if (!signal.aborted) {
                    this.#abortCtrl = null;
                    requestAnimationFrame(() => {
                        let nativeDialog = this.getNativeDialog();
                        let i = nativeDialog.style.cssText;
                        nativeDialog.style.cssText = i + "transition-duration: 0 !important;";
                        originalClose?.apply(nativeDialog);
                        requestAnimationFrame(() => {
                            nativeDialog.style.cssText = i;
                        });
                    });
                    res(true);
                }
            });
        });
    }
    show() {
        this.getNativeDialog().showModal();
    }
    hide({ restoreFocus = true } = {}) {
        this.#isOpen = restoreFocus;
        this.getNativeDialog().close();
    }
}


function onClickOutside(el: HTMLElement, signal: AbortSignal, callback: (e: PointerEvent) => void) {
    let currentTarget: EventTarget | null = null;

    document.addEventListener("pointerdown", (e: PointerEvent) => {
        currentTarget = e.composedPath()[0] || e.target;
    }, true);

    document.addEventListener("click", (e: PointerEvent) => {
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
        let dialog = el.closest("dialog");
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

class ElDialogPanel extends BaseElement {
    mount(signal: AbortSignal) {
        onClickOutside(this, signal, () => {
            let dialog = this.getDialog();
            let nativeDialog = dialog.getNativeDialog();
            if (!nativeDialog.hasAttribute("open"))
                return;

            if (dialog.dispatchEvent(new Event("cancel", { bubbles: false, cancelable: true })))
                nativeDialog.close();
        });
    }
    getDialog(): ElDialog {
        let dialog: ElDialog | null = this.closest("el-dialog");
        if (!dialog)
            throw new Error("[ElDialogPanel] No `<el-dialog>` parent found");
        return dialog;
    }
}

class ElDialogBackdrop extends BaseElement {
    mount() {
        this.setAttribute("inert", "");
    }
}

defineCustomElement("el-dialog", ElDialog);
defineCustomElement("el-dialog-panel", ElDialogPanel);
defineCustomElement("el-dialog-backdrop", ElDialogBackdrop);

