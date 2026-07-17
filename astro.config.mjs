import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import { ARTICLE_CATALOG, ARTICLE_GROUPS } from './src/data/article-catalog.mjs';

const [owner = '', repository = ''] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
const isActions = process.env.GITHUB_ACTIONS === 'true';
const isUserSite = repository === `${owner}.github.io`;
const inferredSite = owner ? `https://${owner}.github.io` : 'http://localhost:4321';
const inferredBase = isActions && repository && !isUserSite ? `/${repository}` : '/';
const sidebar = ARTICLE_GROUPS.map((group) => ({
  label: group.label,
  items: ARTICLE_CATALOG.filter((article) => article.group === group.key).map((article) => ({
    label: article.title,
    slug: article.slug,
  })),
}));

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
        { label: '开始', items: [{ label: '阅读首页', link: '/' }] },
        ...sidebar,
        {
          label: '源码图谱与附录',
          items: [
            { label: '73 个 Crate 源码图谱', slug: 'source-atlas' },
            { label: 'Crate 总索引', slug: 'appendices/crate-index' },
            { label: '文件与模块索引', slug: 'appendices/file-module-index' },
            { label: '测试与 Harness', slug: 'appendices/testing-architecture' },
            { label: 'Build、Prod 与 Third-party', slug: 'appendices/build-prod-third-party' },
            { label: '覆盖报告与升级指南', slug: 'appendices/coverage-and-upgrade' },
          ],
        },
      ],
    }),
    sitemap(),
  ],
});
