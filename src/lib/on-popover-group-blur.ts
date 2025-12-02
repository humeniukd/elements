export function onPopoverGroupBlur(group: HTMLElement, buttons: HTMLElement[], popover: HTMLElement, signal: AbortSignal, callback: (el: HTMLElement | null) => void) {
    let ts: number | null = null;

    for (let button of buttons) {
        button.addEventListener("pointerdown", (e: PointerEvent) => {
            if (e.button === 0 && group.classList.contains(":popover-open"))
                ts = Date.now() + 100;
        }, { signal, capture: true });
    }

    group.ownerDocument.addEventListener("focusin", (evt: FocusEvent) => {
        if (!popover.hasAttribute("open"))
            return;

        let target = evt.target as HTMLElement;

        if (target === null) return;
        if (ts && Date.now() >= ts) return;
        if (group.contains(target) || buttons.some(b => b.contains(target)))
            return;
        callback(evt.relatedTarget as HTMLElement);
    }, { signal });
}