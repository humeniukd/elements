import { BaseElement } from './lib/base-el';
import { getAutoId } from './lib/get-auto-id';
import { First, type FocusCode, focusTo, Last, Next, Nothing, Previous } from './lib/focus-to';
import { focusableSelector } from './lib/focusable-selector';
import { defineCustomElement } from './lib/utils';
import { applyWidthStyle } from './lib/apply-width-style';
import { SelectQuery, type SelectQueryHelper } from './lib/select-query';

class Dropdown extends BaseElement {
    _getButton() {
        const button = this.querySelector('button');
        if (!button)
            throw new Error('[Dropdown] No `<button>` element found');
        return button;
    }
    _mount(signal: AbortSignal) {
        const button = this._getButton();
        button.id ||= getAutoId('dropdown-button');
        applyWidthStyle(button, '--button-width', signal, this);
        const labels: NodeListOf<HTMLLabelElement> = this.querySelectorAll('label');
        for (let label of labels)
            label.setAttribute('for', button.id);
    }
}

class Menu extends BaseElement {
    static _observedAttributes = ['anchor', 'open'];

    #search: SelectQueryHelper | null;
    constructor() { // @ts-expect-error
        super(...arguments);
        this.#search = null
    }
    _mount(signal: AbortSignal) {
        this.#search = SelectQuery(this, {
            _role: 'menu',
            _getItems: () => this._getItems(),
            _onItemClick: () => this.hidePopover(),
            _getButton: () => this._getDropdown()._getButton(),
            _onBeforeOpen: () => this._onBeforeOpen(),
            _onBeforeClose: () => this._onBeforeClose()
        }, signal);

        let button: HTMLButtonElement = this._getDropdown()._getButton();
        button.addEventListener('keydown', (e: KeyboardEvent) => {
            if (button.disabled) return;
            switch (e.key) {
                case 'ArrowDown': {
                    this.showPopover();
                    this._goToItem(First);
                    e.preventDefault();
                    break;
                }
                case 'ArrowUp': {
                    this.showPopover();
                    this._goToItem(Last);
                    e.preventDefault();
                    break;
                } //@ts-expect-error
                case ' ':
                    if (this.hasAttribute('open') && this.#search?._hasQuery()) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.#search?._searchByKey(e.key);
                        break;
                    }
                case 'Enter': {
                    e.preventDefault();
                    if (this.hasAttribute('open'))
                        this.hidePopover();
                    else {
                        this.showPopover();
                        this._goToItem(First);
                    }
                    break;
                }
                default: {
                    if (!this.hasAttribute('open')) return;
                    if (e.key.length !== 1 || [e.ctrlKey, e.altKey, e.metaKey].some(Boolean))
                        return;
                    e.preventDefault();
                    e.stopPropagation();
                    this.#search?._searchByKey(e.key);

                }
            }
        }, { signal });

        this.addEventListener('keydown', (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    e.stopPropagation();
                    return this._goToItem(Next);
                case 'ArrowUp':
                    e.preventDefault();
                    e.stopPropagation();
                    return this._goToItem(Previous);
                case 'Home':
                case 'PageUp':
                    e.preventDefault();
                    e.stopPropagation();
                    return this._goToItem(First);
                case 'End':
                case 'PageDown':
                    e.preventDefault();
                    e.stopPropagation();
                    return this._goToItem(Last); // @ts-expect-error
                case ' ':
                    if (!this.#search?._hasQuery()) return;
                    e.preventDefault();
                    e.stopPropagation();
                    this.#search?._searchByKey(e.key);
                case 'Enter': {
                    e.preventDefault();
                    e.stopPropagation();
                    let activeItem = this._getActiveItem();
                    return activeItem ? activeItem.click() : this.hidePopover();
                }
                case 'Tab': {
                    this.#search?._skipNextBlur();
                    break;
                }
                case 'Escape': {
                    e.preventDefault();
                    e.stopPropagation();
                    this.hidePopover();
                    button.focus();
                    break;
                }
                default: {
                    if (e.key.length !== 1 || [e.ctrlKey, e.altKey, e.metaKey].some(Boolean))
                        return;
                    e.preventDefault();
                    e.stopPropagation();
                    this.#search?._searchByKey(e.key);
                }
            }
        }, { signal });
    }
    _onBeforeOpen() {
        let button = this._getDropdown()._getButton();

        let tabIndex = button.dataset.originalTabIndex;
        if (tabIndex)
            button.dataset.originalTabIndex = tabIndex;
        button.setAttribute('tabIndex', '-1');

        if (this._getActiveItem() === null) {
            this.setAttribute('tabIndex', '0');
            setTimeout(() => this.focus({ preventScroll: true }));
        }
    }
    _onBeforeClose() {
        let button: HTMLElement = this._getDropdown()._getButton();
        let tabIndex = button.dataset.originalTabIndex;
        delete button.dataset.originalTabIndex;
        if (tabIndex !== undefined)
            button.setAttribute('tabIndex', tabIndex);
        else
            button.removeAttribute('tabIndex');
        this._getActiveItem()?.setAttribute('tabIndex', '-1');
    }
    _goToItem(code: FocusCode = Nothing) {
        let items = this._getItems();
        if (!items.length)
            return;
        let prevActive: HTMLElement | null = this._getActiveItem();
        let activeItem = focusTo(items, prevActive, code);
        if (activeItem)
            this._setActiveItem(activeItem);
    }
    _setActiveItem(item: HTMLElement) {
        this.#search?._setFound(item);
    }
    _clearActiveItem() {
        this.#search?._clearFound();
    }
    _getDropdown() {
        let dropdown: Dropdown | null = this.closest('ce-dropdown');
        if (!dropdown)
            throw new Error('[Menu] No `<ce-dropdown>` element found');
        return dropdown;
    }
    _getItems(): HTMLElement[] {
        return Array.from(this.querySelectorAll(`${focusableSelector},[role="menuitem"]`));
    }
    _getActiveItem() {
        return this.#search?._getFound() || null;
    }
    _onAttributeChange(name: string, _: string, newVal: string) {
        if (name === 'open')
            newVal === null ? this.hidePopover() : this.showPopover();
    }
}

defineCustomElement('ce-menu', Menu);
defineCustomElement('ce-dropdown', Dropdown);
