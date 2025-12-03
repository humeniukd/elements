import { BaseElement } from './base-el';
import { getAutoId } from './get-auto-id';
import { createPopover } from './create-popover';
import { findEventTarget } from './active-element-history';
import { focusElement } from './focus-element';
import { defineCustomElement } from './utils';
import { applyWidthStyle } from './apply-width-style';
import { onPopoverGroupBlur } from './on-popover-group-blur';

class ElPopoverGroup extends BaseElement {
    getPopovers() {
        return Array.from(this.querySelectorAll("* > ce-popover"));
    }
}

class ElPopover extends BaseElement {
    static observedAttributes = ["anchor", "open"];
    mount(signal: AbortSignal) {
        if (!this.id) {
            throw new Error("[ElPopover] No id found for popover (ensure `id` is set)");
        }
        const buttons = this.getButtons();
        for (let button of buttons) {
            button.id ||= getAutoId("popover-button");
            button.addEventListener("keydown", (e: KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    this.togglePopover();
                }
            }, { signal });
        }
        createPopover(this, signal, () => this.getButtons());
        this.setAttribute("tabindex", "-1");
        let group: HTMLElement = this;

        let popoverGroup: ElPopoverGroup | null = this.closest("ce-popover-group");

        if (popoverGroup?.getPopovers().includes(this))
            group = popoverGroup;

        onPopoverGroupBlur(group, buttons, this, signal, () => this.hidePopover());

        let abortController = new AbortController();
        signal.addEventListener("abort", () => abortController.abort());
        this.addEventListener("beforetoggle", (e: ToggleEvent) => {
            if (e.newState === "open") {
                let target = findEventTarget(e, buttons);
                if (target)
                    applyWidthStyle(target, "--button-width", abortController.signal, this);
            } else {
                abortController.abort();
                abortController = new AbortController();
            }
        });
        this.addEventListener("toggle", (e: ToggleEvent) => {
            if (e.newState !== "closed" || e.oldState !== "open") return;
            setTimeout(() => {
                if (!this.contains(document.activeElement) && document.activeElement !== document.body)
                    return;

                let button = findEventTarget(e, buttons);
                if (button?.isConnected && button !== document.activeElement)
                    focusElement(button);
            });
        }, { signal });
    }
    getButtons(): HTMLElement[] {
        let id = this.id;
        let buttons = Array.from(document.querySelectorAll<HTMLElement>(`[popovertarget="${id}"]`));
        if (!buttons)
            throw new Error("[ElPopover] No button found for popover (ensure you add a `<button popovertarget=\"${id}\">` on the page)");
        return buttons;
    }
    onAttributeChange(name: string, _: string, newVal: string) {
        if (name !== "open") return;
        if (newVal === null)
            this.hidePopover();
        else
            this.showPopover();
    }
}

defineCustomElement("ce-popover", ElPopover);
defineCustomElement("ce-popover-group", ElPopoverGroup);
