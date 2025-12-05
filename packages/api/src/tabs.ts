import { BaseElement } from './lib/base-el';
import { getAutoId } from './lib/get-auto-id';
import { defineCustomElement } from './lib/utils';

class TabGroup extends BaseElement {
    _mount(signal: AbortSignal) {
        let tabList: TabList = this.getList();
        let tabPanels: TabPanels = this.getPanels();
        let buttons: HTMLElement[] = tabList.getTabButtons();
        let panels = tabPanels.getPanels();

        if (buttons.length !== panels.length)
            return console.warn('[TabGroup] Mismatch count of tabs/panels');

        for (let i = 0; i < panels.length; i++) {
            let panel = panels[i];
            let button = buttons[i];

            button.id ||= getAutoId('ce-tab');
            panel.id ||= getAutoId('ce-tab-panel');

            panel.setAttribute('aria-labelledby', button.id);
            button.setAttribute('aria-controls', panel.id);
            button.setAttribute('role', 'tab');
        }

        let activeTab = this.getActiveTab();
        if (activeTab === -1)
            activeTab = 0;

        tabList.setActiveTab(activeTab);
        tabPanels.setActivePanel(activeTab);

        tabList.addEventListener('keydown', (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowLeft': {
                    e.preventDefault();
                    let idx = this.getActiveTab() - 1;
                    if (idx < 0)
                        idx = buttons.length - 1;
                    this.setActiveTab(idx);
                    buttons[idx].focus();
                    break;
                }
                case 'ArrowRight': {
                    e.preventDefault();
                    let idx = this.getActiveTab() + 1;
                    if (idx >= buttons.length)
                        idx = 0;
                    this.setActiveTab(idx);
                    buttons[idx].focus();
                    break;
                }
                case 'Home':
                case 'PageUp': {
                    e.preventDefault();
                    this.setActiveTab(0);
                    buttons[0].focus();
                    break;
                }
                case 'End':
                case 'PageDown': {
                    e.preventDefault();
                    this.setActiveTab(buttons.length - 1);
                    buttons[buttons.length - 1].focus();
                    break;
                }
            }
        }, { signal });

        for (let i = 0; i < buttons.length; i++)
            buttons[i].addEventListener('click', (e: PointerEvent) => {
                e.preventDefault();
                this.setActiveTab(i);
            }, { signal });
    }
    getActiveTab(): number {
        let tabPanels: TabPanels | null = this.querySelector('ce-tab-panels');
        let panel = tabPanels?.getPanels().find(el => !el.hasAttribute('hidden'));
        if (panel)
            return tabPanels!.getPanels().indexOf(panel);
        else
            return -1;
    }
    getList(): TabList {
        let tabList: TabList | null = this.querySelector('ce-tab-list');
        if (!tabList)
            throw new Error('[TabGroup] No `<ce-tab-list>` element found');
        return tabList;
    }
    getPanels(): TabPanels {
        let tabPanels: TabPanels | null = this.querySelector('ce-tab-panels');
        if (!tabPanels)
            throw new Error('[TabGroup] No `<ce-tab-panels>` element found');
        return tabPanels;
    }
    setActiveTab(idx: number) {
        if (this.getActiveTab() === idx)
            return;
        let tabList = this.getList();
        let tabPanels = this.getPanels();
        let buttons = tabList.getTabButtons();

        if (idx < 0) return;
        if (idx >= buttons.length) return;

        tabList.setActiveTab(idx);
        tabPanels.setActivePanel(idx);

    }
}

class TabList extends BaseElement {
    _mount() {
        this.setAttribute('role', 'tablist');
        this.setAttribute('aria-orientation', 'horizontal');
    }
    getTabButtons(): HTMLElement[] {
        let buttons = this.querySelectorAll('button');
        return Array.from(buttons);
    }
    setActiveTab(idx: number) {
        this.getTabButtons().forEach((button, i) => {
            let isActive = i === idx;
            button.setAttribute('tabindex', isActive ? '0' : '-1');
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    }
}

class TabPanels extends BaseElement {
    _mount() {
        const tabList = this.getTabGroup().getList();
        let panels = this.getPanels();

        let observer = new MutationObserver((mutations: MutationRecord[]) => {
            for (const mutation of mutations) {
                const target = mutation.target as HTMLElement;
                if (mutation.attributeName !== 'hidden' || target.hasAttribute(mutation.attributeName))
                    return;
                let idx = panels.indexOf(target);
                tabList.setActiveTab(idx);
                this.setActivePanel(idx);
            }
        });

        for (const panel of panels) {
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('tabindex', '0');
            observer.observe(panel, { attributeFilter: ['hidden'], attributes: true });
        }
    }
    getTabGroup() {
        let tabGroup: TabGroup | null = this.closest('ce-tab-group');
        if (!tabGroup)
            throw new Error('"<ce-tab-panels>" must be inside a "<ce-tab-group>" element.');
        return tabGroup;
    }
    getPanels(): Element[] {
        return Array.from(this.children);
    }
    setActivePanel(idx: number) {
        this.getPanels().forEach((panel, i) => {
            panel.toggleAttribute('hidden', i !== idx);
        });
    }
}

defineCustomElement('ce-tab-list', TabList);
defineCustomElement('ce-tab-panels', TabPanels);
defineCustomElement('ce-tab-group', TabGroup);