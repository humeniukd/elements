import { BaseElement } from './base-el.ts';
import { defineCustomElement } from './utils.ts';

export class ElOptions extends BaseElement {
    static observedAttributes = ["anchor", "open"];
    onAttributeChange(attr: string, _: string, newVal: string) {
        switch (attr) {
            case "open":
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
    getOptionByName(name: string): ElOption | null {
        return this.querySelector(`el-option[value="${name}"]`);
    }
    getItems(): ElOption[] {
        return Array.from(this.querySelectorAll("el-option:not([disabled])"));
    }
}

export class ElOption extends BaseElement {}

defineCustomElement("el-options", ElOptions);
defineCustomElement("el-option", ElOption);
