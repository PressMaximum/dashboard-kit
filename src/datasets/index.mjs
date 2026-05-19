/**
 * DataViews-heavy exports for the dashboard-kit `/datasets` sub-entry.
 *
 * P0 scaffold: empty. Real exports land in P6 (EntityListPage,
 * EntityPreviewFrame, ViewPersistence, filterTrashByDefault). See
 * docs/SPEC.md §5.6 + §7.1.
 *
 * Importing anything from this entry pulls in `@wordpress/dataviews`
 * (~50 KB gzip + date-fns ~10 KB gzip) — that's why it's a separate
 * sub-entry. Consumers that don't need DataViews never traverse it.
 *
 * Import path: `import { EntityListPage } from '@pressmaximum/dashboard-kit/datasets'`
 */

export const __DATASETS_VERSION__ = '0.0.0';
