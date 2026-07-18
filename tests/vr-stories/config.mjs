/**
 * VR-on-Storybook config (KIT-P3 gate).
 *
 * Separate from `tests/vr/` (the KIT-P2 mockup-gallery gate): this matrix
 * screenshots the kit's OWN Storybook build, so primitive regressions are
 * caught without touching the Aponto mockup. Story ids follow Storybook's
 * title/export slugging.
 */

// Deterministic-render subset: every slice-1 family, the table tier in all
// five states + themes, and the consumer example. Interaction-only stories
// (ServerMode, PersistedPreferences) are exercised by unit tests instead —
// their initial render equals Ready.
export const STORY_IDS = [
	// slice 1 — fields & controls
	'primitives-buttons--default',
	'primitives-buttons--theme-app',
	'primitives-buttons--theme-app-dark',
	'primitives-compactfields--default',
	'primitives-compactfields--theme-app',
	'primitives-compactfields--theme-app-dark',
	'primitives-combobox--interactive',
	'primitives-moneycolorfields--default',
	'primitives-moneycolorfields--theme-app-dark',
	// slice 2 — data table tier
	'table-pmdkdatatable--ready',
	'table-pmdkdatatable--loading',
	'table-pmdkdatatable--empty',
	'table-pmdkdatatable--error-state',
	'table-pmdkdatatable--permission',
	'table-pmdkdatatable--theme-app',
	'table-pmdkdatatable--theme-app-dark',
	'table-consumerexample--aponto-like-consumer',
];

export const VIEWPORT = { width: 1280, height: 900 };

// Loopback only — never expose the static server beyond 127.0.0.1.
export const HOST = '127.0.0.1';
export const PORT = Number( process.env.VR_STORY_PORT || 6116 );
export const BASE = `http://${ HOST }:${ PORT }`;

// Screenshot-diff tolerance: identical toolchain ⇒ zero pixels expected; the
// threshold only guards font-rasteriser jitter across local runs.
export const PIXELMATCH_THRESHOLD = 0.1;
export const MAX_DIFF_PIXELS = 0;
