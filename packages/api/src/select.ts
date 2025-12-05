import { BaseElement } from './lib/base-el';
import { getAutoId } from './lib/get-auto-id';
import { First, type FocusCode, focusTo, Next, Nothing, Previous, Selected } from './lib/focus-to';
import { defineCustomElement } from './lib/utils';
import { applyWidthStyle } from './lib/apply-width-style';
import { Option, type Options } from './options';
import { isVisible } from './lib/on-disappear';
import { SelectQuery, type SelectQueryHelper } from './lib/select-query';

const selectValidation = {
    get selectRequired() {
        let select = document.createElement('select');
        select.setAttribute('required', 'true');
        let validationMessage = select.validationMessage;
        Object.defineProperty(this, 'selectRequired', {
            value: validationMessage
        });
        return validationMessage;
    }
};

class Select extends BaseElement {
    static formAssociated = true;
    static _observedAttributes = ['required'];

    #search: SelectQueryHelper | null;
    #internals: ElementInternals;
    #value: string | null;

    #validate() {
        if (!this.hasAttribute('required') || this.#value) {
            this.#internals.setValidity({});
            return;
        }
        this.#internals.setValidity({
            valueMissing: true
        }, selectValidation.selectRequired, this._getButton());
    }
    
    constructor() { // @ts-expect-error
        super(...arguments);
        this.#internals = this.attachInternals()
        this.#value = '';
        this.#search = null;
    }
    _mount(signal: AbortSignal) {
        let options = this._getOptions();
        this.value = this.getAttribute('value') ?? this.value ?? "";
        let button = this._getButton();
        button.id ||= getAutoId('select-button');
        applyWidthStyle(button, '--button-width', signal, this);
        button.addEventListener('keydown', e => {
            if (!button.matches(':disabled')) {
                switch (e.key) {
                    case 'ArrowUp': {
                        options.showPopover();
                        this._goToItem(Selected);
                        e.preventDefault();
                        break;
                    }
                    case 'ArrowDown': {
                        options.showPopover();
                        this._goToItem(Selected);
                        e.preventDefault();
                        break;
                    }
                    case 'Enter': {
                        e.preventDefault();
                        this.#internals.form?.requestSubmit();
                        break;
                    }
                    case ' ': {
                        e.preventDefault();
                        if (options.hasAttribute('open') && this.#search?._hasQuery()) {
                            e.stopPropagation();
                            this.#search?._searchByKey(e.key);
                            break;
                        }
                        if (options.hasAttribute('open'))
                            options.hidePopover();
                        else {
                            options.showPopover();
                            this._goToItem(Selected);
                        }
                        break;
                    }
                    default: {
                        if (!options.hasAttribute('open')) return;
                        if (e.key.length !== 1 || [e.ctrlKey, e.altKey, e.metaKey].some(Boolean)) return;
                        e.preventDefault();
                        e.stopPropagation();
                        this._handleSearchKey(e.key);
                    }
                }
            }
        }, { signal });

        for (let label of this.#internals.labels)
            (label as HTMLLabelElement).setAttribute('for', button.id);

        this.#search = SelectQuery(options, {
            _role: 'listbox',
            _getItems: () => this._getItems(),
            _onItemClick: s => this._setSelectedOption(s),
            _getButton: () => this._getButton(),
            _onBeforeOpen: () => this._onBeforeOpen(),
            _onBeforeClose: () => this._onBeforeClose()
        }, signal);

        options.addEventListener('keydown', e => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    e.stopPropagation();
                    return this._goToItem(3);
                case 'ArrowUp':
                    e.preventDefault();
                    e.stopPropagation();
                    return this._goToItem(2);
                case 'Home':
                case 'PageUp':
                    e.preventDefault();
                    e.stopPropagation();
                    return this._goToItem(0);
                case 'End':
                case 'PageDown':
                    e.preventDefault();
                    e.stopPropagation();
                    return this._goToItem(1); // @ts-expect-error
                case ' ':
                    if (this.#search?._hasQuery()) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.#search._searchByKey(e.key);
                        return;
                    }
                case 'Enter': {
                    e.preventDefault();
                    e.stopPropagation();
                    const active = this._getActiveItem();
                    if (active)
                        active.click();
                    else
                        options.hidePopover();
                    return;
                }
                case 'Tab': {
                    this.#search?._skipNextBlur();
                    break;
                }
                case 'Escape': {
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
                    this.#search?._searchByKey(e.key);

                }
            }
        }, { signal });

        options.addEventListener('toggle', (e: ToggleEvent) => {
            if (e.newState === 'open')
                this._onOpen();
        }, { signal });

        for (let option of Array.from(options.querySelectorAll('ce-option[disabled]'))) {
            option.setAttribute('aria-disabled', 'true');
            option.setAttribute('aria-selected', 'false');
        }
    }
    _onAttributeChange(name: string, _: any, newVal: string) {
        switch (name) {
            case 'value': {
                if (newVal !== null)
                    this.value = newVal;
                break;
            }
            case 'required': {
                this.#validate();
            }
        }
    }
    _getButton(): HTMLButtonElement {
        let button: HTMLButtonElement | null = this.querySelector('button');
        if (!button)
            throw new Error('`<ce-select>` must include a button element.');
        return button;
    }
    _getOptions(): Options {
        let options: Options | null = this.querySelector('ce-options');
        if (!options)
            throw new Error('`<ce-select>` must include a `<ce-options>` element.');
        return options;
    }
    _setSelectedOption(option: HTMLElement) {
        this.value = option.getAttribute('value');
        this.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        this.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        this._getOptions().hidePopover();
    }
    _getOptionByName(name: string) {
        return this._getOptions()._getOptionByName(name);
    }
    _getItems(): Option[] {
        return this._getOptions()._getItems();
    }
    _getActiveItem() {
        return this.#search!._getFound();
    }
    _getSelectedOption() {
        return this._getOptionByName(this.#value!);
    }
    _goToItem(code: FocusCode = Nothing) {
        let options = this._getItems();
        if (options.length === 0)
            return;

        let activeItem = this._getActiveItem();
        if (activeItem === null && [Previous as FocusCode, Next].includes(code)) {
            this._goToItem(Selected);
            return;
        }
        if (code === Selected) {
            let selectedOption = this._getSelectedOption();
            if (selectedOption && isVisible(selectedOption)) {
                this._setActiveItem(selectedOption);
            } else
                this._goToItem(First);
            return;
        }
        let item: HTMLElement | null = focusTo(options, activeItem, code);
        if (item) {
            this._setActiveItem(item);
        }
    }
    _setActiveItem(item: HTMLElement) {
        this.#search?._setFound(item);
    }
    _clearActiveItem() {
        this.#search?._clearFound();
    }
    _onBeforeOpen() {
        let button = this._getButton();
        let tabIndex = button.dataset.originalTabIndex;
        if (tabIndex)
            button.dataset.originalTabIndex = tabIndex;
        button.setAttribute('tabIndex', '-1');
    }
    _onOpen() {
        if (this._getActiveItem() === null) {
            this._goToItem(Selected);
        }
    }
    _onBeforeClose() {
        const button = this._getButton();
        const tabIndex = button.dataset.originalTabIndex;
        delete button.dataset.originalTabIndex;
        if (tabIndex !== undefined)
            button.setAttribute('tabIndex', tabIndex);
        else
            button.removeAttribute('tabIndex');
        let activeItem = this._getActiveItem();
        if (activeItem !== null)
            activeItem.setAttribute('tabIndex', '-1');
    }
    _handleSearchKey(q: string) {
        this.#search?._searchByKey(q);
    }
    set value(value: string | null) {
        this.#value = value;
        this.#internals.setFormValue(value);
        this.#validate();

        let selected = this._getSelectedOption();
        if (!selected) return;
        for (let item of this._getItems())
            item.setAttribute('aria-selected', 'false');

        selected.setAttribute('aria-selected', 'true');
        try {
            for (let content of this.querySelectorAll('ce-selected'))
                (content as SelectedContent)._update()
        } catch {}
    }
    get value() {
        return this.#value;
    }
}

class SelectedContent extends BaseElement {
    _mount() {
        this._update();
    }
    _update() {
        let selectedOption = this._getSelect()._getSelectedOption();
        if (!selectedOption)
            return;

        let fragment = document.createDocumentFragment();
        for (let child of selectedOption.childNodes) {
            fragment.append(child.cloneNode(true));
        }
        this.replaceChildren(fragment);
    }
    _getSelect() {
        const select: Select | null = this.closest('ce-select');
        if (!select)
            throw new Error('`<ce-selected>` must be inside a `<ce-select>` element.');
        return select;
    }
}

defineCustomElement('ce-select', Select);
defineCustomElement('ce-selected', SelectedContent);