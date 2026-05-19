/**
 * Editor helpers — JS-side utilities that ride on top of the block
 * editor (post.php) or the WP admin menu. SPEC §5.7.
 *
 * Lives behind the `/editor-helpers` sub-entry so dashboard-only
 * consumers don't bundle them. Pair with the upcoming P7 PHP
 * counterparts in `Admin\EditorIntegration` for the full Pattern-A
 * CPT editor flow (force fullscreen + back-button + submenu highlight).
 *
 * Import path: `import { rewireBackButton } from '@pressmaximum/dashboard-kit/editor-helpers'`
 */

export { rewireBackButton } from './rewireBackButton.js';
export { forceFullscreenMode } from './forceFullscreenMode.js';
export { registerSubmenuActive } from './registerSubmenuActive.js';
