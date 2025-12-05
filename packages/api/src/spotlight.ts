import { BaseElement } from './lib/base-el';
import { getAutoId } from './lib/get-auto-id';
import { debounceByKeydownEvent } from './lib/debounce-by-keydown-event';
import { type FocusCode, focusTo } from './lib/focus-to';
import { getContent } from './lib/get-text-content';
import { defineCustomElement } from './lib/utils';
import { focusableSelector } from './lib/focusable-selector';
import { applyWidthStyle } from './lib/apply-width-style';

type FilterParams = {
    query: string
    node: Node
    content: string
}

type Filter = (params: FilterParams) => boolean

export class Spotlight extends BaseElement {
    #filter: Filter;
    #suggestions: HTMLElement[];
    #lastQuery: string | null;
    #suggest(skipNavigation = false) {
        let items = this._getItems();
        let query = this._getInput().value ?? '';

        this.#suggestions = [];
        for (let node of items.getItems()) {
            if (node.closest('ce-defaults'))
                continue;
            let content = getContent(node) ?? '';
            if (query === '' || this.#filter({ query, node, content })) {
                this.#suggestions.push(node);
                node.removeAttribute('hidden');
                node.removeAttribute('aria-hidden');
            } else {
                node.setAttribute('hidden', '');
                node.setAttribute('aria-hidden', 'true');
            }
        }
        for (let group of this._getGroups()) {
            if (group.getItems().some(item => !item.hasAttribute('hidden')))
                group.removeAttribute('hidden');
            else
                group.setAttribute('hidden', '');
        }
        let suggestions = this._getSuggestions();
        if (suggestions) {
            if (query === '') {
                suggestions.removeAttribute('hidden');
                this.#suggestions = suggestions.getItems();
            } else
                suggestions.setAttribute('hidden', '');
        }
        let noResultsEl = this.querySelector('ce-empty');
        if (noResultsEl) {
            if (query === '' || this.#suggestions.length > 0)
                noResultsEl.setAttribute('hidden', '');
            else
                noResultsEl.removeAttribute('hidden');
        }
        if (!this.#suggestions.length)
            items.setAttribute('hidden', '');
        else
            items.removeAttribute('hidden');

        if (!skipNavigation || query !== '') {
            if (this.#suggestions.length)
                this._clearActiveItem();
            else if (this.#lastQuery !== query)
                this._goToItem(0);
            this.#lastQuery = query;
        }
    }
    #onMouseOver(el: HTMLElement, scrollTo = true) {
        let input = this._getInput();
        let activeItem = this._getActiveItem();
        if (el === activeItem) {
            return;
        }
        if (activeItem !== null) {
            activeItem.setAttribute('aria-selected', 'false');
            let a = this.querySelector(`ce-shortcut-preview[for='${activeItem.id}']`);
            if (a) {
                a.setAttribute('hidden', '');
            }
        }
        el.setAttribute('aria-selected', 'true');
        input.setAttribute('aria-activedescendant', el.id);
        let commandPreview = this.querySelector(`ce-shortcut-preview[for='${el.id}']`);
        if (commandPreview) {
            commandPreview.removeAttribute('hidden');
        }
        if (scrollTo) {
            el.scrollIntoView({ block: 'nearest' });
        }
        this.dispatchEvent(new CustomEvent('change', {
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
    _mount(signal: AbortSignal) {
        let input = this._getInput();
        let items = this._getItems();
        input.id ||= getAutoId('command-input');
        items.id ||= getAutoId('command-items');
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('aria-controls', items.id);
        items.setAttribute('role', 'listbox');

        let set = new WeakSet();
        const onAttributeChange = (initial = false) => {
            for (let item of items.getItems()) {
                if (set.has(item)) continue;
                set.add(item);
                item.id ||= getAutoId('item');
                item.setAttribute('role', 'option');
                item.setAttribute('tabIndex', '-1');
                item.setAttribute('aria-selected', 'false');
                if (item.hasAttribute('disabled'))
                    item.setAttribute('aria-disabled', 'true');
                debounceByKeydownEvent(item, 'mouseover', signal, () => this.#onMouseOver(item, false));
            }
            this.#suggest(initial);
            if (!initial) {
                this._goToItem(0);
            }
        }
        onAttributeChange(true);
        let observer = new MutationObserver(() => onAttributeChange(false));
        observer.observe(this, { attributes: false, childList: true, subtree: true });
        applyWidthStyle(input, '--input-width', signal, this);
        input.addEventListener('input', () => this.#suggest(), { signal });
        input.addEventListener('keydown', evt => {
            switch (evt.key) {
                case 'ArrowDown': {
                    evt.preventDefault();
                    this._goToItem(3);
                    break;
                }
                case 'ArrowUp': {
                    evt.preventDefault();
                    this._goToItem(2);
                    break;
                }
                case 'Home':
                case 'PageUp':
                    evt.preventDefault();
                    evt.stopPropagation();
                    return this._goToItem(0);
                case 'End':
                case 'PageDown':
                    evt.preventDefault();
                    evt.stopPropagation();
                    return this._goToItem(1);
                case 'Enter': {
                    let g = this._getActiveItem();
                    if (g) {
                        evt.preventDefault();
                        g.click();
                    }
                    break;
                }
                case 'Tab':
                    break;
            }
        }, { signal });
        signal.addEventListener('abort', () => observer.disconnect());
    }
    _getInput() {
        let input = this.querySelector('input');
        if (!input)
            throw new Error('`<ce-spotlight>` must include an input element.');
        return input;
    }
    _getItems(): ShortcutList {
        let list: ShortcutList | null = this.querySelector('ce-shortcut-list');
        if (!list)
            throw new Error('`<ce-spotlight>` must include a `<ce-shortcut-list>` element.');
        return list;
    }
    _getGroups(): NodeListOf<ShortcutGroup>{
        return this._getItems().querySelectorAll('ce-shortcut-group');
    }
    _getSuggestions(): Defaults | null {
        return this.querySelector('ce-defaults');
    }
    _getActiveItem() {
        let active = this._getInput().getAttribute('aria-activedescendant');
        return active ? document.getElementById(active) : null;
    }
    _goToItem(code: FocusCode) {
        if (!this.#suggestions.length)
            return;
        let activeItem = this._getActiveItem();
        let item = focusTo(this.#suggestions, activeItem, code);
        if (item)
            this.#onMouseOver(item);
    }
    _clearActiveItem() {
        let input = this._getInput();
        let active = this._getActiveItem();
        if (active !== null) {
            active.setAttribute('aria-selected', 'false');
            let preview = this.querySelector(`ce-shortcut-preview[for='${active.id}']`);
            if (preview)
                preview.setAttribute('hidden', '');
        }
        input.removeAttribute('aria-activedescendant');
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                relatedTarget: null
            },
            bubbles: false,
            cancelable: false
        }));
    }
    reset() {
        let input = this._getInput();
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        this.#suggest(true);
        this._clearActiveItem();
    }
    setFilterPredicate(cb: Filter) {
        this.#filter = cb;
    }
}

class ShortcutList extends BaseElement {
    getItems(): HTMLElement[] {
        return Array.from(this.querySelectorAll(`${focusableSelector},[role='option']`));
    }
}
class Defaults extends BaseElement {
    getItems(): HTMLElement[] {
        return Array.from(this.querySelectorAll(`${focusableSelector},[role='option']`));
    }
}

class NoResults extends BaseElement {}
class ShortcutPreview extends BaseElement {}
class ShortcutGroup extends BaseElement {
    getItems(): HTMLElement[] {
        return Array.from(this.querySelectorAll(`${focusableSelector},[role='option']`));
    }
}

defineCustomElement('ce-spotlight', Spotlight);
defineCustomElement('ce-shortcut-list', ShortcutList);
defineCustomElement('ce-defaults', Defaults);
defineCustomElement('ce-empty', NoResults);
defineCustomElement('ce-shortcut-group', ShortcutGroup);
defineCustomElement('ce-shortcut-preview', ShortcutPreview);

