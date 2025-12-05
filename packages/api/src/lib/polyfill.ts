import { apply as applyPopover, isSupported as isPopoverSupported } from '@oddbird/popover-polyfill/fn';
import { apply as applyInvoker, isSupported as isInvokerSupported} from 'invokers-polyfill/fn';
import { isSupported as isDialogToggleEventsSupported, apply as applyDialogToggleEvents } from 'dialog-toggle-events-polyfill/fn';
import { onDocumentReady } from './utils';

if (globalThis.window !== undefined) {
    if (!isPopoverSupported()) {
        applyPopover();
        onDocumentReady(async () => {
            if (await hasCSSLayer('popover-polyfill')) {
                return;
            }
            let style = document.createElement('style');
            style.textContent = '@layer popover-polyfill;';
            style.setAttribute('suppressHydrationWarning', '');
            style.addEventListener('securitypolicyviolation', () => {
                console.log('CSP rules prevented defining `popover-polyfill` as the first CSS layer. To fix, please manually add the following CSS at the start of your first stylesheet:\n\n@layer popover-polyfill;\n' );
            });
            document.documentElement.prepend(style);
        });
    }
    if (!isInvokerSupported()) {
        applyInvoker();
    }
    if (!isDialogToggleEventsSupported()) {
        applyDialogToggleEvents();
    }
}
async function hasCSSLayer(layer: string) {
    await stylesLoaded();
    for (let styleSheet of document.styleSheets) {
        try {
            for (let rule of styleSheet.cssRules)
                if (rule instanceof CSSLayerStatementRule && rule.nameList?.includes(layer))
                    return true;
        } catch {}
    }
    return false;
}

async function stylesLoaded() {
    await Promise.all(
        Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(el => {
            if ((el as HTMLLinkElement).sheet) return Promise.resolve();
            return new Promise<void>(res => {
                el.addEventListener('load', () => res(), { once: true });
                el.addEventListener('error', () => res(), { once: true });
            })
        })
    );
}
