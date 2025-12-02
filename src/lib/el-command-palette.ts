import { BaseElement } from "./base-el";
import { getAutoId } from "./get-auto-id";
import { debounceByKeydownEvent } from "./debounce-by-keydown-event";
import { type FocusCode, focusTo } from "./focus-to";
import { getContent } from "./get-text-content";
import { defineCustomElement } from "./utils";
import { focusableSelector } from "./focusable-selector";
import { applyWidthStyle } from "./apply-width-style";

type FilterParams = {
    query: string
    node: Node
    content: string
}

type Filter = (params: FilterParams) => boolean

export class ElCommandPalette extends BaseElement {
    #filter: Filter;
    #suggestions: HTMLElement[];
    #lastQuery: string | null;
    #suggest(skipNavigation = false) {
        let items = this.getItems();
        let query = this.getInput().value ?? "";

        this.#suggestions = [];
        for (let node of items.getItems()) {
            if (node.closest("el-defaults"))
                continue;
            let content = getContent(node) ?? "";
            if (query === "" || this.#filter({ query, node, content })) {
                this.#suggestions.push(node);
                node.removeAttribute("hidden");
                node.removeAttribute("aria-hidden");
            } else {
                node.setAttribute("hidden", "");
                node.setAttribute("aria-hidden", "true");
            }
        }
        for (let group of this.getGroups()) {
            if (group.getItems().some(item => !item.hasAttribute("hidden")))
                group.removeAttribute("hidden");
            else
                group.setAttribute("hidden", "");
        }
        let suggestions = this.getSuggestions();
        if (suggestions) {
            if (query === "") {
                suggestions.removeAttribute("hidden");
                this.#suggestions = suggestions.getItems();
            } else
                suggestions.setAttribute("hidden", "");
        }
        let noResultsEl = this.querySelector("el-no-results");
        if (noResultsEl) {
            if (query === "" || this.#suggestions.length > 0)
                noResultsEl.setAttribute("hidden", "");
            else
                noResultsEl.removeAttribute("hidden");
        }
        if (!this.#suggestions.length)
            items.setAttribute("hidden", "");
        else
            items.removeAttribute("hidden");

        if (!skipNavigation || query !== "") {
            if (this.#suggestions.length)
                this.clearActiveItem();
            else if (this.#lastQuery !== query)
                this.goToItem(0);
            this.#lastQuery = query;
        }
    }
    #onMouseOver(el: HTMLElement, scrollTo = true) {
        let input = this.getInput();
        let activeItem = this.getActiveItem();
        if (el === activeItem) {
            return;
        }
        if (activeItem !== null) {
            activeItem.setAttribute("aria-selected", "false");
            let a = this.querySelector(`el-command-preview[for="${activeItem.id}"]`);
            if (a) {
                a.setAttribute("hidden", "");
            }
        }
        el.setAttribute("aria-selected", "true");
        input.setAttribute("aria-activedescendant", el.id);
        let commandPreview = this.querySelector(`el-command-preview[for="${el.id}"]`);
        if (commandPreview) {
            commandPreview.removeAttribute("hidden");
        }
        if (scrollTo) {
            el.scrollIntoView({ block: "nearest" });
        }
        this.dispatchEvent(new CustomEvent("change", {
            detail: {
                relatedTarget: el
            },
            bubbles: false,
            cancelable: false
        }));
    }
    constructor() { // @ts-expect-error
        super(...arguments);
        this.#suggestions = [];
        this.#lastQuery = null;
        this.#lastQuery = null;
        this.#filter = ({ query, content }) => content.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim());
    }
    mount(signal: AbortSignal) {
        let input = this.getInput();
        let items = this.getItems();
        input.id ||= getAutoId("command-input");
        items.id ||= getAutoId("command-items");
        input.setAttribute("role", "combobox");
        input.setAttribute("aria-autocomplete", "list");
        input.setAttribute("autocomplete", "off");
        input.setAttribute("aria-controls", items.id);
        items.setAttribute("role", "listbox");

        let set = new WeakSet();
        const onAttributeChange = (initial = false) => {
            for (let item of items.getItems()) {
                if (set.has(item)) continue;
                set.add(item);
                item.id ||= getAutoId("item");
                item.setAttribute("role", "option");
                item.setAttribute("tabIndex", "-1");
                item.setAttribute("aria-selected", "false");
                if (item.hasAttribute("disabled"))
                    item.setAttribute("aria-disabled", "true");
                debounceByKeydownEvent(item, "mouseover", signal, () => this.#onMouseOver(item, false));
            }
            this.#suggest(initial);
            if (!initial) {
                this.goToItem(0);
            }
        }
        onAttributeChange(true);
        let observer = new MutationObserver(() => onAttributeChange(false));
        observer.observe(this, { attributes: false, childList: true, subtree: true });
        applyWidthStyle(input, "--input-width", signal, this);
        input.addEventListener("input", () => this.#suggest(), { signal });
        input.addEventListener("keydown", evt => {
            switch (evt.key) {
                case "ArrowDown": {
                    evt.preventDefault();
                    this.goToItem(3);
                    break;
                }
                case "ArrowUp": {
                    evt.preventDefault();
                    this.goToItem(2);
                    break;
                }
                case "Home":
                case "PageUp":
                    evt.preventDefault();
                    evt.stopPropagation();
                    return this.goToItem(0);
                case "End":
                case "PageDown":
                    evt.preventDefault();
                    evt.stopPropagation();
                    return this.goToItem(1);
                case "Enter": {
                    let g = this.getActiveItem();
                    if (g) {
                        evt.preventDefault();
                        g.click();
                    }
                    break;
                }
                case "Tab":
                    break;
            }
        }, { signal });
        signal.addEventListener("abort", () => observer.disconnect());
    }
    getInput() {
        let input = this.querySelector("input");
        if (!input)
            throw new Error("`<el-command-palette>` must contain an input element.");
        return input;
    }
    getItems(): ElCommandList {
        let list: ElCommandList | null = this.querySelector("el-command-list");
        if (!list)
            throw new Error("`<el-command-palette>` must contain a `<el-command-list>` element.");
        return list;
    }
    getGroups(): NodeListOf<ElCommandGroup>{
        return this.getItems().querySelectorAll("el-command-group");
    }
    getSuggestions(): ElDefaults | null {
        return this.querySelector("el-defaults");
    }
    getActiveItem() {
        let active = this.getInput().getAttribute("aria-activedescendant");
        return active ? document.getElementById(active) : null;
    }
    goToItem(code: FocusCode) {
        if (!this.#suggestions.length)
            return;
        let activeItem = this.getActiveItem();
        let item = focusTo(this.#suggestions, activeItem, code);
        if (item)
            this.#onMouseOver(item);
    }
    clearActiveItem() {
        let input = this.getInput();
        let active = this.getActiveItem();
        if (active !== null) {
            active.setAttribute("aria-selected", "false");
            let preview = this.querySelector(`el-command-preview[for="${active.id}"]`);
            if (preview)
                preview.setAttribute("hidden", "");
        }
        input.removeAttribute("aria-activedescendant");
        this.dispatchEvent(new CustomEvent("change", {
            detail: {
                relatedTarget: null
            },
            bubbles: false,
            cancelable: false
        }));
    }
    reset() {
        let input = this.getInput();
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
        input.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
        this.#suggest(true);
        this.clearActiveItem();
    }
    setFilterCallback(cb: Filter) {
        this.#filter = cb;
    }
}

class ElCommandList extends BaseElement {
    getItems(): HTMLElement[] {
        return Array.from(this.querySelectorAll(`${focusableSelector},[role="option"]`));
    }
}
class ElDefaults extends BaseElement {
    getItems(): HTMLElement[] {
        return Array.from(this.querySelectorAll(`${focusableSelector},[role="option"]`));
    }
}

class ElNoResults extends BaseElement {}
class ElCommandPreview extends BaseElement {}
class ElCommandGroup extends BaseElement {
    getItems(): HTMLElement[] {
        return Array.from(this.querySelectorAll(`${focusableSelector},[role="option"]`));
    }
}

defineCustomElement("el-command-palette", ElCommandPalette);
defineCustomElement("el-command-list", ElCommandList);
defineCustomElement("el-defaults", ElDefaults);
defineCustomElement("el-no-results", ElNoResults);
defineCustomElement("el-command-group", ElCommandGroup);
defineCustomElement("el-command-preview", ElCommandPreview);

