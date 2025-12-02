let keyPressedAt: number | null = null;
const debounceMs = 200;
let keyPressed = false;

function onKeydown() {
    if (keyPressed) return;
    keyPressed = true;
    document.addEventListener("keydown", () => {
        keyPressedAt = Date.now();
    }, { capture: true });
}

export function debounceByKeydownEvent(el: HTMLElement, eventName: string, signal: AbortSignal, handler: EventListener) {
    onKeydown();
    el.addEventListener(eventName, (e: Event) => {
        if (keyPressedAt === null || (Date.now() - keyPressedAt >= debounceMs))
            handler(e);
    }, { passive: true, signal });
}