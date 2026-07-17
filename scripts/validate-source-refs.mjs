import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const docsRoot = path.join(projectRoot, 'src', 'content', 'docs');
const sourceRoot = path.resolve(
  process.env.GROK_BUILD_SOURCE_DIR
    ?? (process.env.CI ? path.join(projectRoot, '.cache', 'grok-build') : 'D:\\Code\\Grok-build\\grok-build'),
);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  }));
  return nested.flat();
}

function frontmatterOf(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match?.[1] ?? '';
}

function listFromFrontmatter(frontmatter, field) {
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

function sourceRefsFrom(source) {
  return [...source.matchAll(/<SourceRef\s+([\s\S]*?)\s*\/>/g)].map((match) => {
    const attributes = match[1];
    return {
      path: attributes.match(/\bpath="([^"]+)"/)?.[1],
      start: Number(attributes.match(/\bstart=\{(\d+)\}/)?.[1]),
      end: Number(attributes.match(/\bend=\{(\d+)\}/)?.[1] ?? 0),
    };
  });
}

const failures = [];

try {
  await access(sourceRoot);
} catch {
  console.error(`Source checkout not found: ${sourceRoot}`);
  console.error('Set GROK_BUILD_SOURCE_DIR to the read-only Grok Build checkout.');
  process.exit(1);
}

const files = (await walk(docsRoot))
  .filter((file) => file.endsWith('.mdx') && !['index.mdx', '404.mdx'].includes(path.basename(file)))
  .sort();

if (files.length !== 15) {
  failures.push(`Expected 15 architecture articles, found ${files.length}.`);
}

let referenceCount = 0;

for (const file of files) {
  const relativeArticle = path.relative(projectRoot, file);
  const source = await readFile(file, 'utf8');
  const frontmatter = frontmatterOf(source);

  for (const field of ['title', 'description', 'lastVerified', 'sourcePaths', 'officialDocs']) {
    if (!new RegExp(`^${field}:`, 'm').test(frontmatter)) {
      failures.push(`${relativeArticle}: missing frontmatter field ${field}.`);
    }
  }

  const declaredPaths = listFromFrontmatter(frontmatter, 'sourcePaths');
  for (const sourcePath of declaredPaths) {
    try {
      await access(path.join(sourceRoot, ...sourcePath.split('/')));
    } catch {
      failures.push(`${relativeArticle}: declared source path does not exist: ${sourcePath}.`);
    }
  }

  const references = sourceRefsFrom(source);
  if (references.length < 2) {
    failures.push(`${relativeArticle}: expected at least 2 SourceRef entries, found ${references.length}.`);
  }

  for (const reference of references) {
    referenceCount += 1;
    if (!reference.path || !Number.isInteger(reference.start) || reference.start < 1) {
      failures.push(`${relativeArticle}: malformed SourceRef.`);
      continue;
    }

    const absoluteSource = path.join(sourceRoot, ...reference.path.split('/'));
    let upstream;
    try {
      upstream = await readFile(absoluteSource, 'utf8');
    } catch {
      failures.push(`${relativeArticle}: SourceRef file not found: ${reference.path}.`);
      continue;
    }

    const lineCount = upstream.split(/\r?\n/).length;
    const lastLine = reference.end || reference.start;
    if (lastLine < reference.start || lastLine > lineCount) {
      failures.push(`${relativeArticle}: invalid range ${reference.path}:${reference.start}-${lastLine}; file has ${lineCount} lines.`);
    }
  }
}

if (failures.length) {
  console.error(`Source validation failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Validated ${referenceCount} SourceRef entries across ${files.length} articles.`);
console.log(`Read-only source baseline: ${sourceRoot}`);
