# Grok Build Architecture

Grok Build 源码架构白皮书：一套基于公开 Rust 源码、面向中文学习者的非官方静态文档站。

本站不重复维护安装、命令和配置手册，而是追踪调用链、状态流转、安全边界和扩展协议。全部源码引用锁定公开提交 `8adf9013a0929e5c7f1d4e849492d2387837a28d`；上游单体仓库标记的 `SOURCE_REV` 为 `2ec0f0c8488842da03a71eeee3c61154957ca919`，二者用途不同。

## 本地运行

需要 Node.js 24 和一份只读的 Grok Build 源码检出。

```powershell
npm install
npm run dev
```

默认源码目录为 `D:\Code\Grok-build\grok-build`。如果源码在其他位置：

```powershell
$env:GROK_BUILD_SOURCE_DIR = 'D:\path\to\grok-build'
npm run validate:source
```

完整验收：

```powershell
npm run check
npm run validate:source
npm run build
npm run validate:links
npx playwright install chromium
npm run test:e2e
```

生产输出位于 `dist/`。`npm run build` 会同时生成 Pagefind 中文全文索引、sitemap 和 `dist/llms.txt`。

## 内容与组件

- `src/content/docs/`：首页与 15 篇中文架构文章。
- `src/components/SourceRef.astro`：生成固定 commit 的 GitHub 永久链接。
- `src/components/SourceBaseline.astro`：统一展示公开提交、`SOURCE_REV` 与核验日期。
- `src/components/Mermaid.astro`：客户端渲染流程图，并保留无脚本文本降级。
- `scripts/validate-source-refs.mjs`：校验文章 frontmatter、源码文件和行号。
- `scripts/validate-built-links.mjs`：校验生产目录中的路由、静态资源、官方文档和永久源码链接。
- `scripts/generate-llms.mjs`：从文章元数据生成面向 AI 阅读的索引。

## 发布到 GitHub Pages

1. 在 GitHub 新建空仓库，把本目录内容上传到默认分支 `main`。
2. 提交 `package-lock.json`，让 Astro Action 可确定使用 npm。
3. 进入仓库 **Settings → Pages**，将 Source 选择为 **GitHub Actions**。
4. 推送后等待 `Verify and deploy documentation` 工作流完成。

`astro.config.mjs` 会读取 `GITHUB_REPOSITORY`：`username.github.io` 仓库使用根路径，普通项目仓库自动使用 `/<repository>` base path。也可通过 `SITE_URL` 和 `BASE_PATH` 显式覆盖。

工作流遵循 [Astro 官方 GitHub Pages 部署方案](https://docs.astro.build/en/guides/deploy/github/)，并在部署前检出固定上游提交，重复执行源码引用校验和浏览器验收。

## 声明

本站为非官方社区学习项目，不代表 xAI。Grok、xAI 及相关商标归其权利人所有。上游代码摘录保留其 Apache-2.0 来源说明；本站原创文章尚未另行选择开放许可。
