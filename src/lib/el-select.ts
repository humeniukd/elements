import { BaseElement } from './base-el';
import { getAutoId } from './get-auto-id';
import { type FocusCode, FocusKey, focusTo } from './focus-to';
import { defineCustomElement } from './utils';
import { applyWidthStyle } from './apply-width-style';
import { ElOption, type ElOptions } from './el-options';
import { isNotHidden } from './on-disappear';
import { SelectQuery, type SelectQueryHelper } from './select-query.ts';

const selectValidation = {
    get selectRequired() {
        let select = document.createElement("select");
        select.setAttribute("required", "true");
        let validationMessage = select.validationMessage;
        Object.defineProperty(this, "selectRequired", {
            value: validationMessage
        });
        return validationMessage;
    }
};

class ElSelect extends BaseElement {
    static formAssociated = true;
    static observedAttributes = ['required'];

    #search: SelectQueryHelper | null;
    #internals: ElementInternals;
    #value: string | null;

    #validate() {
        if (!this.hasAttribute("required") || this.#value) {
            this.#internals.setValidity({});
            return;
        }
        this.#internals.setValidity({
            valueMissing: true
        }, selectValidation.selectRequired, this.getButton());
    }
    
    constructor() { // @ts-expect-error
        super(...arguments);
        this.#internals = this.attachInternals()
        this.#value = '';
        this.#search = null;
    }
    mount(signal: AbortSignal) {
        let options = this.getOptions();
        this.value = this.getAttribute("value") ?? this.value ?? "";
        let button = this.getButton();
        button.id ||= getAutoId("select-button");
        applyWidthStyle(button, "--button-width", signal, this);
        button.addEventListener("keydown", e => {
            if (!button.matches(":disabled")) {
                switch (e.key) {
                    case "ArrowUp": {
                        options.showPopover();
                        this.goToItem(FocusKey.Selected);
                        e.preventDefault();
                        break;
                    }
                    case "ArrowDown": {
                        options.showPopover();
                        this.goToItem(FocusKey.Selected);
                        e.preventDefault();
                        break;
                    }
                    case "Enter": {
                        e.preventDefault();
                        if (this.#internals.form)
                            this.#internals.form.requestSubmit();
                        break;
                    }
                    case " ": {
                        e.preventDefault();
                        if (options.hasAttribute("open") && this.#search?.hasActiveSearchQuery()) {
                            e.stopPropagation();
                            this.#search.handleSearchKey(e.key);
                            break;
                        }
                        if (options.hasAttribute("open"))
                            options.hidePopover();
                        else {
                            options.showPopover();
                            this.goToItem(FocusKey.Selected);
                        }
                        break;
                    }
                    default: {
                        if (!options.hasAttribute("open")) return;
                        if (e.key.length !== 1 || [e.ctrlKey, e.altKey, e.metaKey].some(Boolean)) return;
                        e.preventDefault();
                        e.stopPropagation();
                        this.handleSearchKey(e.key);
                    }
                }
            }
        }, { signal });

        for (let label of this.#internals.labels)
            (label as HTMLLabelElement).setAttribute("for", button.id);

        this.#search = SelectQuery(options, {
            role: "listbox",
            getItems: () => this.getItems(),
            onItemClick: s => this.setSelectedOption(s),
            getButton: () => this.getButton(),
            onBeforeOpen: () => this.onBeforeOpen(),
            onBeforeClose: () => this.onBeforeClose()
        }, signal);

        options.addEventListener("keydown", e => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    e.stopPropagation();
                    return this.goToItem(3);
                case "ArrowUp":
                    e.preventDefault();
                    e.stopPropagation();
                    return this.goToItem(2);
                case "Home":
                case "PageUp":
                    e.preventDefault();
                    e.stopPropagation();
                    return this.goToItem(0);
                case "End":
                case "PageDown":
                    e.preventDefault();
                    e.stopPropagation();
                    return this.goToItem(1); // @ts-expect-error
                case " ":
                    if (this.#search?.hasActiveSearchQuery()) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.#search.handleSearchKey(e.key);
                        return;
                    }
                case "Enter": {
                    e.preventDefault();
                    e.stopPropagation();
                    const active = this.getActiveItem();
                    if (active)
                        active.click();
                    else
                        options.hidePopover();
                    return;
                }
                case "Tab": {
                    this.#search?.ignoreNextFocusRestoration();
                    break;
                }
                case "Escape": {
                    e.preventDefault();
                    e.stopPropagation();
                    options.hidePopover();
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

        options.addEventListener("toggle", (e: ToggleEvent) => {
            if (e.newState === "open")
                this.onOpen();
        }, { signal });

        for (let option of Array.from(options.querySelectorAll("el-option[disabled]"))) {
            option.setAttribute("aria-disabled", "true");
            option.setAttribute("aria-selected", "false");
        }
    }
    onAttributeChange(name: string, _: any, newVal: string) {
        switch (name) {
            case "value": {
                if (newVal !== null)
                    this.value = newVal;
                break;
            }
            case "required": {
                this.#validate();
            }
        }
    }
    getButton(): HTMLButtonElement {
        let button: HTMLButtonElement | null = this.querySelector("button");
        if (!button)
            throw new Error("`<el-select>` must contain a button element.");
        return button;
    }
    getOptions(): ElOptions {
        let options: ElOptions | null = this.querySelector("el-options");
        if (!options)
            throw new Error("`<el-select>` must contain a `<el-options>` element.");
        return options;
    }
    setSelectedOption(option: HTMLElement) {
        this.value = option.getAttribute("value");
        this.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
        this.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
        this.getOptions().hidePopover();
    }
    getOptionByName(name: string) {
        return this.getOptions().getOptionByName(name);
    }
    getItems(): ElOption[] {
        return this.getOptions().getItems();
    }
    getActiveItem() {
        return this.#search!.getActiveItem();
    }
    getSelectedOption() {
        return this.getOptionByName(this.#value!);
    }
    goToItem(code: FocusCode = FocusKey.Nothing) {
        let options = this.getItems();
        if (options.length === 0)
            return;

        let activeItem = this.getActiveItem();
        if (activeItem === null && [FocusKey.Previous as FocusCode, FocusKey.Next].includes(code)) {
            this.goToItem(FocusKey.Selected);
            return;
        }
        if (code === FocusKey.Selected) {
            let selectedOption = this.getSelectedOption();
            if (selectedOption && isNotHidden(selectedOption)) {
                this.setActiveItem(selectedOption);
            } else
                this.goToItem(FocusKey.First);
            return;
        }
        let item: HTMLElement | null = focusTo(options, activeItem, code);
        if (item) {
            this.setActiveItem(item);
        }
    }
    setActiveItem(item: HTMLElement) {
        this.#search?.setActiveItem(item);
    }
    clearActiveItem() {
        this.#search?.clearActiveItem();
    }
    onBeforeOpen() {
        let button = this.getButton();
        let tabIndex = button.dataset.originalTabIndex;
        if (tabIndex)
            button.dataset.originalTabIndex = tabIndex;
        button.setAttribute("tabIndex", "-1");
    }
    onOpen() {
        if (this.getActiveItem() === null) {
            this.goToItem(FocusKey.Selected);
        }
    }
    onBeforeClose() {
        const button = this.getButton();
        const tabIndex = button.dataset.originalTabIndex;
        delete button.dataset.originalTabIndex;
        if (tabIndex !== undefined)
            button.setAttribute("tabIndex", tabIndex);
        else
            button.removeAttribute("tabIndex");
        let activeItem = this.getActiveItem();
        if (activeItem !== null)
            activeItem.setAttribute("tabIndex", "-1");
    }
    handleSearchKey(q: string) {
        this.#search?.handleSearchKey(q);
    }
    set value(value: string | null) {
        this.#value = value;
        this.#internals.setFormValue(value);
        this.#validate();

        let selected = this.getSelectedOption();
        if (!selected) return;
        for (let item of this.getItems())
            item.setAttribute("aria-selected", "false");

        selected.setAttribute("aria-selected", "true");
        try {
            for (let content of this.querySelectorAll("el-selectedcontent"))
                (content as ElSelectedContent).update()
        } catch {}
    }
    get value() {
        return this.#value;
    }
}

class ElSelectedContent extends BaseElement {
    mount() {
        this.update();
    }
    update() {
        let t = this.getSelect().getSelectedOption();
        if (!t) {
            return;
        }
        let n = document.createDocumentFragment();
        for (let r of t.childNodes) {
            n.append(r.cloneNode(true));
        }
        this.replaceChildren(n);
    }
    getSelect() {
        const select: ElSelect | null = this.closest("el-select");
        if (!select)
            throw new Error("`<el-selectedcontent>` must be inside a `<el-select>` element.");
        return select;
    }
}

defineCustomElement("el-select", ElSelect);
defineCustomElement("el-selectedcontent", ElSelectedContent);