import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import atlas from '../src/data/source-atlas/index.json' with { type: 'json' };

const projectRoot = process.cwd();
const docsRoot = path.join(projectRoot, 'src', 'content', 'docs');
const sourceRoot = path.resolve(process.env.GROK_BUILD_SOURCE_DIR
  ?? (process.env.CI ? path.join(projectRoot, '.cache', 'grok-build') : 'D:\\Code\\Grok-build\\grok-build'));

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  }));
  return nested.flat();
}

function frontmatterOf(source) {
  return source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
}

function scalar(frontmatter, field) {
  return frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))?.[1]?.replace(/^['"]|['"]$/g, '') ?? '';
}

function list(frontmatter, field) {
  const lines = frontmatter.split(/\r?\n/);
  const start = lines.findIndex((line) => line === `${field}:`);
  if (start < 0) return [];
  const values = [];
  for (const line of lines.slice(start + 1)) {
    const match = line.match(/^\s{2}-\s+(.+)$/);
    if (!match) break;
    values.push(match[1].replace(/^['"]|['"]$/g, ''));
  }
  return values;
}

function literalRefs(source) {
  return [...source.matchAll(/<SourceRef\s+([\s\S]*?)\s*\/>/g)].map((match) => ({
    path: match[1].match(/\bpath="([^"]+)"/)?.[1],
    start: Number(match[1].match(/\bstart=\{(\d+)\}/)?.[1]),
    end: Number(match[1].match(/\bend=\{(\d+)\}/)?.[1] ?? 0),
  }));
}

const failures = [];
try { await access(sourceRoot); } catch {
  console.error(`Source checkout not found: ${sourceRoot}`);
  process.exit(1);
}

const crateNames = new Set(atlas.crates.map((item) => item.name));
const files = (await walk(docsRoot)).filter((file) => file.endsWith('.mdx')).sort();
let validatedPaths = 0;
let validatedRanges = 0;

for (const file of files) {
  const relativeArticle = path.relative(projectRoot, file);
  const source = await readFile(file, 'utf8');
  const frontmatter = frontmatterOf(source);
  for (const field of ['title', 'description', 'lastVerified', 'coverageKind', 'sourceCrates', 'sourcePaths', 'officialDocs']) {
    if (!new RegExp(`^${field}:`, 'm').test(frontmatter)) failures.push(`${relativeArticle}: missing frontmatter field ${field}.`);
  }

  const kind = scalar(frontmatter, 'coverageKind');
  const declaredPaths = list(frontmatter, 'sourcePaths');
  const declaredCrates = list(frontmatter, 'sourceCrates');
  for (const crateName of declaredCrates) if (!crateNames.has(crateName)) failures.push(`${relativeArticle}: unknown source crate ${crateName}.`);
  if (kind === 'deep-dive' && declaredPaths.length < 5) failures.push(`${relativeArticle}: deep-dive needs at least 5 generated source entrypoints.`);
  if (kind === 'overview' && declaredPaths.length < 2) failures.push(`${relativeArticle}: overview needs at least 2 source paths.`);

  for (const sourcePath of declaredPaths) {
    try { await access(path.join(sourceRoot, ...sourcePath.split('/'))); validatedPaths += 1; }
    catch { failures.push(`${relativeArticle}: source path does not exist: ${sourcePath}.`); }
  }

  for (const reference of literalRefs(source)) {
    if (!reference.path || !Number.isInteger(reference.start) || reference.start < 1) {
      failures.push(`${relativeArticle}: malformed SourceRef.`);
      continue;
    }
    let upstream;
    try { upstream = await readFile(path.join(sourceRoot, ...reference.path.split('/')), 'utf8'); }
    catch { failures.push(`${relativeArticle}: SourceRef file not found: ${reference.path}.`); continue; }
    const lineCount = upstream.split(/\r?\n/).length;
    const lastLine = reference.end || reference.start;
    if (lastLine < reference.start || lastLine > lineCount) failures.push(`${relativeArticle}: invalid range ${reference.path}:${reference.start}-${lastLine}; file has ${lineCount} lines.`);
    else validatedRanges += 1;
  }
}

for (const crate of atlas.crates) {
  for (const entry of crate.keyEntrypoints) {
    const symbol = entry.symbols[0];
    if (symbol && (symbol.line < 1 || symbol.line > entry.lineCount)) failures.push(`${crate.name}: invalid generated symbol line ${symbol.path}:${symbol.line}.`);
    else validatedRanges += 1;
  }
}

if (failures.length) {
  console.error(`Source validation failed with ${failures.length} issue(s):`);
  failures.slice(0, 50).forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Validated ${validatedPaths} declared source paths and ${validatedRanges} exact/generated ranges across ${files.length} documents.`);
console.log(`Read-only source baseline: ${sourceRoot}`);
