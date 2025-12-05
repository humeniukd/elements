export function onPopoverGroupBlur(group: HTMLElement, buttons: HTMLElement[], popover: HTMLElement, signal: AbortSignal, callback: (el: HTMLElement | null) => void) {
    let ts: number | null = null;

    for (let button of buttons) {
        button.addEventListener('pointerdown', (e: PointerEvent) => {
            if (e.button === 0 && group.classList.contains(':popover-open'))
                ts = Date.now() + 100;
        }, { signal, capture: true });
    }

    group.ownerDocument.addEventListener('focusin', (e: FocusEvent) => {
        if (!popover.hasAttribute('open'))
            return;
        let target = e.target as Node,
            relatedTarget = e.relatedTarget as HTMLElement;

        if (!target) return
        if (ts && Date.now() < ts) return;
        if (group.contains(target)) return;

        if (buttons.every(b => !b.contains(target)))
            callback(relatedTarget)
    }, { signal });
}