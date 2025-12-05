import { BaseElement } from './lib/base-el';
import { getAutoId } from './lib/get-auto-id';
import { createPopover } from './lib/create-popover';
import { findEventTarget } from './lib/active-element-history';
import { focusElement } from './lib/focus-element';
import { defineCustomElement } from './lib/utils';
import { applyWidthStyle } from './lib/apply-width-style';
import { onPopoverGroupBlur } from './lib/on-popover-group-blur';

class PopoverGroup extends BaseElement {
    _getPopovers() {
        return Array.from(this.querySelectorAll('* > ce-popover'));
    }
}

class Popover extends BaseElement {
    static _observedAttributes = ['anchor', 'open'];
    _mount(signal: AbortSignal) {
        if (!this.id)
            throw new Error('[Popover] No popover id (ensure "id" is set)');
        const buttons = this._getButtons();
        for (let button of buttons) {
            button.id ||= getAutoId('popover-button');
            button.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.togglePopover();
                }
            }, { signal });
        }
        createPopover(this, signal, () => this._getButtons());
        this.setAttribute('tabindex', '-1');
        let group: HTMLElement = this;

        let popoverGroup: PopoverGroup | null = this.closest('ce-popover-group');

        if (popoverGroup?._getPopovers().includes(this))
            group = popoverGroup;

        onPopoverGroupBlur(group, buttons, this, signal, () => this.hidePopover());

        let abortController = new AbortController();
        signal.addEventListener('abort', () => abortController.abort());
        this.addEventListener('beforetoggle', (e: ToggleEvent) => {
            if (e.newState === 'open') {
                let target = findEventTarget(e, buttons);
                if (target)
                    applyWidthStyle(target, '--button-width', abortController.signal, this);
            } else {
                abortController.abort();
                abortController = new AbortController();
            }
        });
        this.addEventListener('toggle', (e: ToggleEvent) => {
            if (e.newState !== 'closed' || e.oldState !== 'open') return;
            setTimeout(() => {
                if (!this.contains(document.activeElement) && document.activeElement !== document.body)
                    return;

                let button = findEventTarget(e, buttons);
                if (button?.isConnected && button !== document.activeElement)
                    focusElement(button);
            });
        }, { signal });
    }
    _getButtons(): HTMLElement[] {
        let id = this.id;
        let buttons = Array.from(document.querySelectorAll<HTMLElement>(`[popovertarget="${id}"]`));
        if (!buttons)
            throw new Error(`[Popover] No button for popover (ensure you've added a '<button popovertarget="${id}">')`);
        return buttons;
    }
    _onAttributeChange(name: string, _: string, newVal: string) {
        if (name !== 'open') return;
        if (newVal === null)
            this.hidePopover();
        else
            this.showPopover();
    }
}

defineCustomElement('ce-popover', Popover);
defineCustomElement('ce-popover-group', PopoverGroup);
