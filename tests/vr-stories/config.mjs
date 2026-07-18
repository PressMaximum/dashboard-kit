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
	// slice 3 — in-flow inspector tier (menu shot renders the closed trigger;
	// open/roving behavior is unit-tested)
	'primitives-inflowinspector--workspace-with-resizer',
	'primitives-inflowinspector--theme-app-dark',
	'primitives-drawermenu--detail-panel',
	'primitives-drawermenu--detail-panel-theme-app-dark',
	'primitives-drawermenu--menu-anchored',
	'primitives-drawermenu--menu-fixed-floating',
	// slice 4 — feedback & shell-adjacent (module-card shots exercise the
	// K-018 <PMDKModuleCard> component, incl. the ModulesPage consumer story)
	'primitives-modulecard--catalogue-3-up',
	'primitives-modulecard--integration-states',
	'primitives-modulecard--theme-app-dark',
	'modulecard-modulespage--press-listing-like-modules',
	'primitives-feedbackshell--avatars',
	'primitives-feedbackshell--tabs',
	'primitives-feedbackshell--toast',
	'primitives-feedbackshell--save-bar',
	'primitives-feedbackshell--save-bar-theme-app-dark',
	// KIT-P4 — default-look lock on the CORE components being rethemed.
	// Baselines for these were captured from the PRE-P4 tree (f5839a8): the
	// theme-app work is scoped `.pmdk-theme-app` rules, so every one of these
	// default-scope shots must stay zero-diff through KIT-P4 (REVISED C).
	'core-tabstrip--default',
	'core-helppanel--default',
	'settings-savebar--clean',
	'settings-savebar--dirty',
	'settings-schemaform--schema-driven',
	'layouts-subnav--settings-panels',
	'layouts-listpageheader--with-actions',
	'layouts-listpageheader--with-description',
	'layouts-editorpageheader--with-status-and-actions',
	'welcome-hero--with-everything',
	'welcome-checklist--default',
	'compare-comparetable--with-footer-cta',
	// KIT-P4 — the NEW look: core components under `.pmdk-theme-app`
	// (light + dark) plus one unthemed shell reference, and the unified
	// SaveBar component under the primitives chrome.
	'core-themeappcore--shell-default',
	'core-themeappcore--shell-theme-app',
	'core-themeappcore--shell-theme-app-dark',
	'core-themeappcore--settings-theme-app',
	'core-themeappcore--settings-theme-app-dark',
	'core-themeappcore--editor-header-theme-app',
	'core-themeappcore--editor-header-theme-app-dark',
	'primitives-feedbackshell--save-bar-unified-component',
	'primitives-feedbackshell--save-bar-unified-component-dark',
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
