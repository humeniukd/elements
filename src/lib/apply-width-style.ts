export function applyWidthStyle(src: HTMLElement, style: string, signal: AbortSignal, target: HTMLElement) {
    function resize() {
        let rect = src.getBoundingClientRect();
        target.style.setProperty(style, rect.width + "px");
    }
    let document = src.ownerDocument;
    let resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(src);
    document.addEventListener("transitionend", resize, { signal });
    signal.addEventListener("abort", () => resizeObserver.disconnect());
}