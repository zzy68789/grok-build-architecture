import { access, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { ARTICLE_CATALOG, primaryArticleForCrate } from '../src/data/article-catalog.mjs';
import { sortDirectoryEntries, sortSourceSymbols } from './lib/source-atlas-order.mjs';

const root = process.cwd();
const sourceRoot = path.resolve(process.env.GROK_BUILD_SOURCE_DIR
  ?? (process.env.CI ? path.join(root, '.cache', 'grok-build') : 'D:\\Code\\Grok-build\\grok-build'));
const generatedRoot = path.join(root, 'src', 'data', 'source-atlas');
const docsRoot = path.join(root, 'src', 'content', 'docs');
const publicCommit = '8adf9013a0929e5c7f1d4e849492d2387837a28d';
const checkOnly = process.argv.includes('--check');

const slash = (value) => value.replaceAll('\\', '/');
const quote = (value) => JSON.stringify(value);

async function walk(directory) {
  const entries = sortDirectoryEntries(await readdir(directory, { withFileTypes: true }));
  const nested = await Promise.all(entries.map((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  }));
  return nested.flat();
}

function packageField(manifest, field) {
  const packageBlock = manifest.match(/\[package\]([\s\S]*?)(?=\n\[|$)/)?.[1] ?? '';
  return packageBlock.match(new RegExp(`^${field}\\s*=\\s*"([^"]*)"`, 'm'))?.[1] ?? '';
}

function dependencyNames(manifest) {
  const names = new Set();
  for (const match of manifest.matchAll(/\[(?:dev-|build-)?dependencies(?:\.[^\]]+)?\]([\s\S]*?)(?=\n\[|$)/g)) {
    for (const line of match[1].split(/\r?\n/)) {
      const name = line.match(/^([a-zA-Z0-9_-]+)\s*=/)?.[1];
      if (name) names.add(name);
    }
  }
  return [...names];
}

function fileKind(relative) {
  const normalized = `/${relative.toLowerCase()}`;
  if (normalized.includes('/fuzz/')) return 'fuzz';
  if (normalized.includes('/benches/') || normalized.includes('/bench/')) return 'benchmark';
  if (normalized.includes('/examples/') || normalized.includes('/example/')) return 'example';
  if (normalized.includes('/tests/') || normalized.includes('/test/')) return 'test';
  if (/\/(?:[^/]*_)?tests?\.rs$/.test(normalized)) return 'test';
  if (normalized.includes('/src/')) return 'production';
  return 'support';
}

function symbolsFrom(source, filePath) {
  const symbols = [];
  const lines = source.split(/\r?\n/);
  const expression = /^\s*pub(?:\([^)]*\))?\s+(?:(?:async|unsafe)\s+)?(struct|enum|trait|fn|type|const|static)\s+([A-Za-z_][A-Za-z0-9_]*)/;
  lines.forEach((line, index) => {
    const match = line.match(expression);
    if (match) symbols.push({ kind: match[1], name: match[2], path: filePath, line: index + 1 });
  });
  return symbols;
}

function layerFor(crateName, primaryArticle) {
  if (/test-support|test-utils|pty-harness/.test(crateName)) return '测试支持';
  const group = ARTICLE_CATALOG.find((item) => item.slug === primaryArticle)?.group;
  return {
    overview: '共享基础', runtime: '会话运行时', tui: '交互呈现', agent: 'Agent 与推理',
    workspace: '工具与工作区', operations: '安全、扩展与运维',
  }[group] ?? '共享基础';
}

function roleFor(crateName, description, layer) {
  const rules = [
    [/pager-render/, '负责终端帧、图片覆盖层和渲染后端，将视图状态转为可提交的终端输出。'],
    [/pager-pty-harness/, '提供 PTY 端到端场景、屏幕断言和性能基准所需的测试基础设施。'],
    [/pager-minimal/, '提供最小终端客户端，用较小依赖面验证核心交互与降级路径。'],
    [/pager-bin/, '提供 Grok Build 终端程序的二进制入口与启动参数边界。'],
    [/pager/, '承载主 TUI 的状态、事件、Effect、视图和用户输入循环。'],
    [/markdown-core/, '提供与终端渲染器一致的无头 Markdown 解析和结构分析。'],
    [/markdown/, '负责流式 Markdown 的增量解析、样式计算和终端呈现。'],
    [/mermaid/, '把 Mermaid 文本通过可替换引擎转换为终端可展示图像。'],
    [/sampler/, '以 actor 形式管理模型采样、HTTP 流、重试、取消和领域事件。'],
    [/sampling-types/, '定义采样请求、响应和流式事件使用的纯数据类型。'],
    [/memory/, '负责跨会话记忆的存储、切分、向量检索和后台整理。'],
    [/compaction/, '实现与传输无关的上下文压缩、摘要提交和失败回退。'],
    [/token-estimation/, '提供纯 token 估算原语，为预算与压缩决策提供近似值。'],
    [/workspace-client/, '提供经 Hub 代理调用远程 workspace RPC 的类型化客户端。'],
    [/workspace-types/, '定义远程 workspace 请求、分块响应和事件的 wire types。'],
    [/workspace/, '提供本地主机工作区的文件、VCS、命令执行和项目发现能力。'],
    [/tool-protocol/, '定义 Computer Hub 工具调用的稳定传输协议类型。'],
    [/tool-runtime/, '定义统一 Tool trait、分派、错误分类、通知和搜索索引。'],
    [/tool-types/, '定义工具描述和 schema 等平台共享叶子类型。'],
    [/tools-api/, '维护 Grok 工具的 Protobuf API 定义和生成边界。'],
    [/tools/, '实现 Grok Build 可调用的文件、Shell、任务和工作区工具集合。'],
    [/computer-hub-core/, '定义 Computer Hub 的传输、注册表和解析器抽象。'],
    [/computer-hub-sdk/, '提供连接池、透明重连和工具服务器运行时 SDK。'],
    [/computer-hub-mcp-adapter/, '把 MCP 发现的工具适配并注册为原生 Computer Hub 工具。'],
    [/mcp/, '隔离 MCP 传输依赖并负责 Server 生命周期、凭据和 OAuth 编排。'],
    [/hooks/, '负责 hook 发现、命令执行、超时和策略拦截。'],
    [/plugin-marketplace/, '解析和管理插件 Marketplace 元数据及扩展来源。'],
    [/agent/, '负责 Agent 定义解析、构建和 system prompt 装配。'],
    [/subagent-resolution/, '把 persona、role 与启动覆盖项合并为不可变子 Agent 规格。'],
    [/chat-state/, '以 actor 所有权维护聊天状态和可订阅的状态投影。'],
    [/prompt-queue/, '定义跨 Shell 与 Pager 共享的 prompt queue 类型和队列语义。'],
    [/interjection/, '提供 mid-turn interjection 缓冲、顺序控制和格式化。'],
    [/sandbox/, '通过操作系统内核机制为工具执行建立最小能力沙箱。'],
    [/secrets/, '在遥测和错误上报前识别并清洗可能的秘密材料。'],
    [/telemetry/, '聚合产品事件、Mixpanel 发射和错误上报。'],
    [/tracing-macros/, '提供基于 tracing 的时间戳和耗时记录宏。'],
    [/tracing/, '提供跨模块共享的结构化 tracing 基础设施。'],
    [/mixpanel/, '提供轻量 Mixpanel HTTP 事件发送客户端。'],
    [/config-types/, '定义不依赖运行时的叶子配置值类型。'],
    [/config/, '加载 requirements、用户与受管配置并执行有序 TOML 合并。'],
    [/paths/, '提供绝对/相对 UTF-8 路径包装并维持路径不变量。'],
    [/shell-session-support/, '提供 Session 的 MCP catalog、凭据缓存和文件访问跟踪支持。'],
    [/shell-base/, '封装 Shell 家族共享的环境、进程、文件系统和 profiling 基础能力。'],
    [/shell/, '承载 Leader、Session、Agentic Loop、权限与持久化的主要运行时。'],
    [/codebase-graph/, '使用 tree-sitter query 生成符号和代码关系图。'],
    [/fast-worktree/, '使用 CoW 克隆快速创建隔离 Git worktree。'],
    [/hunk-tracker/, '追踪文件 diff hunk 并区分 Agent 与外部修改来源。'],
    [/fsnotify/, '把本地文件系统变化归一化为单一因果语义事件流。'],
    [/gix-status/, '在进程线程预算内安全执行共享 gix status 扫描。'],
    [/crash-handler/, '处理跨平台崩溃信号并检测启动期连续崩溃。'],
    [/system-power/, '提供跨平台休眠和唤醒通知。'],
    [/voice/, '提供流式语音转文字和输入草稿更新能力。'],
    [/auth/, '通过 trait 提供 HTTP 认证与凭据提供者的依赖倒置接缝。'],
    [/http/, '集中构造共享 reqwest 客户端、User-Agent 和网络默认值。'],
    [/circuit-breaker/, '根据连续故障和恢复探测限制外部请求故障扩散。'],
    [/sqlite-journal/, '按文件系统能力选择安全的 SQLite journal 模式。'],
    [/ratatui-textarea/, '实现 Unicode 感知的终端多行输入、选择和光标移动。'],
    [/ratatui-inline/, '支持在现有终端区域内嵌运行 ratatui 组件。'],
    [/ptyctl/, '控制无头伪终端、屏幕状态和子进程生命周期。'],
    [/tty-utils/, '封装 TTY 安全的子进程派生、pager 抑制和进程组回收。'],
    [/test-support|test-utils/, '集中提供密封测试环境、模拟服务和共享测试工具。'],
  ];
  return rules.find(([pattern]) => pattern.test(crateName))?.[1]
    ?? `${layer}层的一方 crate；上游清单描述为：${description || '未提供 description，职责由公开模块和依赖关系归纳'}。`;
}

function articleRelations(crateName, primary) {
  const explicit = ARTICLE_CATALOG.filter((article) => article.sourceCrates.includes(crateName)).map((article) => article.slug);
  return [...new Set([primary, ...explicit])];
}

function articleFiles(article, cratesByName) {
  const assigned = [...cratesByName.values()].filter((item) => item.relatedArticles.includes(article.slug));
  const pool = assigned.flatMap((item) => item.files
    .filter((file) => file.kind === 'production')
    .map((file) => ({ ...file, crateName: item.name })));
  pool.sort((a, b) => {
    const rank = (file) => file.path.endsWith('/lib.rs') || file.path.endsWith('/main.rs') ? 0 : file.symbols.length ? 1 : 2;
    return rank(a) - rank(b) || b.lineCount - a.lineCount || a.path.localeCompare(b.path);
  });
  return pool;
}

function articleDocument(article, cratesByName) {
  const assigned = [...cratesByName.values()].filter((item) => item.relatedArticles.includes(article.slug));
  const selected = articleFiles(article, cratesByName).slice(0, 10);
  const sourceCrates = assigned.map((item) => item.name).sort();
  const lines = [
    '---',
    `title: ${quote(article.title)}`,
    `description: ${quote(article.description)}`,
    "lastVerified: '2026-07-17'",
    'coverageKind: deep-dive',
    'sourceCrates:',
    ...sourceCrates.map((name) => `  - ${name}`),
    'sourcePaths:',
    ...selected.map((file) => `  - ${file.path}`),
    'officialDocs:',
    ...article.officialDocs.map((url) => `  - ${url}`),
    '---',
    '',
    "import DeepDiveArticle from '@components/DeepDiveArticle.astro';",
    '',
    `<DeepDiveArticle slug=${quote(article.slug)} />`,
    '',
  ];
  return lines.join('\n');
}

function crateDocument(crate) {
  const selected = [crate.manifestPath, ...crate.keyEntrypoints.map((entry) => entry.path)].slice(0, 10);
  return [
    '---',
    `title: ${quote(crate.name)}`,
    `description: ${quote(crate.role)}`,
    "lastVerified: '2026-07-17'",
    'coverageKind: appendix',
    'sourceCrates:',
    `  - ${crate.name}`,
    'sourcePaths:',
    ...selected.map((sourcePath) => `  - ${sourcePath}`),
    'officialDocs:',
    '  - https://docs.x.ai/build/overview',
    '---',
    '',
    "import CrateAtlas from '@components/CrateAtlas.astro';",
    '',
    `<CrateAtlas crateName=${quote(crate.name)} />`,
    '',
  ].join('\n');
}

async function expectedFiles() {
  await access(sourceRoot);
  const rootManifest = await readFile(path.join(sourceRoot, 'Cargo.toml'), 'utf8');
  const membersBlock = rootManifest.match(/members\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? '';
  const memberPaths = [...membersBlock.matchAll(/"([^"]+)"/g)]
    .map((match) => match[1])
    .filter((member) => member.startsWith('crates/codegen/') || member.startsWith('crates/common/'));
  const crates = [];

  for (const memberPath of memberPaths) {
    const absolute = path.join(sourceRoot, ...memberPath.split('/'));
    const manifestPath = `${memberPath}/Cargo.toml`;
    const manifest = await readFile(path.join(absolute, 'Cargo.toml'), 'utf8');
    const name = packageField(manifest, 'name') || path.basename(memberPath);
    const description = packageField(manifest, 'description');
    const primaryArticle = primaryArticleForCrate(name);
    const rustFiles = (await walk(absolute)).filter((file) => file.endsWith('.rs'));
    const files = [];
    const allSymbols = [];
    for (const absoluteFile of rustFiles) {
      const source = await readFile(absoluteFile, 'utf8');
      const relative = slash(path.relative(sourceRoot, absoluteFile));
      const symbols = symbolsFrom(source, relative);
      allSymbols.push(...symbols);
      files.push({
        path: relative,
        module: slash(path.relative(path.join(absolute, 'src'), absoluteFile)).replace(/\.rs$/, '').replaceAll('/', '::'),
        kind: fileKind(relative),
        lineCount: source.split(/\r?\n/).length,
        symbols: symbols.slice(0, 12),
        url: `https://github.com/xai-org/grok-build/blob/${publicCommit}/${relative}`,
      });
    }
    files.sort((a, b) => a.path.localeCompare(b.path));
    const productionFiles = files.filter((file) => file.kind === 'production');
    const entrypoints = [...productionFiles].sort((a, b) => {
      const rank = (file) => file.path.endsWith('/lib.rs') || file.path.endsWith('/main.rs') ? 0 : file.symbols.length ? 1 : 2;
      return rank(a) - rank(b) || b.lineCount - a.lineCount;
    }).slice(0, 8);
    const layer = layerFor(name, primaryArticle);
    crates.push({
      name,
      memberPath,
      manifestPath,
      description,
      role: roleFor(name, description, layer),
      layer,
      primaryArticle,
      relatedArticles: articleRelations(name, primaryArticle),
      dependencies: dependencyNames(manifest),
      dependents: [],
      fileCount: files.length,
      productionFileCount: productionFiles.length,
      lineCount: productionFiles.reduce((sum, file) => sum + file.lineCount, 0),
      keyEntrypoints: entrypoints.map((file) => ({ path: file.path, lineCount: file.lineCount, symbols: file.symbols.slice(0, 6) })),
      keySymbols: sortSourceSymbols(allSymbols).slice(0, 30),
      files,
    });
  }

  const crateNames = new Set(crates.map((item) => item.name));
  const cratesByName = new Map(crates.map((item) => [item.name, item]));
  for (const crate of crates) {
    crate.dependencies = crate.dependencies.filter((name) => crateNames.has(name)).sort();
    for (const dependency of crate.dependencies) cratesByName.get(dependency).dependents.push(crate.name);
  }
  crates.forEach((item) => item.dependents.sort());
  crates.sort((a, b) => a.name.localeCompare(b.name));

  const summary = {
    publicCommit,
    generatedAt: '2026-07-17',
    crateCount: crates.length,
    productionFileCount: crates.reduce((sum, item) => sum + item.productionFileCount, 0),
    rustFileCount: crates.reduce((sum, item) => sum + item.fileCount, 0),
    lineCount: crates.reduce((sum, item) => sum + item.lineCount, 0),
    layers: [...new Set(crates.map((item) => item.layer))],
    articles: ARTICLE_CATALOG.map((article) => ({ slug: article.slug, title: article.title, group: article.group })),
    crates: crates.map(({ files, keySymbols, ...item }) => item),
  };

  const outputs = new Map();
  outputs.set(path.join(generatedRoot, 'index.json'), `${JSON.stringify(summary, null, 2)}\n`);
  for (const crate of crates) outputs.set(path.join(generatedRoot, 'crates', `${crate.name}.json`), `${JSON.stringify(crate, null, 2)}\n`);
  for (const article of ARTICLE_CATALOG) outputs.set(path.join(docsRoot, `${article.slug}.mdx`), articleDocument(article, cratesByName));
  for (const crate of crates) outputs.set(path.join(docsRoot, 'source-atlas', 'crates', `${crate.name}.mdx`), crateDocument(crate));
  return { outputs, summary, crates };
}

const { outputs, summary } = await expectedFiles();
const failures = [];

if (checkOnly) {
  for (const [file, expected] of outputs) {
    let actual = '';
    try { actual = await readFile(file, 'utf8'); } catch { failures.push(`missing generated file: ${slash(path.relative(root, file))}`); continue; }
    if (actual !== expected) failures.push(`stale generated file: ${slash(path.relative(root, file))}`);
  }
  if (failures.length) {
    console.error(`Source atlas check failed with ${failures.length} issue(s):`);
    failures.slice(0, 30).forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }
  console.log(`Source atlas is current: ${summary.crateCount} crates, ${summary.productionFileCount} production Rust files.`);
} else {
  await rm(generatedRoot, { recursive: true, force: true });
  await rm(path.join(docsRoot, 'source-atlas', 'crates'), { recursive: true, force: true });
  for (const [file, content] of outputs) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content, 'utf8');
  }
  console.log(`Generated ${summary.crateCount} crate pages and ${ARTICLE_CATALOG.length} deep-dive pages.`);
  console.log(`Indexed ${summary.productionFileCount} production Rust files (${summary.rustFileCount} Rust files total).`);
}
