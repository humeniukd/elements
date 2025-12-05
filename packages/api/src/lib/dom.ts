export function isNode(element: unknown): element is Node {
  if (typeof element !== 'object') return false
  if (element === null) return false
  return 'nodeType' in element
}

export function isElement(element: unknown): element is Element {
  return isNode(element) && 'tagName' in element
}

export function isHTMLElement(element: unknown): element is HTMLElement {
  return isElement(element) && 'accessKey' in element
}

// HTMLOrSVGElement doesn't inherit from HTMLElement or from Element. But this
// is the type that contains the `tabIndex` property.
//
// Once we know that this is an `HTMLOrSVGElement` we also know that it is an
// `Element` (that contains more information)
export function isHTMLorSVGElement(element: unknown): element is HTMLOrSVGElement & Element {
  return isElement(element) && 'tabIndex' in element
}

export function hasInlineStyle(element: unknown): element is ElementCSSInlineStyle {
  return isElement(element) && 'style' in element
}

export function isHTMLInputElement(element: unknown): element is HTMLInputElement {
  return isHTMLElement(element) && element.nodeName === 'INPUT'
}