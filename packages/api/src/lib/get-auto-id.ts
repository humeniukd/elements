let idx = 0;
export function getAutoId(name: string) {
    return `${name}-${idx++}`;
}