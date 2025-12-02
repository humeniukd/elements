import { BaseElement } from "./base-el.js";
import { defineCustomElement } from "./utils.js";
import { handleDocumentOverflow } from "./overflow";
import { createPopover } from "./create-popover.js";
import { getAutoId } from "./get-auto-id.js";
import { ElOptions } from './el-options.ts';
import { debounceByKeydownEvent } from './debounce-by-keydown-event.ts';
import { applyWidthStyle } from './apply-width-style.ts';
import { getTextContent } from './get-text-content.ts';
import { type FocusCode, focusTo } from './focus-to.ts';

class ElAutocomplete extends BaseElement {
    #query: string | null;
    #options: HTMLElement[];

    constructor() { // @ts-expect-error
        super(...arguments);
        this.#query = null;
        this.#options = [];
    }

    mount(signal: AbortSignal) {
        let input = this.getInput();
        let button = this.getButton();
        let optionsEl = this.getOptions();
        input.id ||= getAutoId("autocomplete-input");

        if (button)
            button.id ||= getAutoId("autocomplete-button");

        optionsEl.id ||= getAutoId("autocomplete-listbox");

        createPopover(
            optionsEl,
            signal,
            () => {
                const button = this.getButton();
                return button ? [button] : [];
            },
            () => this.getInput(),
            () => this.onBeforeOpen(),
            () => this.onBeforeClose()
        );

        handleDocumentOverflow(optionsEl, signal);

        input.setAttribute("role", "combobox");
        input.setAttribute("aria-autocomplete", "list");
        input.setAttribute("aria-expanded", "false");
        input.setAttribute("aria-controls", optionsEl.id);
        input.setAttribute("aria-activedescendant", "");
        input.setAttribute("autocomplete", "off");

        if (button) {
            button.setAttribute("type", "button");
            button.setAttribute("tabindex", "-1");
            button.setAttribute("aria-expanded", "false");
            button.setAttribute("aria-haspopup", "listbox");
            button.setAttribute("popovertarget", optionsEl.id);
        }

        optionsEl.setAttribute("role", "listbox");
        optionsEl.setAttribute("popover", "manual");

        const set = new WeakSet();
        const onAttributeChange = () => {
            for (let item of optionsEl.getItems()) {
                if (!set.has(item)) {
                    set.add(item);
                    item.id ||= getAutoId("option");
                    item.setAttribute("role", "option");
                    item.setAttribute("aria-selected", "false");
                    item.setAttribute("tabIndex", "-1");
                    item.addEventListener("mousedown", evt => {
                        if (evt.button === 0) {
                            evt.preventDefault();
                            this.selectOption(item);
                        }
                    }, { signal });
                    debounceByKeydownEvent(item, "mouseover", signal, () => this.setActiveItem(item, false));
                    debounceByKeydownEvent(item, "mouseout", signal, () => this.clearActiveItem());
                }
            }
            this.filterOptions();
        }

        onAttributeChange();
        const observer = new MutationObserver(onAttributeChange);
        observer.observe(this, { attributes: false, childList: true, subtree: true });

        if (button)
            applyWidthStyle(button, "--button-width", signal, this);

        applyWidthStyle(input, "--input-width", signal, this);

        input.addEventListener("input", () => {
            if (input.matches(":disabled"))
                return;
            this.filterOptions();
            if (!this.#options.length) {
                optionsEl.hidePopover();
            } else if (!optionsEl.hasAttribute("open"))
                optionsEl.showPopover();
        }, { signal });

        const onPointerDown = () => {
            if (input.matches(":disabled")) return;
            input.focus();
            if (optionsEl.hasAttribute("open"))
                optionsEl.hidePopover();
            else {
                this.filterOptions();
                if (this.#options.length > 0)
                    optionsEl.showPopover();
            }
        };
        input.addEventListener("pointerdown", onPointerDown, { signal });

        if (button) {
            button.addEventListener("pointerdown", evt => {
                evt.preventDefault();
                onPointerDown();
            }, { signal });
            button.addEventListener("click", evt => {
                evt.preventDefault();
                evt.stopImmediatePropagation();
            }, { signal });
        }

        input.addEventListener("blur", ({ relatedTarget }) => {
            if (!relatedTarget || !this.contains(relatedTarget as HTMLElement))
                optionsEl.hidePopover();
        }, { signal });

        input.addEventListener("keydown", evt => {
            if (input.matches(":disabled")) return;
            switch (evt.key) {
                case "ArrowDown": {
                    evt.preventDefault();
                    if (!optionsEl.hasAttribute("open")) {
                        if (this.#options.length === 0)
                            this.filterOptions();

                        if (this.#options.length > 0)
                            optionsEl.showPopover();
                    }
                    this.goToItem(3);
                    break;
                }
                case "ArrowUp": {
                    evt.preventDefault();
                    if (!optionsEl.hasAttribute("open")) {
                        if (this.#options.length === 0)
                            this.filterOptions();
                        if (this.#options.length > 0)
                            optionsEl.showPopover();
                    }
                    this.goToItem(2);
                    break;
                }
                case "Home":
                case "PageUp":
                    if (!optionsEl.hasAttribute("open")) return;
                    evt.preventDefault();
                    evt.stopPropagation();
                    return this.goToItem(0);
                case "End":
                case "PageDown":
                    if (!optionsEl.hasAttribute("open")) return;
                    evt.preventDefault();
                    evt.stopPropagation();
                    return this.goToItem(1);
                case "Enter": {
                    let active = this.getActiveItem();
                    if (active) {
                        evt.preventDefault();
                        this.selectOption(active);
                    }
                    if (optionsEl.hasAttribute("open")) {
                        evt.preventDefault();
                        optionsEl.hidePopover();
                    }
                    break;
                }
                case "Escape": {
                    if (!optionsEl.hasAttribute("open"))
                        return;
                    evt.preventDefault();
                    optionsEl.hidePopover();
                    break;
                }
                case "Tab": {
                    optionsEl.hidePopover();
                    break;
                }
            }
        }, { signal });

        let disabledOptions: HTMLElement[] = Array.from(optionsEl.querySelectorAll("el-option[disabled]"));
        for (let disabledOption of disabledOptions) {
            disabledOption.setAttribute("aria-disabled", "true");
            disabledOption.setAttribute("aria-selected", "false");
        }
        signal.addEventListener("abort", () => { observer.disconnect(); });
    }
    getInput() {
        let input = this.querySelector("input");
        if (!input)
            throw new Error("`<el-autocomplete>` must contain an input element.");
        return input;
    }
    getButton() {
        return this.querySelector("button");
    }
    getOptions(): ElOptions {
        let optionsEl: ElOptions | null = this.querySelector("el-options");
        if (!optionsEl)
            throw new Error("`<el-autocomplete>` must contain a `<el-options>` element.");
        return optionsEl;
    }
    filterOptions() {
        let query = this.getInput().value.toLowerCase();
        if (this.#query !== query) {
            this.clearActiveItem();
            this.#query = query;
        }
        this.#options = [];

        for (let option of this.getOptions().getItems()) {
            let value = option.getAttribute("value")?.toLowerCase() || "";
            let text = getTextContent(option)?.trim().toLowerCase() ?? "";

            if (query === "" || value.includes(query) || text.includes(query)) {
                this.#options.push(option);
                option.removeAttribute("hidden");
                option.removeAttribute("aria-hidden");
            } else {
                option.setAttribute("hidden", "");
                option.setAttribute("aria-hidden", "true");
            }
        }
    }
    getActiveItem() {
        let active = this.getInput().getAttribute("aria-activedescendant");
        return active ? document.getElementById(active) : null;
    }
    goToItem(code: FocusCode) {
        if (!this.#options.length)
            return;
        let active = this.getActiveItem();
        let option = focusTo(this.#options, active, code);
        if (option)
            this.setActiveItem(option);
    }
    setActiveItem(option: HTMLElement, scrollTo = true) {
        let input = this.getInput();
        let active = this.getActiveItem();
        if (active !== null)
            active.setAttribute("aria-selected", "false");
        option.setAttribute("aria-selected", "true");
        input.setAttribute("aria-activedescendant", option.id);
        if (scrollTo)
            option.scrollIntoView({ block: "nearest" });
    }
    clearActiveItem() {
        let input = this.getInput();
        let active = this.getActiveItem();
        if (active !== null)
            active.setAttribute("aria-selected", "false");
        input.setAttribute("aria-activedescendant", "");
    }
    selectOption(option: HTMLElement) {
        let input = this.getInput();
        let value = option.getAttribute("value");
        if (value) {
            input.value = value;
            input.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
            input.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
            this.getOptions().hidePopover();
        }
    }
    onBeforeOpen() {
        let input = this.getInput();
        let button = this.getButton();
        input.setAttribute("aria-expanded", "true");
        button?.setAttribute("aria-expanded", "true");
    }
    onBeforeClose() {
        let input = this.getInput();
        let button = this.getButton();
        input.setAttribute("aria-expanded", "false");
        button?.setAttribute("aria-expanded", "false");
        this.clearActiveItem();
    }
}

defineCustomElement("el-autocomplete", ElAutocomplete);
