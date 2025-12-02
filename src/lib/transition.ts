import { disposables } from "./disposables";

type TransitionDirection = "in" | "out";

export type Transition = {
    start(dir: TransitionDirection, cb?: VoidFunction): void
    abort: VoidFunction
}

export function transition(el: HTMLElement, query = () => []): Transition {
    let changedDirection = false;
    let lastDirection: TransitionDirection | null = null;
    let d = disposables();
    return {
        start(direction: TransitionDirection, cb?: VoidFunction) {
            let elements = [el, ...query()];
            if (changedDirection) {
                changedDirection = false;
            } else {
                changedDirection = lastDirection !== null && lastDirection !== direction;
            }
            lastDirection = direction;
            for (let l of elements) {
                prepareTransition(l, () => {
                    if (!changedDirection) {
                        if (direction === "in") {
                            l.dataset.transition = "";
                            l.dataset.enter = "";
                            l.dataset.closed = "";
                            delete l.dataset.leave;
                        } else if (direction === "out") {
                            l.dataset.transition = "";
                            l.dataset.leave = "";
                            delete l.dataset.enter;
                        }
                    }
                }, lastDirection !== null);
            }
            d.nextFrame(() => {
                for (let l of elements) {
                    if (changedDirection) {
                        if (direction === "in") {
                            delete l.dataset.enter;
                            delete l.dataset.closed;
                            l.dataset.leave = "";
                        } else if (direction === "out") {
                            delete l.dataset.leave;
                            l.dataset.enter = "";
                            l.dataset.closed = "";
                        }
                    } else if (direction === "in") {
                        delete l.dataset.closed;
                    } else if (direction === "out") {
                        l.dataset.closed = "";
                    }
                }
                d.requestAnimationFrame(() => {
                    d.add(waitForTransition(el, () => {
                        if (!changedDirection || !elements.some(l => hasPendingTransitions(l))) {
                            for (let l of elements) {
                                delete l.dataset.transition;
                                delete l.dataset.enter;
                                delete l.dataset.closed;
                                delete l.dataset.leave;
                            }
                            lastDirection = null;
                            cb?.();
                        }
                    }));
                });
            });
        },
        abort() {
            d.dispose();
            changedDirection = false;
            lastDirection = null;
        }
    };
}

function prepareTransition(el: HTMLElement, action: VoidFunction, continuation = false) {
    if (continuation) {
        action();
        return;
    }
    let transition = el.style.transition;
    el.style.transition = "none";
    action();
    el.offsetHeight;
    el.style.transition = transition;
}

export function waitForTransition(el: HTMLElement, onFinish: VoidFunction) {
    let d = disposables();
    if (!el)
        return d.dispose;

    let flag = false;
    d.add(() => { flag = true; });

    let transitions = el.getAnimations?.({ subtree: true }).filter(a => a instanceof CSSTransition) ?? [];

    if (!transitions.length) {
        onFinish();
        return d.dispose;
    } else {
        Promise.allSettled(transitions.map(a => a.finished)).then(() => {
            if (!flag) onFinish();
        });
        return d.dispose;
    }
}

export function hasPendingTransitions(el: HTMLElement) {
    return (el.getAnimations?.() ?? []).some(t => t instanceof CSSTransition && t.playState !== "finished");
}