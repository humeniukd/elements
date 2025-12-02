export abstract class BaseElement extends HTMLElement {
    static observedAttributes: string[] = [];

    #abortCtrl;
    #mounted;
    #disableObservation;

    protected mount?(signal: AbortSignal): void;
    protected onAttributeChange?(name: string, oldValue: string, newValue: string): void;

    constructor() { // @ts-expect-error
        super(...arguments);
        this.#abortCtrl = new AbortController();
        this.#mounted = false;
        this.#disableObservation = false;
    }
    connectedCallback() { // @ts-expect-error
        const observedAttributes: string[] = this.constructor?.observedAttributes;
        if (Array.isArray(observedAttributes)) {
            for (let attr of observedAttributes) {
                if (attr in this) continue;

                Object.defineProperty(this, attr, {
                    get() {
                        return this.getAttribute(attr);
                    },
                    set(val) {
                        if (val == null || val === false) {
                            this.removeAttribute(attr);
                        } else {
                            this.setAttribute(attr, val.toString());
                        }
                    }
                });
            }
        }
        this.#mounted = true;

        queueMicrotask(() => {
            if (this.#abortCtrl.signal.aborted) return;
            try {
                this.mount?.(this.#abortCtrl.signal);
            } catch (e) {
                console.error(e);
            }
        });
    }
    disconnectedCallback() {
        this.#abortCtrl.abort();
        this.#abortCtrl = new AbortController();
    }
    setAttributeNoCallbacks(name: string, value: string) {
        try {
            this.#disableObservation = true;
            this.setAttribute(name, value);
        } finally {
            this.#disableObservation = false;
        }
    }
    removeAttributeNoCallbacks(name: string) {
        try {
            this.#disableObservation = true;
            this.removeAttribute(name);
        } finally {
            this.#disableObservation = false;
        }
    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (this.#mounted && !this.#disableObservation && oldValue !== newValue)
            this.onAttributeChange?.(name, oldValue, newValue);
    }
}
