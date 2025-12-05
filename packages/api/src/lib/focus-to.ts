import { isVisible } from './on-disappear';


    /** Focus the first non-disabled item. */
export const First = 0,
    /** Focus the last non-disabled item. */
    Last = 1,
    /** Focus the previous non-disabled item. */
    Previous = 2,
    /** Focus the next non-disabled item. */
    Next = 3,
    /** Focus no items at all. */
    Nothing = 4,
    Selected = 5
;

export type FocusCode = 0| 1| 2| 3| 4| 5;

export function focusTo(options: HTMLElement[], current: HTMLElement | null, code: number): HTMLElement | null {
    let currentIdx = current ? options.indexOf(current) : null;
    if (currentIdx === -1)
        currentIdx = null;
    switch (code) {
        // Home/PageUp
        case First: {
            for (const option of options)
                if (isVisible(option))
                    return option;
            return null;
        }
        // End/PageDown
        case Last: {
            for (let j = options.length - 1; j >= 0; j--)
                if (isVisible(options[j]))
                    return options[j];
            return null;
        }
        // ArrowUp
        case Previous: {
            if (currentIdx === null)
                return focusTo(options, current, Last);
            for (let i = currentIdx - 1; i >= 0; i--)
                if (isVisible(options[i]))
                    return options[i];
            return null;
        }
        // ArrowDown
        case Next: {
            if (currentIdx === null)
                return focusTo(options, current, First);
            for (let i = currentIdx + 1; i < options.length; i++)
                if (isVisible(options[i]))
                    return options[i];
            return null;
        }
        default:
            return null;
    }
}