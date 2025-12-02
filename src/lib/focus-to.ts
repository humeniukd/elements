import { isNotHidden } from "./on-disappear";

export const FocusKey = {
    /** Focus the first non-disabled item. */
    First: 0,
    /** Focus the last non-disabled item. */
    Last: 1,
    /** Focus the previous non-disabled item. */
    Previous: 2,
    /** Focus the next non-disabled item. */
    Next: 3,
    /** Focus no items at all. */
    Nothing: 4,
    Selected: 5
} as const

export type FocusCode = typeof FocusKey[keyof typeof FocusKey]

export function focusTo(options: HTMLElement[], current: HTMLElement | null, code: number): HTMLElement | null {
    let currentIdx = current ? options.indexOf(current) : null;
    if (currentIdx === -1)
        currentIdx = null;
    switch (code) {
        // Home/PageUp
        case FocusKey.First: {
            for (const option of options)
                if (isNotHidden(option))
                    return option;
            return null;
        }
        // End/PageDown
        case FocusKey.Last: {
            for (let j = options.length - 1; j >= 0; j--)
                if (isNotHidden(options[j]))
                    return options[j];
            return null;
        }
        // ArrowUp
        case FocusKey.Previous: {
            if (currentIdx === null)
                return focusTo(options, current, FocusKey.Last);
            for (let i = currentIdx - 1; i >= 0; i--)
                if (isNotHidden(options[i]))
                    return options[i];
            return null;
        }
        // ArrowDown
        case FocusKey.Next: {
            if (currentIdx === null)
                return focusTo(options, current, FocusKey.First);
            for (let i = currentIdx + 1; i < options.length; i++)
                if (isNotHidden(options[i]))
                    return options[i];
            return null;
        }
        default:
            return null;
    }
}