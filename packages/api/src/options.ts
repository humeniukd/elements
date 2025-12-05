import { BaseElement } from './lib/base-el';
import { defineCustomElement } from './lib/utils';

export class Options extends BaseElement {
    static _observedAttributes = ['open', 'anchor'];
    _onAttributeChange(attr: string, _: string, newVal: string) {
        switch (attr) {
            case 'open':
            {
                if (newVal === null) {
                    this.hidePopover();
                } else {
                    this.showPopover();
                }
                break;
            }
        }
    }
    _getOptionByName(name: string): Option | null {
        return this.querySelector(`ce-option[value="${name}"]`);
    }
    _getItems(): Option[] {
        return Array.from(this.querySelectorAll('ce-option:not([disabled])'));
    }
}

export class Option extends BaseElement {}

defineCustomElement('ce-options', Options);
defineCustomElement('ce-option', Option);
