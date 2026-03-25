import { BaseElement } from './lib/base-el';
import { defineCustomElement } from './lib/utils';
import { handleDocumentOverflow } from './lib/overflow';
import { createPopover } from './lib/create-popover';
import { getAutoId } from './lib/get-auto-id';
import { Options } from './options';
import { debounceByKeydownEvent } from './lib/debounce-by-keydown-event';
import { applyWidthStyle } from './lib/apply-width-style';
import { getTextContent } from './lib/get-text-content';
import { type FocusCode, focusTo } from './lib/focus-to';

class Autocomplete extends BaseElement {
    #query: string | null;
    #options: HTMLElement[];

    constructor() { // @ts-expect-error
        super(...arguments);
        this.#query = null;
        this.#options = [];
    }

    _mount(signal: AbortSignal) {
        let input = this._getInput();
        let button = this._getButton();
        let optionsEl = this._getOptions();
        input.id ||= getAutoId('autocomplete-input');

        if (button)
            button.id ||= getAutoId('autocomplete-button');

        optionsEl.id ||= getAutoId('autocomplete-listbox');

        createPopover(
            optionsEl,
            signal,
            () => {
                const button = this._getButton();
                return button ? [button] : [];
            },
            () => this._getInput(),
            () => this._onBeforeOpen(),
            () => this._onBeforeClose()
        );

        handleDocumentOverflow(optionsEl, signal);

        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-expanded', 'false');
        input.setAttribute('aria-controls', optionsEl.id);
        input.setAttribute('aria-activedescendant', "");
        input.setAttribute('autocomplete', 'off');

        if (button) {
            button.setAttribute('type', 'button');
            button.setAttribute('tabindex', '-1');
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-haspopup', 'listbox');
            button.setAttribute('popovertarget', optionsEl.id);
        }

        optionsEl.setAttribute('role', 'listbox');
        optionsEl.setAttribute('popover', 'manual');

        const set = new WeakSet();
        const onAttributeChange = () => {
            for (let item of optionsEl._getItems()) {
                if (!set.has(item)) {
                    set.add(item);
                    item.id ||= getAutoId('option');
                    item.setAttribute('role', 'option');
                    item.setAttribute('aria-selected', 'false');
                    item.setAttribute('tabIndex', '-1');
                    item.addEventListener('mousedown', evt => {
                        if (evt.button === 0) {
                            evt.preventDefault();
                            this._selectOption(item);
                        }
                    }, { signal });
                    debounceByKeydownEvent(item, 'mouseover', signal, () => this._setActiveItem(item, false));
                    debounceByKeydownEvent(item, 'mouseout', signal, () => this._clearActiveItem());
                }
            }
            this._filterOptions();
            if (this.#options.length && !optionsEl.hasAttribute('open'))
                optionsEl.showPopover();
        }

        onAttributeChange();
        const observer = new MutationObserver(onAttributeChange);
        observer.observe(this, { attributes: false, childList: true, subtree: true });

        if (button)
            applyWidthStyle(button, '--button-width', signal, this);

        applyWidthStyle(input, '--input-width', signal, this);

        input.addEventListener('input', () => {
            if (input.matches(':disabled'))
                return;
            this._filterOptions();
            if (!this.#options.length) {
                optionsEl.hidePopover();
            } else if (!optionsEl.hasAttribute('open'))
                optionsEl.showPopover();
        }, { signal });

        const onPointerDown = () => {
            if (input.matches(':disabled')) return;
            input.focus();
            if (optionsEl.hasAttribute('open'))
                optionsEl.hidePopover();
            else {
                this._filterOptions();
                if (this.#options.length > 0)
                    optionsEl.showPopover();
            }
        };
        input.addEventListener('pointerdown', onPointerDown, { signal });

        if (button) {
            button.addEventListener('pointerdown', evt => {
                evt.preventDefault();
                onPointerDown();
            }, { signal });
            button.addEventListener('click', evt => {
                evt.preventDefault();
                evt.stopImmediatePropagation();
            }, { signal });
        }

        input.addEventListener('blur', ({ relatedTarget }) => {
            if (!relatedTarget || !this.contains(relatedTarget as HTMLElement))
                optionsEl.hidePopover();
        }, { signal });

        input.addEventListener('keydown', evt => {
            if (input.matches(':disabled')) return;
            switch (evt.key) {
                case 'ArrowDown': {
                    evt.preventDefault();
                    if (!optionsEl.hasAttribute('open')) {
                        if (this.#options.length === 0)
                            this._filterOptions();

                        if (this.#options.length > 0)
                            optionsEl.showPopover();
                    }
                    this._goToItem(3);
                    break;
                }
                case 'ArrowUp': {
                    evt.preventDefault();
                    if (!optionsEl.hasAttribute('open')) {
                        if (this.#options.length === 0)
                            this._filterOptions();
                        if (this.#options.length > 0)
                            optionsEl.showPopover();
                    }
                    this._goToItem(2);
                    break;
                }
                case 'Home':
                case 'PageUp':
                    if (!optionsEl.hasAttribute('open')) return;
                    evt.preventDefault();
                    evt.stopPropagation();
                    return this._goToItem(0);
                case 'End':
                case 'PageDown':
                    if (!optionsEl.hasAttribute('open')) return;
                    evt.preventDefault();
                    evt.stopPropagation();
                    return this._goToItem(1);
                case 'Enter': {
                    let active = this._getActiveItem();
                    if (active) {
                        evt.preventDefault();
                        this._selectOption(active);
                    }
                    if (optionsEl.hasAttribute('open')) {
                        evt.preventDefault();
                        optionsEl.hidePopover();
                    }
                    break;
                }
                case 'Escape': {
                    if (!optionsEl.hasAttribute('open'))
                        return;
                    evt.preventDefault();
                    optionsEl.hidePopover();
                    break;
                }
                case 'Tab': {
                    optionsEl.hidePopover();
                    break;
                }
            }
        }, { signal });

        let disabledOptions: HTMLElement[] = Array.from(optionsEl.querySelectorAll('ce-option[disabled]'));
        for (let disabledOption of disabledOptions) {
            disabledOption.setAttribute('aria-disabled', 'true');
            disabledOption.setAttribute('aria-selected', 'false');
        }
        signal.addEventListener('abort', () => { observer.disconnect(); });
    }
    _getInput() {
        let input = this.querySelector('input');
        if (!input)
            throw new Error('`<ce-autocomplete>` must include an input element.');
        return input;
    }
    _getButton() {
        return this.querySelector('button');
    }
    _getOptions(): Options {
        let optionsEl: Options | null = this.querySelector('ce-options');
        if (!optionsEl)
            throw new Error('`<ce-autocomplete>` must include a `<ce-options>` element.');
        return optionsEl;
    }
    _filterOptions() {
        let query = this._getInput().value.toLowerCase();
        if (this.#query !== query) {
            this._clearActiveItem();
            this.#query = query;
        }
        this.#options = [];

        for (let option of this._getOptions()._getItems()) {
            let value = option.getAttribute('value')?.toLowerCase() || "";
            let text = getTextContent(option)?.trim().toLowerCase() ?? "";

            if (query === "" || value.includes(query) || text.includes(query)) {
                this.#options.push(option);
                option.removeAttribute('hidden');
                option.removeAttribute('aria-hidden');
            } else {
                option.setAttribute('hidden', "");
                option.setAttribute('aria-hidden', 'true');
            }
        }
    }
    _getActiveItem() {
        let active = this._getInput().getAttribute('aria-activedescendant');
        return active ? document.getElementById(active) : null;
    }
    _goToItem(code: FocusCode) {
        if (!this.#options.length)
            return;
        let active = this._getActiveItem();
        let option = focusTo(this.#options, active, code);
        if (option)
            this._setActiveItem(option);
    }
    _setActiveItem(option: HTMLElement, scrollTo = true) {
        let input = this._getInput();
        let active = this._getActiveItem();
        if (active !== null)
            active.setAttribute('aria-selected', 'false');
        option.setAttribute('aria-selected', 'true');
        input.setAttribute('aria-activedescendant', option.id);
        if (scrollTo)
            option.scrollIntoView({ block: 'nearest' });
    }
    _clearActiveItem() {
        let input = this._getInput();
        let active = this._getActiveItem();
        if (active !== null)
            active.setAttribute('aria-selected', 'false');
        input.setAttribute('aria-activedescendant', "");
    }
    _selectOption(option: HTMLElement) {
        let input = this._getInput();
        let value = option.getAttribute('value');
        if (value) {
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            this._getOptions().hidePopover();
        }
    }
    _onBeforeOpen() {
        let input = this._getInput();
        let button = this._getButton();
        input.setAttribute('aria-expanded', 'true');
        button?.setAttribute('aria-expanded', 'true');
    }
    _onBeforeClose() {
        let input = this._getInput();
        let button = this._getButton();
        input.setAttribute('aria-expanded', 'false');
        button?.setAttribute('aria-expanded', 'false');
        this._clearActiveItem();
    }
}

defineCustomElement('ce-autocomplete', Autocomplete);
