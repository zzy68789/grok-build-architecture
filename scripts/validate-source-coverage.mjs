import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import atlas from '../src/data/source-atlas/index.json' with { type: 'json' };
import { ARTICLE_CATALOG } from '../src/data/article-catalog.mjs';

const root = process.cwd();
const sourceRoot = path.resolve(process.env.GROK_BUILD_SOURCE_DIR
  ?? (process.env.CI ? path.join(root, '.cache', 'grok-build') : 'D:\\Code\\Grok-build\\grok-build'));
const failures = [];
const appendices = [
  'appendices/crate-index.mdx',
  'appendices/file-module-index.mdx',
  'appendices/testing-architecture.mdx',
  'appendices/build-prod-third-party.mdx',
  'appendices/coverage-and-upgrade.mdx',
];

if (ARTICLE_CATALOG.length !== 48) failures.push(`expected 48 deep-dive articles, found ${ARTICLE_CATALOG.length}`);
if (new Set(ARTICLE_CATALOG.map((item) => item.slug)).size !== 48) failures.push('article slugs are not unique');
if (atlas.crateCount !== 73 || atlas.crates.length !== 73) failures.push(`expected 73 first-party crates, found ${atlas.crates.length}`);

const articleSlugs = new Set(ARTICLE_CATALOG.map((item) => item.slug));
const allFiles = new Map();
let recomputedProduction = 0;

for (const article of ARTICLE_CATALOG) {
  try { await access(path.join(root, 'src', 'content', 'docs', `${article.slug}.mdx`)); }
  catch { failures.push(`missing deep-dive route: ${article.slug}`); }
}
for (const appendix of appendices) {
  try { await access(path.join(root, 'src', 'content', 'docs', appendix)); }
  catch { failures.push(`missing appendix: ${appendix}`); }
}

for (const summaryCrate of atlas.crates) {
  const cratePath = path.join(root, 'src', 'data', 'source-atlas', 'crates', `${summaryCrate.name}.json`);
  const crate = JSON.parse(await readFile(cratePath, 'utf8'));
  if (!crate.role || !crate.layer) failures.push(`${crate.name}: missing role or layer`);
  if (!crate.keyEntrypoints.length) failures.push(`${crate.name}: no key entrypoint`);
  if (!crate.relatedArticles.length || !crate.relatedArticles.every((slug) => articleSlugs.has(slug))) failures.push(`${crate.name}: invalid article mapping`);
  try { await access(path.join(root, 'src', 'content', 'docs', 'source-atlas', 'crates', `${crate.name}.mdx`)); }
  catch { failures.push(`${crate.name}: missing crate atlas page`); }
  recomputedProduction += crate.files.filter((file) => file.kind === 'production').length;
  for (const file of crate.files) {
    if (allFiles.has(file.path)) failures.push(`duplicate file ownership: ${file.path}`);
    allFiles.set(file.path, crate.name);
    const absolute = path.join(sourceRoot, ...file.path.split('/'));
    let source;
    try { source = await readFile(absolute, 'utf8'); }
    catch { failures.push(`missing indexed source file: ${file.path}`); continue; }
    const lineCount = source.split(/\r?\n/).length;
    if (lineCount !== file.lineCount) failures.push(`stale line count ${file.path}: atlas=${file.lineCount}, source=${lineCount}`);
  }
}

if (recomputedProduction !== atlas.productionFileCount) failures.push(`production file total mismatch: ${recomputedProduction} vs ${atlas.productionFileCount}`);
if (allFiles.size !== atlas.rustFileCount) failures.push(`Rust file total mismatch: ${allFiles.size} vs ${atlas.rustFileCount}`);

if (failures.length) {
  console.error(`Coverage validation failed with ${failures.length} issue(s):`);
  failures.slice(0, 50).forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Coverage complete: ${ARTICLE_CATALOG.length} articles, ${atlas.crateCount}/73 crates, ${atlas.productionFileCount} production Rust files, ${allFiles.size} Rust files total, ${appendices.length} appendices.`);
