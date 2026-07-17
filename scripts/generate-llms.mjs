import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const docsRoot = path.join(root, 'src', 'content', 'docs');
const outputRoot = path.join(root, 'dist');
const publicCommit = '8adf9013a0929e5c7f1d4e849492d2387837a28d';
const sourceRev = '2ec0f0c8488842da03a71eeee3c61154957ca919';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = await Promise.all(entries.map((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  }));
  return results.flat();
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

const [owner = '', repository = ''] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
const userSite = repository === `${owner}.github.io`;
const base = (process.env.BASE_PATH ?? (owner && repository && !userSite ? `/${repository}` : '')).replace(/\/$/, '');
const site = (process.env.SITE_URL ?? (owner ? `https://${owner}.github.io` : 'http://localhost:4321')).replace(/\/$/, '');

const articles = [];
for (const file of (await walk(docsRoot)).filter((item) => item.endsWith('.mdx') && !['index.mdx', '404.mdx'].includes(path.basename(item)))) {
  const source = await readFile(file, 'utf8');
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const slug = path.relative(docsRoot, file).replaceAll('\\', '/').replace(/\.mdx$/, '');
  articles.push({
    title: scalar(frontmatter, 'title'),
    description: scalar(frontmatter, 'description'),
    sourcePaths: list(frontmatter, 'sourcePaths'),
    officialDocs: list(frontmatter, 'officialDocs'),
    url: `${site}${base}/${slug}/`,
  });
}

articles.sort((a, b) => a.url.localeCompare(b.url, 'zh-CN'));

const lines = [
  '# Grok Build Architecture',
  '',
  '> Grok Build 源码架构白皮书：基于公开 Rust 源码的非官方社区学习项目。',
  '',
  `- Public repository commit: ${publicCommit}`,
  `- Monorepo SOURCE_REV: ${sourceRev}`,
  '- Last verified: 2026-07-17',
  '- Upstream: https://github.com/xai-org/grok-build',
  '- Official product docs: https://docs.x.ai/build/overview',
  '',
  '## Documents',
  '',
];

for (const article of articles) {
  lines.push(`- [${article.title}](${article.url}): ${article.description}`);
  if (article.sourcePaths.length) lines.push(`  Source paths: ${article.sourcePaths.join(', ')}`);
  if (article.officialDocs.length) lines.push(`  Official docs: ${article.officialDocs.join(', ')}`);
}

lines.push('', '## Reading policy', '', 'Design-intent statements marked “推断” are inferences. Source links in the site use the fixed public commit above. Prefer official documentation for installation, commands, configuration, pricing, and current product behavior.', '');

await mkdir(outputRoot, { recursive: true });
await writeFile(path.join(outputRoot, 'llms.txt'), lines.join('\n'), 'utf8');
console.log(`Generated dist/llms.txt with ${articles.length} documents.`);
