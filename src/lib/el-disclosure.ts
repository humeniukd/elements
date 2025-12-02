import { BaseElement } from './base-el';
import { type Transition, transition } from './transition';
import { getAutoId } from './get-auto-id';
import { defineCustomElement } from './utils';

class ElDisclosure extends BaseElement {
    static observedAttributes = ["hidden", "open"]
    #transition: Transition
    #getTriggers() {
        return document.querySelectorAll(`[commandfor="${this.id}"]`);
    }

    constructor() { //@ts-expect-error
        super(...arguments);
        this.#transition = transition(this);
    }
    mount(signal: AbortSignal) {
        this.id ||= getAutoId("disclosure");

        if (this.hasAttribute("hidden")) {
            this.removeAttributeNoCallbacks("open");
        } else {
            this.setAttributeNoCallbacks("open", "");
        }

        let isOpen = !this.hasAttribute("hidden");
        for (let trigger of this.#getTriggers()) {
            trigger.setAttribute("aria-expanded", isOpen.toString());
            trigger.setAttribute("aria-controls", this.id);
        }

        this.addEventListener("command", (e: Event) => {
            const supported = e.target instanceof HTMLElement && "command" in e;
            if (!supported) return;
            switch (e.command) {
                case "--show": {
                    this.show();
                    e.preventDefault();
                    break;
                }
                case "--hide": {
                    this.hide();
                    e.preventDefault();
                    break;
                }
                case "--toggle": {
                    this.toggle();
                    e.preventDefault();
                    break;
                }
            }
        }, { signal });
        signal.addEventListener("abort", () => this.#transition.abort());
    }
    onAttributeChange(name: string, _: unknown, newVal: string) {
        switch (name) {
            case "hidden": {
                if (newVal === null)
                    this.setAttributeNoCallbacks("open", "");
                else
                    this.removeAttributeNoCallbacks("open");

                for (let trigger of this.#getTriggers())
                    trigger.setAttribute("aria-expanded", newVal === null ? "true" : "false");

                if (newVal === null)
                    this.#transition.start("in");
                else
                    this.#transition.start("out");
                break;
            }
            case "open": {
                if (newVal === null)
                    this.hide();
                else
                    this.show();
                break;
            }
        }
    }
    show() {
        this.removeAttribute("hidden");
    }
    hide() {
        this.setAttribute("hidden", "");
    }
    toggle() {
        if (this.hasAttribute("hidden"))
            this.show();
        else
            this.hide();
    }
}

defineCustomElement("el-disclosure", ElDisclosure);
