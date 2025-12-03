import { ElDialog } from "../ce-dialog";

type DialogClose = typeof HTMLDialogElement.prototype.close;

type DialogCloseParams = Parameters<DialogClose>

export let originalClose: DialogClose | null = null;

if (globalThis.window !== undefined) {
    originalClose = HTMLDialogElement.prototype.close;
    Object.defineProperties(HTMLDialogElement.prototype, {
        close: {
            value(...params: DialogCloseParams) {
                let dialog = this.closest("ce-dialog");
                if (!(dialog instanceof ElDialog)) {
                    return originalClose?.apply(this, params);
                }
                let shouldClose: boolean | Promise<boolean> = dialog.beforeClose();
                if (shouldClose === true) {
                    return originalClose?.apply(this, params);
                }
                if (shouldClose !== false) {
                    shouldClose.then(res => res ? originalClose?.apply(this, params) : null).catch(console.error);
                }
            }
        }
    });

    document.addEventListener("command", event => {
        let target = event.target;
        if (!(target instanceof HTMLDialogElement) || !("command" in event) || event.command !== "close")
            return;

        let dialog = target.closest("ce-dialog");

        if (!isDialog(dialog)) return;

        let shouldClose = dialog!.beforeClose();
        if (shouldClose !== true) {
            event.stopImmediatePropagation();
            event.preventDefault();
            if (shouldClose !== false) {
                shouldClose.then(res => res ? originalClose?.apply(target) : null).catch(console.error);
            }
        }
    }, true);
}

function isDialog(dialog: Element | null): dialog is ElDialog {
    return Boolean(dialog) && dialog instanceof ElDialog;
}