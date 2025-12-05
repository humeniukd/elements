import { BaseElement } from './lib/base-el';
import { type Transition, transition } from './lib/transition';
import { getAutoId } from './lib/get-auto-id';
import { defineCustomElement } from './lib/utils';

class Accordion extends BaseElement {
    static _observedAttributes = ['hidden', 'open']
    #transition: Transition
    #getTriggers() {
        return document.querySelectorAll(`[commandfor="${this.id}"]`);
    }

    constructor() { //@ts-expect-error
        super(...arguments);
        this.#transition = transition(this);
    }
    _mount(signal: AbortSignal) {
        this.id ||= getAutoId('disclosure');

        if (this.hasAttribute('hidden')) {
            this._removeAttributeNoCallbacks('open');
        } else {
            this._setAttributeNoCallbacks('open', '');
        }

        let isOpen = !this.hasAttribute('hidden');
        for (let trigger of this.#getTriggers()) {
            trigger.setAttribute('aria-expanded', isOpen.toString());
            trigger.setAttribute('aria-controls', this.id);
        }

        this.addEventListener('command', (e: Event) => {
            const supported = e.target instanceof HTMLElement && 'command' in e;
            if (!supported) return;
            switch (e.command) {
                case '--show': {
                    this.expand();
                    e.preventDefault();
                    break;
                }
                case '--hide': {
                    this.collapse();
                    e.preventDefault();
                    break;
                }
                case '--toggle': {
                    this.toggle();
                    e.preventDefault();
                    break;
                }
            }
        }, { signal });
        signal.addEventListener('abort', () => this.#transition._abort());
    }
    _onAttributeChange(name: string, _: unknown, newVal: string) {
        switch (name) {
            case 'hidden': {
                if (newVal === null)
                    this._setAttributeNoCallbacks('open', '');
                else
                    this._removeAttributeNoCallbacks('open');

                for (let trigger of this.#getTriggers())
                    trigger.setAttribute('aria-expanded', newVal === null ? 'true' : 'false');

                if (newVal === null)
                    this.#transition._start('in');
                else
                    this.#transition._start('out');
                break;
            }
            case 'open': {
                if (newVal === null)
                    this.collapse();
                else
                    this.expand();
                break;
            }
        }
    }
    expand() {
        this.removeAttribute('hidden');
    }
    collapse() {
        this.setAttribute('hidden', '');
    }
    toggle() {
        if (this.hasAttribute('hidden'))
            this.expand();
        else
            this.collapse();
    }
}

defineCustomElement('ce-accordion', Accordion);
