'use client'
import { createElement, useEffect, type HTMLAttributes, type DOMElement, type ReactElement } from 'react';
import type { Strategy } from '@floating-ui/dom';

let imported = false;
async function lazyImport() {
    if (imported) return;
    // @ts-ignore
    await import('@loudyo/elements');
    imported = true;
}
function useLazyImport() {
    useEffect(() => {
        lazyImport();
    }, []);
}

type Anchor = 'top' | 'top start' | 'top end' | 'right' | 'right start' | 'right end' | 'bottom' | 'bottom start' | 'bottom end' | 'left' | 'left start' | 'left end';

interface BaseProps {
    ref?: any;
}
interface AnchorProps {
    anchor?: Anchor;
    'anchor-strategy'?: Strategy;
}
interface PopoverProps {
    popover?: 'auto' | 'manual' | '';
}
interface OpenProps {
    open?: boolean | '';
}


export function Autocomplete(props: HTMLAttributes<HTMLElement> & BaseProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps, Element> {
    useLazyImport();
    return createElement('ce-autocomplete', props);
}
export function CommandPalette(props: Omit<HTMLAttributes<HTMLElement>, 'onChange'> & BaseProps & {
    onChange?: (event: CustomEvent<{
        relatedTarget: HTMLElement | null;
    }>) => void;
}): ReactElement<Omit<HTMLAttributes<HTMLElement>, "onChange"> & BaseProps & {
    onChange?: (event: CustomEvent<{
        relatedTarget: HTMLElement | null;
    }>) => void;
}> {
    useLazyImport();
    return createElement('ce-spotlight', props);
}

export function CommandList(props: HTMLAttributes<HTMLElement> & BaseProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps, Element> {
    useLazyImport();
    return createElement('ce-shortcut-list', props);
}

export function Defaults(props: HTMLAttributes<HTMLElement> & BaseProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps, Element> {
    useLazyImport();
    return createElement('ce-defaults', props);
}

export function Empty(props: HTMLAttributes<HTMLElement> & BaseProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps, Element> {
    useLazyImport();
    return createElement('ce-empty', props);
}
export function CommandGroup(props: HTMLAttributes<HTMLElement> & BaseProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps, Element> {
    useLazyImport();
    return createElement('ce-shortcut-group', props);
}

export function CommandPreview(props: HTMLAttributes<HTMLElement> & BaseProps & {
    for?: string;
}): DOMElement<HTMLAttributes<HTMLElement> & BaseProps & { for?: string; }, Element> {
    useLazyImport();
    return createElement('ce-shortcut-preview', props);
}

export function Dialog(props: HTMLAttributes<HTMLElement> & BaseProps & OpenProps & {
    onOpen?: (event: CustomEvent) => void;
    onClose?: (event: CustomEvent) => void;
    onCancel?: (event: Event) => void;
}): DOMElement<HTMLAttributes<HTMLElement> & BaseProps & OpenProps & {
    onOpen?: (event: CustomEvent) => void;
    onClose?: (event: CustomEvent) => void;
    onCancel?: (event: Event) => void;
}, Element> {
    useLazyImport();
    return createElement('ce-dialog', props);
}

export function DialogPanel(props: HTMLAttributes<HTMLElement> & BaseProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps, Element> {
    useLazyImport();
    return createElement('ce-dialog-panel', props);

}
export function DialogBackdrop(props: HTMLAttributes<HTMLElement> & BaseProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps, Element> {
    useLazyImport();
    return createElement('ce-dialog-backdrop', props);
}

export function Disclosure(props: HTMLAttributes<HTMLElement> & BaseProps & OpenProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps & OpenProps, Element> {
    useLazyImport();
    return createElement('ce-accordion', props);
}

interface SelectEventTarget extends EventTarget {
    value: string;
}
interface SelectEvent extends Event {
    currentTarget: SelectEventTarget;
}
export function Select(props: Omit<HTMLAttributes<HTMLElement>, 'onChange' | 'onInput'> & BaseProps & {
    name?: string;
    value?: string;
    required?: boolean;
    onInput?: (event: SelectEvent) => void;
    onChange?: (event: SelectEvent) => void;
}): ReactElement<Omit<HTMLAttributes<HTMLElement>, "onChange" | "onInput"> & BaseProps & {
    name?: string;
    value?: string;
    required?: boolean;
    onInput?: (event: SelectEvent) => void;
    onChange?: (event: SelectEvent) => void;
}> {
    useLazyImport();
    return createElement('ce-select', props);
}

export function Selected(props: HTMLAttributes<HTMLElement> & BaseProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps, Element> {
    useLazyImport();
    return createElement('ce-selected', props);
}

export function Menu(props: HTMLAttributes<HTMLElement> & BaseProps & AnchorProps & OpenProps & PopoverProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps & AnchorProps & OpenProps & PopoverProps, Element> {
    useLazyImport();
    return createElement('ce-menu', props);
}

export function Dropdown(props: HTMLAttributes<HTMLElement> & BaseProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps, Element> {
    useLazyImport();
    return createElement('ce-dropdown', props);
}

export function Options(props: HTMLAttributes<HTMLElement> & BaseProps & AnchorProps & OpenProps & PopoverProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps & AnchorProps & OpenProps & PopoverProps, Element> {
    useLazyImport();
    return createElement('ce-options', props);
}
export function Option(props: HTMLAttributes<HTMLElement> & BaseProps & {
    value: string;
    disabled?: boolean;
}): DOMElement<HTMLAttributes<HTMLElement> & BaseProps & {
    value: string;
    disabled?: boolean;
}, Element> {
    useLazyImport();
    return createElement('ce-option', props);
}
export function Popover(props: HTMLAttributes<HTMLElement> & BaseProps & AnchorProps & OpenProps & PopoverProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps & AnchorProps & OpenProps & PopoverProps, Element> {
    useLazyImport();
    return createElement('ce-popover', props);
}

export function PopoverGroup(props: HTMLAttributes<HTMLElement> & BaseProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps, Element> {
    useLazyImport();
    return createElement('ce-popover-group', props);
}

export function TabList(props: HTMLAttributes<HTMLElement> & BaseProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps, Element> {
    useLazyImport();
    return createElement('ce-tab-list', props);
}

export function TabPanels(props: HTMLAttributes<HTMLElement> & BaseProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps, Element> {
    useLazyImport();
    return createElement('ce-tab-panels', props);
}

export function TabGroup(props: HTMLAttributes<HTMLElement> & BaseProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps, Element> {
    useLazyImport();
    return createElement('ce-tab-group', props);
}

export function Copyable(props: HTMLAttributes<HTMLElement> & BaseProps): DOMElement<HTMLAttributes<HTMLElement> & BaseProps, Element> {
    useLazyImport();
    return createElement('ce-copy', props);
}

declare module 'react' {
    interface ButtonHTMLAttributes<T> {
        command?: 'show-modal' | 'close' | 'request-close' | 'show-popover' | 'hide-popover' | 'toggle-popover' | '--show' | '--hide' | '--toggle' | '--copy' | `--${string}` | undefined;
        commandfor?: string | undefined;
    }
}
