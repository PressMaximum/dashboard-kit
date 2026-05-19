/**
 * Public exports for the dashboard-kit npm package.
 *
 * P0 scaffold: re-export surface intentionally empty. Real exports land in
 * P1 (core) through P5 (editor helpers). See docs/SPEC.md §5 + §7.1 for
 * the locked surface. The datasets sub-entry lives at `./datasets/index.mjs`
 * so consumers that never import it don't pull in `@wordpress/dataviews`.
 *
 * Import path: `import { mountDashboard } from '@pressmaximum/dashboard-kit'`
 */

// Force the chunk to exist for webpack — replaced once P1 lands.
export const __KIT_VERSION__ = '0.0.0';

import './styles/tokens.css';
