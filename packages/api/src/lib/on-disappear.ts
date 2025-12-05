export function isVisible(el: Element) {
    let rect = el.getBoundingClientRect();
    return (
        rect.x !== 0 ||
        rect.y !== 0 ||
        rect.width !== 0 ||
        rect.height !== 0
    ) && (el.ownerDocument.defaultView || window).getComputedStyle(el).visibility !== 'hidden';
}

export function onDisappear(el: HTMLElement, signal: AbortSignal, cb: VoidFunction) {
  function eventHandler() {
    if (!isVisible(el)) {
      for (let child of el.children)
        if (isVisible(child)) return;
      cb();
    }
  }
  if (typeof ResizeObserver !== 'undefined') {
    let resizeObserver = new ResizeObserver(eventHandler);
    resizeObserver.observe(el);
    signal.addEventListener('abort', () => resizeObserver.disconnect());
  }
  if (typeof IntersectionObserver !== 'undefined') {
    const intersectionObserver = new IntersectionObserver(eventHandler);
    intersectionObserver.observe(el);
    signal.addEventListener('abort', () => intersectionObserver.disconnect());
  }
}