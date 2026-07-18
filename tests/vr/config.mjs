/**
 * VR harness config — the shot matrix for the KIT-P2 token/bridge gate.
 *
 * Matrix (48 gallery shots): 2 viewports x 2 themes x 12 section anchors of
 * the design-system.html gallery, at primary preset "deep" (#3366FF, the
 * reviewed default). Plus 4 app shots: index.html#bookings with the in-flow
 * inspector open (2 viewports x 2 themes) — a state the gallery does not cover.
 *
 * The mockup is served over HTTP (never file://) so relative asset URLs and
 * localStorage both behave. Override the origin with VR_BASE when the static
 * server runs on a different port.
 */

export const BASE = process.env.VR_BASE || 'http://127.0.0.1:8788';

// Gallery + app entry points inside the served docs/mockups tree.
export const GALLERY = `${ BASE }/v4/plugin-dashboard/design-system.html`;
export const APP = `${ BASE }/v4/plugin-dashboard/index.html`;

export const VIEWPORTS = [
	{ name: '1440x900', width: 1440, height: 900 },
	{ name: '360x800', width: 360, height: 800 },
];

export const THEMES = [ 'light', 'dark' ];

// The 12 route-neutral gallery sections, in document order.
export const SECTIONS = [
	'principles',
	'shell-navigation',
	'buttons',
	'fields',
	'feedback',
	'cards-modules',
	'tabs',
	'tables',
	'popovers',
	'inspectors',
	'states',
	'handoff',
];

// Primary-preset engine key + value (dashboard-kit-preferences.js). "deep" is
// already the default, but we pin it so a stale localStorage can't drift a run.
export const PRESET_KEY = 'dashboard-kit.primary-color.v1';
export const PRESET = 'deep';

export const SHOT_MATRIX_SIZE =
	VIEWPORTS.length * THEMES.length * SECTIONS.length; // 48
