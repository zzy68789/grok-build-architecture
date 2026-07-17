import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';

const [owner = '', repository = ''] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
const isActions = process.env.GITHUB_ACTIONS === 'true';
const isUserSite = repository === `${owner}.github.io`;
const inferredSite = owner ? `https://${owner}.github.io` : 'http://localhost:4321';
const inferredBase = isActions && repository && !isUserSite ? `/${repository}` : '/';

export default defineConfig({
  site: process.env.SITE_URL ?? inferredSite,
  base: process.env.BASE_PATH ?? inferredBase,
  integrations: [
    starlight({
      title: 'Grok Build Architecture',
      description: '基于公开 Rust 源码的 Grok Build 非官方架构白皮书。',
      disable404Route: true,
      favicon: '/favicon.svg',
      logo: {
        src: './src/assets/logo.svg',
        alt: 'GB',
        replacesTitle: false,
      },
      defaultLocale: 'root',
      locales: {
        root: {
          label: '简体中文',
          lang: 'zh-CN',
        },
      },
      social: [
        {
          icon: 'github',
          label: 'Grok Build 公开源码',
          href: 'https://github.com/xai-org/grok-build',
        },
      ],
      customCss: ['./src/styles/custom.css'],
      components: {
        Footer: './src/components/SiteFooter.astro',
      },
      expressiveCode: {
        themes: ['github-light', 'github-dark'],
        styleOverrides: {
          borderRadius: '0.75rem',
          codeFontFamily: 'var(--font-mono)',
        },
      },
      sidebar: [
        {
          label: '开始',
          items: [
            { label: '阅读首页', link: '/' },
            { label: '什么是 Grok Build', slug: 'introduction/what-is-grok-build' },
            { label: '架构全景', slug: 'introduction/architecture-overview' },
          ],
        },
        {
          label: '运行时',
          items: [
            { label: '启动入口与运行模式', slug: 'runtime/startup-and-modes' },
            { label: 'TUI 内部架构', slug: 'runtime/tui-architecture' },
            { label: 'Agentic Loop', slug: 'runtime/agentic-loop' },
            { label: 'Leader、Session 与 ACP', slug: 'runtime/leader-session-acp' },
          ],
        },
        {
          label: '工具与安全',
          items: [
            { label: '工具系统', slug: 'tools/tool-system' },
            { label: '安全链路', slug: 'safety/permission-plan-sandbox' },
          ],
        },
        {
          label: '上下文工程',
          items: [
            { label: 'System Prompt 与项目规则', slug: 'context/system-prompt-and-rules' },
            { label: '上下文压缩与 Token 预算', slug: 'context/compaction-and-token-budget' },
            { label: '跨会话 Memory', slug: 'context/cross-session-memory' },
          ],
        },
        {
          label: '多 Agent 协作',
          items: [
            { label: '子 Agent 与后台任务', slug: 'agents/subagents-and-background-tasks' },
            { label: 'Worktree、Checkpoint 与 Hunk', slug: 'agents/worktree-checkpoint-hunk' },
          ],
        },
        {
          label: '可扩展性',
          items: [
            { label: 'MCP 集成', slug: 'extensibility/mcp-integration' },
            { label: 'Skills、Plugins 与 Hooks', slug: 'extensibility/skills-plugins-hooks' },
          ],
        },
      ],
    }),
    sitemap(),
  ],
});
