export const SOURCE_REPOSITORY = 'https://github.com/xai-org/grok-build';
export const PUBLIC_COMMIT = '8adf9013a0929e5c7f1d4e849492d2387837a28d';
export const MONOREPO_SOURCE_REV = '2ec0f0c8488842da03a71eeee3c61154957ca919';
export const VERIFIED_DATE = '2026-07-17';

export function sourceUrl(path: string, start: number, end?: number): string {
  const normalized = path.replaceAll('\\', '/').replace(/^\//, '');
  const range = end && end > start ? `#L${start}-L${end}` : `#L${start}`;
  return `${SOURCE_REPOSITORY}/blob/${PUBLIC_COMMIT}/${normalized}${range}`;
}
