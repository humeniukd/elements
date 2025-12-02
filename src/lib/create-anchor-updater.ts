import {
    autoUpdate,
    computePosition,
    flip,
    type Placement,
    platform,
    shift,
    type Strategy
} from "@floating-ui/dom";
import { hasPendingTransitions, waitForTransition } from "./transition";

function supportShowPopover() {
    return HTMLElement.prototype.showPopover?.toString().includes("[native code]");
}

function resolveCSSVariablePxValue(marginTop: string, container: Element) { //
    let tmpEl = document.createElement("div");
    container.appendChild(tmpEl);
    tmpEl.style.setProperty("margin-top", "0px", "important");
    tmpEl.style.setProperty("margin-top", marginTop, "important");
    const realMargin = parseFloat(window.getComputedStyle(tmpEl).marginTop) || 0;
    container.removeChild(tmpEl);
    return realMargin;
}

export function createAnchorUpdater(el: HTMLElement) {
    let update: VoidFunction = () => {};

    return function (condition: boolean, ref: HTMLElement | null) {
        update();
        if (!condition) {
            requestAnimationFrame(() => {
                if (hasPendingTransitions(el))
                    waitForTransition(el, () => el.style.removeProperty("position"));
                else
                    el.style.removeProperty("position");
            });
            return;
        }
        if (!ref || !el.hasAttribute("anchor"))
            return;

        let anchor: string | null = el.getAttribute("anchor");
        let anchorStrategy = (el.getAttribute("anchor-strategy") ?? "absolute") as Strategy;
        if (anchorStrategy !== "absolute" && anchorStrategy !== "fixed") {
            console.warn(`[createAnchorUpdater] Invalid anchor strategy "${anchorStrategy}" for element:`, el);
            anchorStrategy = "absolute";
        }
        update = autoUpdate(ref, el, () => {
            let gap = resolveCSSVariablePxValue(window.getComputedStyle(el).getPropertyValue("--anchor-gap"), el);
            let offset = resolveCSSVariablePxValue(window.getComputedStyle(el).getPropertyValue("--anchor-offset"), el);
            let attachment = anchor?.split(" ")[0];
            let padding = {};
            switch (attachment) {
                case "top":
                case "bottom":
                    padding = {
                        top: gap,
                        left: offset * -1,
                        right: offset,
                        bottom: gap
                    };
                    break;
                case "left":
                case "right":
                    padding = {
                        top: offset * -1,
                        bottom: offset,
                        left: gap,
                        right: gap
                    };
                    break;
            }

            computePosition(ref, el, {
                strategy: anchorStrategy,
                placement: anchor?.replace(" ", "-") as Placement,
                middleware: [ flip({ padding }), shift({ padding }) ]
            }).then(async ({ x, y, placement }) => {
                if (!supportShowPopover() && anchorStrategy === "absolute") {
                    let baseEl = null;
                    for (let node = el.parentElement; node; node = node.parentElement) {
                        let position = getComputedStyle(node).position;
                        if (position === "relative" || position === "absolute" || position === "fixed" || position === "sticky") {
                            baseEl = node;
                            break;
                        }
                    }
                    if (baseEl) {
                        const rect = baseEl.getBoundingClientRect();
                        x -= rect.left + window.scrollX;
                        y -= rect.top + window.scrollY;
                    }
                }
                let left = `${x}px`;
                let top = `${y}px`;
                switch (placement.split("-")[0]) {
                    case "top":
                        top = `calc(${y}px - var(--anchor-gap, 0px))`;
                        left = `calc(${x}px + var(--anchor-offset, 0px))`;
                        break;
                    case "right":
                        left = `calc(${x}px + var(--anchor-gap, 0px))`;
                        top = `calc(${y}px + var(--anchor-offset, 0px))`;
                        break;
                    case "bottom":
                        top = `calc(${y}px + var(--anchor-gap, 0px))`;
                        left = `calc(${x}px + var(--anchor-offset, 0px))`;
                        break;
                    case "left":
                        left = `calc(${x}px - var(--anchor-gap, 0px))`;
                        top = `calc(${y}px + var(--anchor-offset, 0px))`;
                        break;
                }
                let boundingRect = el.getBoundingClientRect();
                if (boundingRect.x === 0 && boundingRect.y === 0 && boundingRect.width === 0 && boundingRect.height === 0)
                    return;

                Object.assign(el.style, {
                    left: left,
                    top: top,
                    position: anchorStrategy
                });

                if (await platform.isRTL?.(el)) {
                    Object.assign(el.style, {
                        right: "unset",
                        bottom: "unset"
                    });
                }
            });
        });
    };
}