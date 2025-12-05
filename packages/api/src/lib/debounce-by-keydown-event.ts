let releaseAt: number | null = null;
const debounceMs = 200;
let keyPressed = false;

function onKeydown() {
    if (keyPressed) return;
    keyPressed = true;
    document.addEventListener('keydown', () => {
        releaseAt = Date.now() + debounceMs;
    }, { capture: true });
}

export function debounceByKeydownEvent(el: HTMLElement, eventName: string, signal: AbortSignal, handler: EventListener) {
    onKeydown();
    el.addEventListener(eventName, (e: Event) => {
        if (releaseAt === null || (Date.now() >= releaseAt))
            handler(e);
    }, { passive: true, signal });
}