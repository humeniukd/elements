import { disposables } from "../disposables";

import { handleIOSLocking } from './handle-ios-locking';
import { adjustScrollbarPadding } from './adjust-scrollbar-padding';
import { preventScroll } from './prevent-scroll';

class DocumentMap extends Map {
    private readonly factory;

    constructor(factory: (key: Document) => any) {
        super();
        this.factory = factory;
    }

    get(key: Document) {
        let val = super.get(key);
        if (val === undefined) {
            val = this.factory(key);
            this.set(key, val);
        }
        return val;
    }
}

const referenceCountMap = new DocumentMap(() => ({
    referenceCounter: 0,
    d: disposables()
}));

export function documentOverflow(doc: Document) {
    let bag = referenceCountMap.get(doc);
    bag.referenceCounter++;

    if (bag.referenceCounter === 1) {
        let steps = [handleIOSLocking(), adjustScrollbarPadding(), preventScroll()];

        steps.forEach(({ before }) => before?.({ doc, d: bag.d }));

        steps.forEach(({ after }) => after?.({ doc, d: bag.d }));
    }

    let flag = false;
    return () => {
        if (!flag) {
            flag = true;
            bag.referenceCounter--;
            if (!(bag.referenceCounter > 0)) {
                bag.d.dispose();
                referenceCountMap.delete(doc);
            }
        }
    };
}

export function handleDocumentOverflow(el: HTMLElement, signal: AbortSignal) {
    let handler: VoidFunction | null = null;
    el.addEventListener("toggle", evt => {
        if (evt.newState === "open")
            handler ||= documentOverflow(el.ownerDocument);
        else if (handler) {
            handler();
            handler = null;
        }
    }, { signal });
    signal.addEventListener("abort", () => {
        if (handler) {
            handler();
            handler = null;
        }
    });
}