import { transition } from './transition';
import { createAnchorUpdater } from './create-anchor-updater';
import { disposables } from './disposables';
import { onDisappear } from './on-disappear';
import { findEventTarget } from './active-element-history';
import type { BaseElement } from './base-el';

let isSafari = false;
let isFirefox = false;

if (navigator !== undefined) {
    isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
}

const activeDocuments = new WeakSet<Document>();
let isPoppedOver = false;

function focusTrick(document: Document) {
    if (isFirefox || isSafari || activeDocuments.has(document))
        return;

    activeDocuments.add(document);
    let timeout: number | null = null;
    document.addEventListener('mousedown', () => {
        if (isPoppedOver) {
            document.body.setAttribute('tabindex', '-1');
            if (timeout)
                clearTimeout(timeout);

            timeout = setTimeout(() => document.body.removeAttribute('tabindex'));
        }
    }, { capture: true });
}

export function createPopover(
    el: BaseElement,
    signal: AbortSignal,
    query: () => HTMLElement[],
    getAnchor?: () => HTMLElement,
    onOpen?: VoidFunction,
    onClose?: VoidFunction
) {
    focusTrick(el.ownerDocument);

    let t = transition(el);
    const anchorUpdater = createAnchorUpdater(el);
    let d = disposables();

    if (!el.hasAttribute('popover'))
        el.setAttribute('popover', '');

    let elements = query();
    for (let l of elements) {
        l.setAttribute('type', 'button');
        l.setAttribute('aria-haspopup', 'true');
        l.setAttribute('aria-controls', l.id);
        l.setAttribute('aria-expanded', 'false');
    }
    if (el.hasAttribute('open'))
        queueMicrotask(() => el.showPopover());

    function hide() {
        if (el.hasAttribute('open'))
            el.hidePopover();
    }
    let abortController = new AbortController();
    signal.addEventListener('abort', () => abortController.abort());

    el.addEventListener('beforetoggle', evt => {
        let anchor = findEventTarget(evt, elements);

        anchorUpdater(getAnchor?.() ?? anchor, evt.newState === 'open');

        if (evt.newState === 'open') {
            if (anchor) {
                onDisappear(anchor, abortController.signal, hide);
                onDisappear(el, abortController.signal, hide);
            }
        } else {
            abortController.abort();
            abortController = new AbortController();
        }
        let isOpen = el.hasAttribute('open');
        if (evt.newState === 'open' && !isOpen) {
            el._setAttributeNoCallbacks('open', '');
        } else if (evt.newState === 'closed' && isOpen) {
            el._removeAttributeNoCallbacks('open');
        }
        if (evt.newState === 'open') {
            anchor?.setAttribute('aria-expanded', 'true');
            if (anchor?.id)
                el.setAttribute('aria-labelledby', anchor.id);
            onOpen?.();
            isPoppedOver = el.getAttribute('popover') === '';
        } else {
            anchor?.setAttribute('aria-expanded', 'false');
            el.removeAttribute('aria-labelledby');
            onClose?.();
            isPoppedOver = false;
        }
        if (evt.oldState === 'closed' && evt.newState === 'open') {
            if (isSafari) {
                d._dispose();
                d = disposables();
            }
            t._start('in');
        } else if (evt.oldState === 'open' && evt.newState === 'closed') {
            if (isSafari)
                d._style(el, 'transition-property', 'none');
            t._start('out');
        }
    }, { signal });
    signal.addEventListener('abort', () => t._abort());
}