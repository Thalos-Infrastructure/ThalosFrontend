// Build stamp for the footer.
//
// `next.config.mjs` resolves these at build time and Next inlines them, so they
// must stay full literal `process.env.NEXT_PUBLIC_*` references — a computed
// lookup would come back undefined in the browser bundle.
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';
export const APP_COMMIT = process.env.NEXT_PUBLIC_APP_COMMIT || '';
export const APP_BRANCH = process.env.NEXT_PUBLIC_APP_BRANCH || '';
export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || '';

/**
 * `release · v0.1.2 · 9a785c9`. Each piece is dropped when the build could not
 * resolve it, so the label degrades to `v0.1.2` rather than to a string of
 * empty separators.
 *
 * The branch leads because `main` and `release` deploy from the same
 * package.json version - it is the part that says which frontend you are on.
 */
export function formatVersionLabel(version: string, commit: string, branch = ''): string {
  const cleaned = (version || '').trim().replace(/^v/i, '');
  const parts = [(branch || '').trim(), `v${cleaned || '0.0.0'}`, (commit || '').trim()];
  return parts.filter(Boolean).join(' · ');
}

/**
 * `2026-09-01 14:03 UTC`. Kept as a fixed UTC slice of the ISO string rather
 * than a locale format so server and client render the same text — a
 * timezone-dependent string here would be a hydration mismatch.
 */
export function formatBuildTime(iso: string): string {
  const value = (iso || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return '';
  return `${value.slice(0, 10)} ${value.slice(11, 16)} UTC`;
}

export const VERSION_LABEL = formatVersionLabel(APP_VERSION, APP_COMMIT, APP_BRANCH);
