import { BaseElement } from './base-el';
import { getAutoId } from './get-auto-id';
import { createPopover } from './create-popover';
import { handleDocumentOverflow } from './overflow';
import { debounceByKeydownEvent } from './debounce-by-keydown-event';
import { onPopoverGroupBlur } from './on-popover-group-blur';
import { isElement } from './dom';
import { history } from './active-element-history';
import { focusElement } from './focus-element';
import { isVisible } from './on-disappear';

type SelectQueryOptions = {
    _role: string
    _getItems(): HTMLElement[]
    _onItemClick(item: HTMLElement): void
    _getButton(): HTMLElement
    _onBeforeOpen: VoidFunction
    _onBeforeClose: VoidFunction
}

export type SelectQueryHelper = ReturnType<typeof SelectQuery>

const clickDelay = 200;
export function SelectQuery(el: BaseElement, options: SelectQueryOptions, signal: AbortSignal) {

    let currentActiveItem: HTMLElement | null = null,
        currentQuery = '',
        typeTimeout: number | null = null,
        holdFocusTill: number | null = null;

    let button = options._getButton();

    el.id ||= getAutoId(options._role);
    button.id ||= getAutoId(`${options._role}-button`);

    createPopover(el, signal, () => [options._getButton()], () => options._getButton(), () => options._onBeforeOpen(), () => {
        options._onBeforeClose();
        _clearFound();
        currentQuery = '';
        if (typeTimeout) {
            clearTimeout(typeTimeout);
            typeTimeout = null;
        }
    });
    handleDocumentOverflow(el, signal);
    el.setAttribute('popover', 'manual');
    el.setAttribute('role', options._role);
    button.setAttribute('popovertarget', el.id);
    button.setAttribute('aria-haspopup', options._role);

    let set = new WeakSet;
    function onDomChange() {
        const items = options._getItems();
        const opts = { passive: true, signal };
        
        const role = 'menu' === options._role ? 'menuitem' : 'option';

        for (let item of items) {
            if (set.has(item))
                continue;
            set.add(item);
            item.id ||= getAutoId('item');
            item.setAttribute('role', role);
            item.setAttribute('tabIndex', '-1');
            item.addEventListener('click', () => options._onItemClick(item), opts);
                
            debounceByKeydownEvent(item, 'mouseover', signal, () => _setFound(item, false));
            debounceByKeydownEvent(item, 'mouseout', signal, () => _clearFound());
        }
    }
    onDomChange();

    let observer = new MutationObserver(onDomChange);
    observer.observe(el, { attributes: false, childList: true, subtree: true });

    onPopoverGroupBlur(el, [button], el, signal, relatedTarget => {
        if (relatedTarget === null)
            holdFocusTill = Date.now() + 100;
        el.hidePopover()
    });

    let pointerDownMs: number | null = null, isTouch = false;
    button.addEventListener('pointerdown', e => {
        if (e.button === 0  && !button.matches(':disabled')) {
            if ('touch' === e.pointerType)
                return void (isTouch = true);
            el.togglePopover();
            pointerDownMs = Date.now();
        }
    }, { signal: signal });

    document.addEventListener('pointerup', e => {
        if (
            e.button !== 0 ||
            button.matches(':disabled') ||
            !el.hasAttribute('open')
        ) return;
        
        if (Date.now() - (pointerDownMs ?? 0) < clickDelay)
            return;

        let composedPath = e.composedPath();
        if (composedPath.includes(el)) {
            if (pointerDownMs) {
                let activeItem = _getFound();
                activeItem && activeItem.click()
            } return;
        }

        for (let target of composedPath) {
            if (!isElement(target)) continue;
            if ([
                    target.getAttribute('commandfor'),
                    target.getAttribute('popovertarget')
                ].includes(el.id)
            ) return;
        }

        el.hidePopover()
        
        pointerDownMs = null
        
    }, { signal: signal, capture: true });

    button.addEventListener('click', e => {
        if (isTouch)
            isTouch = false
        else {
            e.preventDefault();
            e.stopPropagation();
        }
    }, { signal });

    let lastActiveElement: HTMLElement | null = null;
    function _setFound(item: HTMLElement, shouldScroll = true) {
        let prevActiveItem = _getFound();

        prevActiveItem?.setAttribute('tabIndex', '-1');
        el.removeAttribute('tabIndex');

        item.setAttribute('tabIndex', '0');
        item.focus({ preventScroll: true });

        currentActiveItem = item;
        if (shouldScroll)
            item.scrollIntoView({ block: 'nearest' })
    }

    function _clearFound() {
        let prevActiveItem = _getFound();
        prevActiveItem?.setAttribute('tabIndex', '-1');
        currentActiveItem = null;

        if (el.hasAttribute('open')) {
            el.setAttribute('tabIndex', '0');
            el.focus();
        }
    }

    function _getFound() {
        return currentActiveItem;
    }

    function findItemBySearchQuery(q: string, isEmpty = false) {
        if ('' === q)
            return null;
        
        let items = options._getItems(),
            query = q.toLowerCase(),
            currentActive = _getFound(),
            idx = currentActive ? items.indexOf(currentActive) : -1;
        
        if (
            !isEmpty &&
            currentActive &&
            idx !== -1 &&
            isVisible(currentActive) &&
            (currentActive.textContent?.trim().toLowerCase() ?? '').startsWith(query)
        )
            return currentActive;
        
        for (let i = idx + 1; i < items.length; i++)
            if (
                (items[i].textContent?.trim().toLowerCase() ?? '').startsWith(query) &&
                isVisible(items[i])
            )
                return items[i];

        for (let j = 0; j <= idx; j++)
            if (
                (items[j].textContent?.trim().toLowerCase() ?? '').startsWith(query) &&
                isVisible(items[j])
            )
                return items[j];

        return null;
    }

    el.addEventListener('beforetoggle', e => {
        if (
            'open' === e.newState &&
            'closed' === e.oldState &&
            history.length > 0 &&
            !lastActiveElement
        )
            lastActiveElement = history[0];
    }, { signal });

    el.addEventListener('toggle', e => {
        if ('closed' === e.newState && 'open' === e.oldState)
            setTimeout(() => {
                if (!el.contains(document.activeElement) && document.activeElement !== document.body)
                    return;
                if (holdFocusTill && Date.now() < holdFocusTill)
                    return;
    
                if (lastActiveElement && lastActiveElement !== document.activeElement && lastActiveElement.isConnected)
                    focusElement(lastActiveElement);
                lastActiveElement = null
            })
    }, { signal });

    signal.addEventListener('abort', () => {
        if (typeTimeout) {
            clearTimeout(typeTimeout);
            typeTimeout = null;
        }
        observer.disconnect()
    })

    return {
        _skipNextBlur: () => holdFocusTill = Date.now() + 100,
        _setFound,
        _clearFound,
        _getFound,
        _searchByKey(query: string) {
            let isEmpty = '' === currentQuery;

            if (typeTimeout) {
                clearTimeout(typeTimeout);
                typeTimeout = null;
            }
            currentQuery += query.toLowerCase();
            let match = findItemBySearchQuery(currentQuery, isEmpty);

            match && _setFound(match, true);
            
            typeTimeout = setTimeout(() => {
                currentQuery = '';
                typeTimeout = null;
            }, 350)
        },
        _hasQuery() {
            return '' !== currentQuery
        }
    } as const;
}