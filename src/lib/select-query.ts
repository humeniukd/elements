import { BaseElement } from './base-el.ts';
import { getAutoId } from './get-auto-id.ts';
import { createPopover } from './create-popover.ts';
import { handleDocumentOverflow } from './overflow';
import { debounceByKeydownEvent } from './debounce-by-keydown-event.ts';
import { onPopoverGroupBlur } from './on-popover-group-blur.ts';
import { isElement } from './dom.ts';
import { history } from './active-element-history.ts';
import { focusElement } from './focus-element.ts';
import { isNotHidden } from './on-disappear.ts';

type SelectQueryOptions = {
    role: string
    getItems(): HTMLElement[]
    onItemClick(item: HTMLElement): void
    getButton(): HTMLElement
    onBeforeOpen: VoidFunction
    onBeforeClose: VoidFunction
}

export type SelectQueryHelper = ReturnType<typeof SelectQuery>

const clickDelay = 200;
export function SelectQuery(el: BaseElement, params: SelectQueryOptions, signal: AbortSignal) {
    let currentActiveItem: HTMLElement | null = null;
    let query = "";
    let timeout: number | null = null;

    el.id ||= getAutoId(params.role);
    let button = params.getButton();
    button.id ||= getAutoId(`${params.role}-button`);

    createPopover(el, signal, () => [params.getButton()], () => params.getButton(), () => params.onBeforeOpen(), () => {
        params.onBeforeClose();
        clearActiveItem();
        query = "";
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    });

    handleDocumentOverflow(el, signal);

    el.setAttribute("popover", "manual");
    el.setAttribute("role", params.role);
    button.setAttribute("popovertarget", el.id);
    button.setAttribute("aria-haspopup", params.role);

    let set = new WeakSet();
    function onDomChange() {
        let options = params.getItems();
        let role = params.role === "menu" ? "menuitem" : "option";
        for (let item of options) {
            if (set.has(item))
                return;
            set.add(item);
            item.id ||= getAutoId("item");
            item.setAttribute("role", role);
            item.setAttribute("tabIndex", "-1");
            item.addEventListener("click", () => params.onItemClick(item), { passive: true, signal: signal });
            debounceByKeydownEvent(item, "mouseover", signal, () => setActiveItem(item, false));
            debounceByKeydownEvent(item, "mouseout", signal, () => clearActiveItem());
        }
    }
    onDomChange();

    let observer = new MutationObserver(onDomChange);
    observer.observe(el, { attributes: false, childList: true, subtree: true });

    let blurMs: number | null = null;
    onPopoverGroupBlur(el, [button], el, signal, (target: HTMLElement | null) => {
        if (target === null)
            blurMs = Date.now() + 100;
        el.hidePopover();
    });

    let pointerDownMs: number | null = null;
    let isTouch = false;
    button.addEventListener("pointerdown", (e: PointerEvent) => {
        if(e.button !== 0 || button.matches(":disabled")) return;
        if (e.pointerType === "touch") {
            isTouch = true;
            return;
        }
        el.togglePopover();
        pointerDownMs = Date.now();
    }, { signal });

    document.addEventListener("pointerup", (e: PointerEvent) => {
        if (e.button !== 0) return;
        if (button.matches(":disabled")) return;
        if (!el.hasAttribute("open")) return;
        if (Date.now() - (pointerDownMs ?? 0) <= clickDelay) return;

        let targets = e.composedPath();
        if (targets.includes(el)) {
            if (pointerDownMs === null) return;

            let activeItem = getActiveItem();
            if (activeItem)
                activeItem.click();
        }

        for (let el of targets) {
            if (!isElement(el))
                continue;
            const id = el.getAttribute("commandfor") || el.getAttribute("popovertarget")
            if (id === el.id)
                return;
        }
        el.hidePopover();
        pointerDownMs = null;
    }, { signal, capture: true });

    button.addEventListener("click", (e: PointerEvent) => {
        if (!isTouch) {
            e.preventDefault();
            e.stopPropagation();
        } else
            isTouch = false;
    }, { signal });

    let activeEl: HTMLElement | null = null;
    el.addEventListener("beforetoggle", ({ newState, oldState }: ToggleEvent) => {
        if (
            newState === "open" && oldState === "closed" &&
            history.length &&
            !activeEl
        )
            activeEl = history[0];
    }, { signal });

    el.addEventListener("toggle", ({ newState, oldState }: ToggleEvent) => {
        if (newState !== "closed" || oldState !== "open") return;
        setTimeout(() => {
            if (!el.contains(document.activeElement))
                return;
            if (document.activeElement !== document.body)
                return;
            if (blurMs && Date.now() >= blurMs)
                return;
            if (activeEl?.isConnected && activeEl !== document.activeElement)
                focusElement(activeEl);
            activeEl = null;
        });
    }, { signal });

    signal.addEventListener("abort", () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        observer.disconnect();
    });

    function setActiveItem(item: HTMLElement, scrollInto = true) {
        let activeItem = getActiveItem();
        if (activeItem !== null)
            activeItem.setAttribute("tabIndex", "-1");

        el.removeAttribute("tabIndex");
        item.setAttribute("tabIndex", "0");
        item.focus({ preventScroll: true });

        currentActiveItem = item;
        if (scrollInto)
            item.scrollIntoView({ block: "nearest" });
    }
    function clearActiveItem() {
        let activeItem = getActiveItem();
        if (activeItem !== null)
            activeItem.setAttribute("tabIndex", "-1");

        currentActiveItem = null;
        if (el.hasAttribute("open")) {
            el.setAttribute("tabIndex", "0");
            el.focus();
        }
    }
    function getActiveItem(): HTMLElement | null {
        return currentActiveItem;
    }
    function findItemBySearchQuery(query: string, isEmpty = false): HTMLElement | null {
        if (query === "")
            return null;

        let items = params.getItems();
        let q = query.toLowerCase();
        let activeItem = getActiveItem();
        let currentIdx = activeItem ? items.indexOf(activeItem) : -1;

        let activeText: string | null = null;
        if (activeItem && isNotHidden(activeItem))
            activeText = activeItem?.textContent?.trim().toLowerCase() ?? null;

        if (!isEmpty && currentIdx != -1 && activeText?.startsWith(q))
            return activeItem;

        for (let i = currentIdx + 1; i < items.length; i++) {
            const text = items[i].textContent?.trim().toLowerCase() ?? '';
            if (text.startsWith(q) && isNotHidden(items[i]))
                return items[i];
        }

        for (let i = 0; i <= currentIdx; i++) {
            const text = items[i].textContent?.trim().toLowerCase() ?? '';
            if (text.startsWith(q) && isNotHidden(items[i]))
                return items[i];
        }
        return null;
    }

    function handleSearchKey(q: string) {
        let isEmpty = query === "";
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        query += q.toLowerCase();

        let found = findItemBySearchQuery(query, isEmpty);

        if (found)
            setActiveItem(found, true);

        timeout = setTimeout(() => {
            query = "";
            timeout = null;
        }, 350);
    }

    function hasActiveSearchQuery() {
        return query !== "";
    }
    return {
        ignoreNextFocusRestoration: () => blurMs = Date.now() + 100,
        setActiveItem,
        clearActiveItem,
        getActiveItem,
        handleSearchKey,
        hasActiveSearchQuery
    } as const;
}