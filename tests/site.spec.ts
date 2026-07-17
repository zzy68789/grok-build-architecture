import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('首页提供架构入口和固定源码基线', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.home-hero h1')).toContainText('Grok Build');
  await expect(page.getByText('固定源码基线')).toBeVisible();
  await expect(page.getByRole('link', { name: /开始阅读/ })).toHaveAttribute('href', /introduction\/what-is-grok-build/);
  await expect(page.locator('.mermaid-frame svg')).toBeVisible();
});

test('正文包含源码永久链接、目录和前后导航', async ({ page }) => {
  await page.goto('/runtime/agentic-loop/');
  await expect(page.getByRole('heading', { level: 1, name: 'Agentic Loop' })).toBeVisible();
  const sourceLink = page.locator('a.source-ref').first();
  await expect(sourceLink).toHaveAttribute('href', /8adf9013a0929e5c7f1d4e849492d2387837a28d/);
  await expect(page.getByRole('heading', { level: 2, name: '失败模式与恢复' })).toBeVisible();
  await expect(page.locator('.article-metrics')).toContainText('生产 Rust 文件');
  await expect(page.locator('a[rel="next"], a[rel="prev"]').first()).toBeVisible();
});

test('中文全文搜索可以找到安全文章', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /搜索|Search/i }).first().click();
  const input = page.getByRole('searchbox').or(page.getByPlaceholder(/搜索|Search/i)).first();
  await input.fill('沙箱');
  await expect(page.getByText('Permission、Auto、Plan 与 OS Sandbox', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
});

test('404 页面可用', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: '信号中断' })).toBeVisible();
});

test('深浅主题可由键盘可达控件切换', async ({ page }) => {
  await page.goto('/introduction/architecture-overview/');
  const select = page.locator('starlight-theme-select select:visible').first();
  if (await select.count() === 0) {
    await page.getByRole('button', { name: '菜单' }).click();
  }
  await expect(select).toBeVisible();
  await select.focus();
  await expect(select).toBeFocused();
  await select.selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await select.selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('代码块复制按钮写入剪贴板', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/appendices/coverage-and-upgrade/');
  const copy = page.getByTitle('Copy to clipboard').first();
  await expect(copy).toBeVisible();
  await copy.click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('npm run atlas:check');
});

test('页面无严重可访问性问题且无横向溢出', async ({ page }) => {
  await page.goto('/safety/permission-plan-sandbox/');
  await page.locator('.mermaid-frame svg').first().waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
  const results = await new AxeBuilder({ page }).analyze();
  const severe = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
  expect(severe).toEqual([]);
});

test('源码图谱支持按名称和架构层筛选', async ({ page }) => {
  await page.goto('/source-atlas/');
  await expect(page.locator('.atlas-card')).toHaveCount(73);
  await page.locator('[data-atlas-query]').fill('xai-grok-sampler');
  await expect(page.locator('.atlas-card:visible')).toHaveCount(1);
  await expect(page.locator('.atlas-card:visible')).toContainText('xai-grok-sampler');
  await page.locator('[data-atlas-query]').fill('');
  await page.locator('[data-atlas-layer]').selectOption('测试支持');
  await expect(page.locator('.atlas-card:visible')).not.toHaveCount(0);
});

test('crate 图谱展示依赖、符号和完整文件索引', async ({ page }) => {
  await page.goto('/source-atlas/crates/xai-grok-sampler/');
  await expect(page.getByRole('heading', { level: 1, name: 'xai-grok-sampler' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: '依赖与调用者' })).toBeVisible();
  await expect(page.locator('.file-list > a').first()).toHaveAttribute('href', /8adf9013a0929e5c7f1d4e849492d2387837a28d/);
});

test('文件索引可搜索源码路径且移动端不横向溢出', async ({ page }) => {
  await page.goto('/appendices/file-module-index/');
  await page.locator('[data-file-query]').fill('run_loop.rs');
  await expect(page.locator('[data-file-atlas] > a:visible').first()).toContainText('run_loop.rs');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
});
