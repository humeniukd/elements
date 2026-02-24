import { BaseElement } from './lib/base-el';
import { defineCustomElement } from './lib/utils';

class Copy extends BaseElement {
    #abortCtrl: AbortController | null;

    constructor() { //@ts-expect-error
        super(...arguments);
        this.#abortCtrl = null;
    }

    _mount(signal: AbortSignal) {

        this.addEventListener('command', async (e: Event) => {
            if (!('command' in e) || e.command !== '--copy')
                return;
            
            // @ts-expect-error
            const source = e.source;

            this.#abortCtrl?.abort();
            this.#abortCtrl = new AbortController();

            let text = this.textContent ?? '';
            try {

                await navigator.clipboard.writeText(text)
                source.dataset.copied = '';

            } catch (e) {
                source.dataset.error = '';
                console.error('Failed to copy text: ', e);
            } finally {

                const timeout = setTimeout(() => {
                    delete source.dataset.copied;
                    delete source.dataset.error;
                }, 2000);

                this.#abortCtrl.signal.addEventListener('abort', () => clearTimeout(timeout), { once: true });
            }
        }, { signal });
    }
}
defineCustomElement('ce-copy', Copy);