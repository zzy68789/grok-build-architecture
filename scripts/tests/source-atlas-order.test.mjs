import assert from 'node:assert/strict';
import test from 'node:test';
import { sortDirectoryEntries, sortSourceSymbols } from '../lib/source-atlas-order.mjs';

test('directory traversal order is canonical across filesystems', () => {
  const entries = ['types.rs', 'lib.rs', 'installer.rs', 'catalog.rs'].map((name) => ({ name }));
  const expected = ['catalog.rs', 'installer.rs', 'lib.rs', 'types.rs'];

  assert.deepEqual(sortDirectoryEntries(entries).map((entry) => entry.name), expected);
  assert.deepEqual(sortDirectoryEntries(entries.reverse()).map((entry) => entry.name), expected);
});

test('key symbols are canonical before truncation', () => {
  const symbols = [
    { path: 'src/lib.rs', line: 20, kind: 'fn', name: 'zeta' },
    { path: 'src/catalog.rs', line: 10, kind: 'struct', name: 'Catalog' },
    { path: 'src/lib.rs', line: 10, kind: 'fn', name: 'alpha' },
  ];
  const expected = [
    { path: 'src/catalog.rs', line: 10, kind: 'struct', name: 'Catalog' },
    { path: 'src/lib.rs', line: 10, kind: 'fn', name: 'alpha' },
    { path: 'src/lib.rs', line: 20, kind: 'fn', name: 'zeta' },
  ];

  assert.deepEqual(sortSourceSymbols(symbols), expected);
  assert.deepEqual(sortSourceSymbols(symbols.reverse()), expected);
});
