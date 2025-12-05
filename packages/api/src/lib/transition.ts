import { disposables } from './disposables';

type TransitionDirection = 'in' | 'out';

export type Transition = {
    _start(dir: TransitionDirection, cb?: VoidFunction): void
    _abort: VoidFunction
}

export function transition(el: HTMLElement, query = () => []): Transition {
    let changedDirection = false;
    let lastDirection: TransitionDirection | null = null;
    let d = disposables();
    const emptyString = '';
    return {
        _start(direction: TransitionDirection, cb?: VoidFunction) {
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
                        if (direction === 'in') {
                            l.dataset.transition = emptyString;
                            l.dataset.enter = emptyString;
                            l.dataset.closed = emptyString;
                            delete l.dataset.leave;
                        } else if (direction === 'out') {
                            l.dataset.transition = emptyString;
                            l.dataset.leave = emptyString;
                            delete l.dataset.enter;
                        }
                    }
                }, lastDirection !== null);
            }
            d._nextFrame(() => {
                for (let l of elements) {
                    if (changedDirection) {
                        if (direction === 'in') {
                            delete l.dataset.enter;
                            delete l.dataset.closed;
                            l.dataset.leave = emptyString;
                        } else if (direction === 'out') {
                            delete l.dataset.leave;
                            l.dataset.enter = emptyString;
                            l.dataset.closed = emptyString;
                        }
                    } else if (direction === 'in') {
                        delete l.dataset.closed;
                    } else if (direction === 'out') {
                        l.dataset.closed = emptyString;
                    }
                }
                d._requestAnimationFrame(() => {
                    d._add(waitForTransition(el, () => {
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
        _abort() {
            d._dispose();
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
    el.style.transition = 'none';
    action();
    el.offsetHeight;
    el.style.transition = transition;
}

export function waitForTransition(el: HTMLElement, onFinish: VoidFunction) {
    let d = disposables();
    if (!el)
        return d._dispose;

    let flag = false;
    d._add(() => { flag = true; });

    let transitions = el.getAnimations?.({ subtree: true }).filter(a => a instanceof CSSTransition) ?? [];

    if (!transitions.length) {
        onFinish();
        return d._dispose;
    } else {
        Promise.allSettled(transitions.map(a => a.finished)).then(() => {
            if (!flag) onFinish();
        });
        return d._dispose;
    }
}

export function hasPendingTransitions(el: HTMLElement) {
    return (el.getAnimations?.() ?? []).some(t => t instanceof CSSTransition && t.playState !== 'finished');
}