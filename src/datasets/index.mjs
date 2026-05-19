/**
 * DataViews-heavy exports for the dashboard-kit `/datasets` sub-entry.
 *
 * Importing anything from this entry pulls in `@wordpress/dataviews`
 * (~50 KB gzip + `date-fns` ~10 KB gzip). The CSS handle (`wp-dataviews`)
 * is enqueued by WordPress core via the consumer's asset.php chain —
 * the kit does NOT vendor or import DataViews CSS itself (closes SPEC
 * §11 hack #2). See `EntityListPage.jsx` for the rationale.
 *
 * Import path: `import { EntityListPage } from '@pressmaximum/dashboard-kit/datasets'`
 */

export { default as EntityListPage } from './EntityListPage.jsx';
export { default as EntityPreviewFrame } from './EntityPreviewFrame.jsx';
export { ViewPersistence } from './ViewPersistence.js';
export { filterTrashByDefault } from './filterTrashByDefault.js';
