import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const commit = '8adf9013a0929e5c7f1d4e849492d2387837a28d';
const [owner = '', repository = ''] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
const userSite = repository === `${owner}.github.io`;
const configuredBase = process.env.BASE_PATH ?? (process.env.GITHUB_ACTIONS === 'true' && repository && !userSite ? `/${repository}` : '/');
const base = `/${configuredBase.split('/').filter(Boolean).join('/')}`.replace(/^\/$/, '') || '';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = await Promise.all(entries.map((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  }));
  return results.flat();
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

const failures = [];
let localCount = 0;
let sourceCount = 0;
let officialCount = 0;
const htmlFiles = (await walk(dist)).filter((file) => file.endsWith('.html'));

for (const file of htmlFiles) {
  const relative = path.relative(dist, file).replaceAll('\\', '/');
  const route = relative === 'index.html'
    ? '/'
    : relative.endsWith('/index.html')
      ? `/${relative.slice(0, -'index.html'.length)}`
      : `/${relative}`;
  const html = await readFile(file, 'utf8');
  const links = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);

  for (const link of links) {
    if (link.startsWith('https://github.com/xai-org/grok-build/blob/')) {
      sourceCount += 1;
      if (!link.includes(`/${commit}/`)) failures.push(`${relative}: non-permanent source link ${link}`);
      continue;
    }
    if (link.startsWith('https://docs.x.ai/build/')) {
      officialCount += 1;
      continue;
    }
    if (/^(?:https?:|mailto:|data:|javascript:|#)/.test(link)) continue;

    localCount += 1;
    const currentPublicPath = `${base}${route}` || '/';
    const resolved = new URL(link, `https://local.invalid${currentPublicPath}`);
    const publicPath = decodeURIComponent(resolved.pathname);
    if (base && publicPath !== base && !publicPath.startsWith(`${base}/`)) {
      failures.push(`${relative}: local link escapes configured base: ${link}`);
      continue;
    }

    const withoutBase = base && publicPath.startsWith(base) ? publicPath.slice(base.length) || '/' : publicPath;
    const candidate = withoutBase.endsWith('/')
      ? path.join(dist, ...withoutBase.split('/').filter(Boolean), 'index.html')
      : path.join(dist, ...withoutBase.split('/').filter(Boolean));
    if (!await exists(candidate)) failures.push(`${relative}: unresolved local asset or route ${link}`);
  }
}

if (sourceCount < 30) failures.push(`Expected permanent source links in built HTML, found ${sourceCount}.`);
if (officialCount < 3) failures.push(`Expected official documentation links in built HTML, found ${officialCount}.`);

if (failures.length) {
  console.error(`Built-link validation failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Validated ${localCount} local links/assets across ${htmlFiles.length} HTML pages.`);
console.log(`Found ${sourceCount} fixed source links and ${officialCount} official documentation links.`);
