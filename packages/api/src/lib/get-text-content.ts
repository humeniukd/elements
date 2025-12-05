import { isHTMLElement } from './dom';

const nonSearchableRegex = /([\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83E[\uDD10-\uDDFF])/g;

export function getTextContent(el: HTMLElement): string {
    let text = el.innerText ?? '';
    let node = el.cloneNode(true);
    if (!isHTMLElement(node)) {
        return text;
    }
    let partial = false;
    for (let el of node.querySelectorAll('[hidden],[aria-hidden],[role="img"]')) {
        el.remove();
        partial = true;
    }
    let content = partial ? node.innerText ?? '' : text;
    if (nonSearchableRegex.test(content)) {
        content = content.replace(nonSearchableRegex, '');
    }
    return content;
}

export function getContent(el: HTMLElement): string {
    let content = el.getAttribute('aria-label');
    if (typeof content == 'string')
        return content.trim();

    let labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
        let results = labelledBy.split(' ').map(id => {
            let l = document.getElementById(id);
            if (l) {
                let label = l.getAttribute('aria-label');
                if (typeof label == 'string') {
                    return label.trim();
                } else {
                    return getTextContent(l).trim();
                }
            }
            return null;
        }).filter(Boolean);
        if (results.length > 0)
            return results.join(', ');
    }
    return getTextContent(el).trim();
}
