export function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function sortDirectoryEntries(entries) {
  return [...entries].sort((left, right) => compareText(left.name, right.name));
}

export function sortSourceSymbols(symbols) {
  return [...symbols].sort((left, right) => (
    compareText(left.path, right.path)
    || left.line - right.line
    || compareText(left.kind, right.kind)
    || compareText(left.name, right.name)
  ));
}
