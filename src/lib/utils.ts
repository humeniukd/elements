export function defineCustomElement(tagName: string, Element: CustomElementConstructor) {
    if (typeof globalThis.customElements !== "undefined" && customElements.get(tagName) !== Element) {
        customElements.define(tagName, Element);
    }
}

export function onDocumentReady(callback: VoidFunction) {
    function onLoaded() {
        if (document.readyState !== "loading") {
            callback();
            document.removeEventListener("DOMContentLoaded", onLoaded);
        }
    }
    if (typeof window !== "undefined" && typeof document !== "undefined") {
        document.addEventListener("DOMContentLoaded", onLoaded);
        onLoaded();
    }
}