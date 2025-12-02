import { BaseElement } from './base-el';
import { getAutoId } from './get-auto-id';
import { type FocusCode, FocusKey, focusTo } from './focus-to';
import { focusableSelector } from './focusable-selector';
import { defineCustomElement } from './utils';
import { applyWidthStyle } from './apply-width-style';
import { SelectQuery, type SelectQueryHelper } from './select-query';

class ElDropdown extends BaseElement {
    getButton() {
        const button = this.querySelector("button");
        if (!button)
            throw new Error("[ElDropdown] No `<button>` element found");
        return button;
    }
    mount(signal: AbortSignal) {
        const button = this.getButton();
        button.id ||= getAutoId("dropdown-button");
        applyWidthStyle(button, "--button-width", signal, this);
        const labels: NodeListOf<HTMLLabelElement> = this.querySelectorAll("label");
        for (let label of labels)
            label.setAttribute("for", button.id);
    }
}

class ElMenu extends BaseElement {
    static observedAttributes = ["anchor", "open"];

    #search: SelectQueryHelper | null;
    constructor() { // @ts-expect-error
        super(...arguments);
        this.#search = null
    }
    mount(signal: AbortSignal) {
        this.#search = SelectQuery(this, {
            role: "menu",
            getItems: () => this.getItems(),
            onItemClick: () => this.hidePopover(),
            getButton: () => this.getDropdown().getButton(),
            onBeforeOpen: () => this.onBeforeOpen(),
            onBeforeClose: () => this.onBeforeClose()
        }, signal);

        let button: HTMLButtonElement = this.getDropdown().getButton();
        button.addEventListener("keydown", (e: KeyboardEvent) => {
            if (button.disabled) return;
            switch (e.key) {
                case "ArrowDown": {
                    this.showPopover();
                    this.goToItem(FocusKey.First);
                    e.preventDefault();
                    break;
                }
                case "ArrowUp": {
                    this.showPopover();
                    this.goToItem(FocusKey.Last);
                    e.preventDefault();
                    break;
                } //@ts-expect-error
                case " ":
                    if (this.hasAttribute("open") && this.#search?.hasActiveSearchQuery()) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.#search.handleSearchKey(e.key);
                        break;
                    }
                case "Enter": {
                    e.preventDefault();
                    if (this.hasAttribute("open"))
                        this.hidePopover();
                    else {
                        this.showPopover();
                        this.goToItem(FocusKey.First);
                    }
                    break;
                }
                default: {
                    if (!this.hasAttribute("open")) return;
                    if (e.key.length !== 1 || [e.ctrlKey, e.altKey, e.metaKey].some(Boolean))
                        return;
                    e.preventDefault();
                    e.stopPropagation();
                    this.#search?.handleSearchKey(e.key);

                }
            }
        }, { signal });

        this.addEventListener("keydown", (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    e.stopPropagation();
                    return this.goToItem(FocusKey.Next);
                case "ArrowUp":
                    e.preventDefault();
                    e.stopPropagation();
                    return this.goToItem(FocusKey.Previous);
                case "Home":
                case "PageUp":
                    e.preventDefault();
                    e.stopPropagation();
                    return this.goToItem(FocusKey.First);
                case "End":
                case "PageDown":
                    e.preventDefault();
                    e.stopPropagation();
                    return this.goToItem(FocusKey.Last); // @ts-expect-error
                case " ":
                    if (!this.#search?.hasActiveSearchQuery()) return;
                    e.preventDefault();
                    e.stopPropagation();
                    this.#search.handleSearchKey(e.key);
                case "Enter": {
                    e.preventDefault();
                    e.stopPropagation();
                    let activeItem = this.getActiveItem();
                    return activeItem ? activeItem.click() : this.hidePopover();
                }
                case "Tab": {
                    this.#search?.ignoreNextFocusRestoration();
                    break;
                }
                case "Escape": {
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
                    this.#search?.handleSearchKey(e.key);
                }
            }
        }, { signal });
    }
    onBeforeOpen() {
        let button = this.getDropdown().getButton();

        let tabIndex = button.dataset.originalTabIndex;
        if (tabIndex)
            button.dataset.originalTabIndex = tabIndex;
        button.setAttribute("tabIndex", "-1");

        if (this.getActiveItem() === null) {
            this.setAttribute("tabIndex", "0");
            setTimeout(() => this.focus({ preventScroll: true }));
        }
    }
    onBeforeClose() {
        let button: HTMLElement = this.getDropdown().getButton();
        let tabIndex = button.dataset.originalTabIndex;
        delete button.dataset.originalTabIndex;
        if (tabIndex !== undefined)
            button.setAttribute("tabIndex", tabIndex);
        else
            button.removeAttribute("tabIndex");
        this.getActiveItem()?.setAttribute("tabIndex", "-1");
    }
    goToItem(code: FocusCode = FocusKey.Nothing) {
        let items = this.getItems();
        if (!items.length)
            return;
        let prevActive: HTMLElement | null = this.getActiveItem();
        let activeItem = focusTo(items, prevActive, code);
        if (activeItem)
            this.setActiveItem(activeItem);
    }
    setActiveItem(item: HTMLElement) {
        this.#search?.setActiveItem(item);
    }
    clearActiveItem() {
        this.#search?.clearActiveItem();
    }
    getDropdown() {
        let dropdown: ElDropdown | null = this.closest("el-dropdown");
        if (!dropdown)
            throw new Error("[ElMenu] No `<el-dropdown>` element found");
        return dropdown;
    }
    getItems(): HTMLElement[] {
        return Array.from(this.querySelectorAll(`${focusableSelector},[role="menuitem"]`));
    }
    getActiveItem() {
        return this.#search?.getActiveItem() || null;
    }
    onAttributeChange(name: string, _: string, newVal: string) {
        if (name === "open")
            newVal === null ? this.hidePopover() : this.showPopover();
    }
}

defineCustomElement("el-menu", ElMenu);
defineCustomElement("el-dropdown", ElDropdown);