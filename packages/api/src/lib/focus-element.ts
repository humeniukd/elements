let focusVisible = false;
export function focusElement(el: HTMLElement) {
    el.focus?.({ focusVisible } as FocusOptions);
}

if (globalThis.window !== undefined) {
    document.addEventListener('keydown', (evt: KeyboardEvent) => {
        if (!evt.metaKey && !evt.altKey && !evt.ctrlKey) {
            focusVisible = true;
            document.documentElement.dataset.focusVisible = '';
        }
    }, true);
    document.addEventListener('click', (evt: PointerEvent) => {
        if (evt.detail === 1) {
            focusVisible = false;
            delete document.documentElement.dataset.focusVisible;
        } else if (evt.detail === 0) {
            focusVisible = true;
            document.documentElement.dataset.focusVisible = '';
        }
    }, true);
}