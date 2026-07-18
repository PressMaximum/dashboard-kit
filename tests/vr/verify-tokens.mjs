/**
 * Token gate (GATE B) — bridge mapping + resolution check.
 *
 *   node tests/vr/verify-tokens.mjs [path-to-bridge.css]
 *
 * Default bridge: the committed fixture `tests/vr/fixtures/aponto-admin-bridge.css`
 * (CI-safe — no aponto checkout needed). Pass the live aponto worktree path to
 * test that instead; `check-bridge-sync.mjs` reminds you when fixture and live
 * file drift.
 *
 * WHAT THIS PROVES (and what it does not):
 *  1. MAPPING — every `--pmdk-*` declaration in the bridge matches the frozen
 *     intended-mapping table below (kit name ↔ expected RHS). The table is an
 *     independent snapshot hard-coded at review time; re-pointing a token at a
 *     different-but-defined source (e.g. `color-text → var(--ap-color-danger)`)
 *     fails here even though it would resolve fine. Editing the bridge on
 *     purpose requires updating the table in the same change.
 *  2. RESOLUTION — in a real Chromium cascade (aponto token sheet + bridge,
 *     `.ap-admin` scope), every declared `--pmdk-*` token — color AND
 *     non-color — resolves to a usable value. A token whose source var does
 *     not exist (silent no-op, e.g. `space-1 → var(--ap-space-nope)`) comes
 *     back guaranteed-invalid and fails by name.
 *
 * It does NOT prove pixel equivalence of consumers reading `--pmdk-*` — no
 * mockup CSS consumes these tokens yet, so the pixel gate (capture/compare)
 * only shows the bridge is NON-DESTRUCTIVE when added to a real page. The
 * consumer-pixel proof lands at KIT-P3/P5 when `.pd-*` surfaces switch to
 * kit tokens.
 *
 * Deliberately NOT checked: two *different* kit tokens sharing one source
 * (legitimate — e.g. bg + surface both map to `--ap-color-surface`).
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname( fileURLToPath( import.meta.url ) );
const FIXTURE_BRIDGE = path.join( HERE, 'fixtures/aponto-admin-bridge.css' );
const FIXTURE_TOKENS = path.join( HERE, 'fixtures/aponto-tokens.css' );

const BRIDGE = process.argv[ 2 ]
	? path.resolve( process.argv[ 2 ] )
	: FIXTURE_BRIDGE;

/* ------------------------------------------------------------------------
 * Intended mapping — FROZEN snapshot of the reviewed bridge (2026-07-18).
 * RHS is whitespace-stripped. This table is the independent source of truth:
 * verify it by eye against docs/research/ds-contract-phase1.md, not by
 * regenerating it from the bridge (that would be circular).
 * --------------------------------------------------------------------- */
const EXPECTED = {
	'--pmdk-color-accent': 'var(--ap-color-accent)',
	'--pmdk-color-on-accent': 'var(--ap-color-on-accent)',
	'--pmdk-color-text': 'var(--ap-color-text)',
	'--pmdk-color-heading': 'var(--ap-color-heading)',
	'--pmdk-color-text-muted': 'var(--ap-color-text-muted)',
	'--pmdk-color-text-soft': 'var(--ap-color-text-soft)',
	'--pmdk-color-bg': 'var(--ap-color-surface)',
	'--pmdk-color-surface': 'var(--ap-color-surface)',
	'--pmdk-color-canvas': 'var(--ap-color-canvas)',
	'--pmdk-color-bg-subtle': 'var(--ap-color-surface-subtle)',
	'--pmdk-color-surface-subtle': 'var(--ap-color-surface-subtle)',
	'--pmdk-color-surface-muted': 'var(--ap-color-surface-muted)',
	'--pmdk-color-avatar-surface': 'var(--ap-color-avatar-surface)',
	'--pmdk-color-border': 'var(--ap-color-border)',
	'--pmdk-color-border-strong': 'var(--ap-color-border-strong)',
	'--pmdk-color-row-hover': 'var(--ap-color-row-hover)',
	'--pmdk-color-inverse-surface': 'var(--ap-color-inverse-surface)',
	'--pmdk-color-on-inverse': 'var(--ap-color-on-inverse)',
	'--pmdk-color-accent-subtle': 'var(--ap-color-accent-subtle)',
	'--pmdk-color-accent-soft': 'var(--ap-color-accent-soft)',
	'--pmdk-color-accent-border': 'var(--ap-color-accent-border)',
	'--pmdk-accent-fg':
		'color-mix(insrgb,var(--ap-color-accent)62%,var(--ap-color-text))',
	'--pmdk-control-border-active': 'var(--ap-color-accent)',
	'--pmdk-color-danger': 'var(--ap-color-danger)',
	'--pmdk-color-danger-subtle': 'var(--ap-color-danger-subtle)',
	'--pmdk-color-danger-border': 'var(--ap-color-danger-border)',
	'--pmdk-color-on-danger': 'var(--ap-color-on-danger)',
	'--pmdk-color-warning': 'var(--ap-color-warning)',
	'--pmdk-color-warning-subtle': 'var(--ap-color-warning-subtle)',
	'--pmdk-color-warning-border': 'var(--ap-color-warning-border)',
	'--pmdk-color-on-warning': 'var(--ap-color-on-warning)',
	'--pmdk-color-info': 'var(--ap-color-info)',
	'--pmdk-color-info-subtle': 'var(--ap-color-info-subtle)',
	'--pmdk-color-info-border': 'var(--ap-color-info-border)',
	'--pmdk-color-on-info': 'var(--ap-color-on-info)',
	'--pmdk-color-success': 'var(--ap-color-success)',
	'--pmdk-color-success-subtle': 'var(--ap-color-success-subtle)',
	'--pmdk-color-on-success': 'var(--ap-color-on-success)',
	'--pmdk-color-success-border':
		'color-mix(insrgb,var(--ap-color-success)24%,var(--ap-color-border))',
	'--pmdk-font-size-base': 'var(--ap-font-size-body)',
	'--pmdk-font-size-body': 'var(--ap-font-size-body)',
	'--pmdk-font-size-badge': 'var(--ap-font-size-badge)',
	'--pmdk-font-size-micro': 'var(--ap-font-size-micro)',
	'--pmdk-font-size-caption': 'var(--ap-font-size-caption)',
	'--pmdk-font-size-meta': 'var(--ap-font-size-meta)',
	'--pmdk-font-size-control': 'var(--ap-font-size-control)',
	'--pmdk-font-size-item': 'var(--ap-font-size-item)',
	'--pmdk-font-size-subheading': 'var(--ap-font-size-subheading)',
	'--pmdk-font-size-heading': 'var(--ap-font-size-heading)',
	'--pmdk-font-size-field-label': 'var(--ap-font-size-field-label)',
	'--pmdk-font-size-field-value': 'var(--ap-font-size-field-value)',
	'--pmdk-font-weight-regular': 'var(--ap-font-weight-regular)',
	'--pmdk-font-weight-medium': 'var(--ap-font-weight-medium)',
	'--pmdk-font-weight-semibold': 'var(--ap-font-weight-semibold)',
	'--pmdk-line-height-base': 'var(--ap-line-height-body)',
	'--pmdk-line-height-body': 'var(--ap-line-height-body)',
	'--pmdk-line-height-compact': 'var(--ap-line-height-compact)',
	'--pmdk-line-height-title': 'var(--ap-line-height-title)',
	'--pmdk-letter-spacing-title': 'var(--ap-letter-spacing-title)',
	'--pmdk-space-0': 'var(--ap-space-0)',
	'--pmdk-space-1': 'var(--ap-space-1)',
	'--pmdk-space-2': 'var(--ap-space-2)',
	'--pmdk-space-3': 'var(--ap-space-3)',
	'--pmdk-space-4': 'var(--ap-space-4)',
	'--pmdk-space-5': 'var(--ap-space-5)',
	'--pmdk-space-6': 'var(--ap-space-6)',
	'--pmdk-space-8': 'var(--ap-space-8)',
	'--pmdk-radius-small': 'var(--ap-radius-small)',
	'--pmdk-radius-control': 'var(--ap-radius-control)',
	'--pmdk-radius-pill': 'var(--ap-radius-pill)',
	'--pmdk-size-control-sm': 'var(--ap-size-control-sm)',
	'--pmdk-size-control-md': 'var(--ap-size-control-md)',
	'--pmdk-size-control-lg': 'var(--ap-size-control-lg)',
	'--pmdk-size-field-compact': 'var(--ap-size-field-compact)',
	'--pmdk-size-field-relationship': 'var(--ap-size-field-relationship)',
	'--pmdk-size-field-compact-notes': 'var(--ap-size-field-compact-notes)',
	'--pmdk-size-hit-target': 'var(--ap-size-hit-target)',
	'--pmdk-size-icon-sm': 'var(--ap-size-icon-sm)',
	'--pmdk-size-icon-md': 'var(--ap-size-icon-md)',
	'--pmdk-size-icon-lg': 'var(--ap-size-icon-lg)',
	'--pmdk-motion-standard': 'var(--ap-motion-standard)',
	'--pmdk-control-border-default':
		'color-mix(insrgb,var(--ap-color-text)18%,var(--ap-color-surface))',
	'--pmdk-control-border-hover':
		'color-mix(insrgb,var(--ap-color-text)30%,var(--ap-color-surface))',
	'--pmdk-data-border-strong': 'var(--ap-color-border-strong)',
	'--pmdk-data-border-medium':
		'color-mix(insrgb,var(--ap-color-border-strong)55%,var(--ap-color-border))',
	'--pmdk-data-border-soft':
		'color-mix(insrgb,var(--ap-color-border)72%,transparent)',
	'--pmdk-content-gutter': '28px',
	'--pmdk-inspector-width': '360px',
	'--pmdk-radius-card': 'var(--ap-radius-surface)',
	'--pmdk-color-success-soft': 'var(--ap-color-success-subtle)',
	'--pmdk-line-height-label': 'var(--ap-line-height-compact)',
};

/* --------------------------- 1. static mapping ------------------------- */

const css = await readFile( BRIDGE, 'utf8' );
const declared = new Map();
for ( const m of css.matchAll( /(--pmdk-[a-z0-9-]+)\s*:\s*([^;]+);/g ) ) {
	declared.set( m[ 1 ], m[ 2 ].replace( /\s+/g, '' ) );
}

const fails = [];
for ( const [ name, rhs ] of declared ) {
	if ( ! ( name in EXPECTED ) ) {
		fails.push(
			`${ name } declared in bridge but not in the intended-mapping table`
		);
	} else if ( EXPECTED[ name ] !== rhs ) {
		fails.push(
			`${ name } mapping mismatch:\n      bridge:   ${ rhs }\n      expected: ${ EXPECTED[ name ] }`
		);
	}
}
for ( const name of Object.keys( EXPECTED ) ) {
	if ( ! declared.has( name ) ) {
		fails.push(
			`${ name } missing from bridge (present in intended-mapping table)`
		);
	}
}

/* --------------------------- 2. resolution ----------------------------- */

// Synthetic consumer DOM — the same scopes the real mockup uses. Stylesheets
// are injected inline (addStyleTag reads the files), so no HTTP server and no
// file:// navigation is involved; runs identically on CI.
const browser = await chromium.launch( { headless: true } );
const page = await browser.newPage();
await page.setContent(
	'<body class="ap-token-scope" data-ap-color-scheme="light" data-ap-visual="v2"><div class="ap-admin"></div></body>'
);
await page.addStyleTag( { path: FIXTURE_TOKENS } );
await page.addStyleTag( { path: BRIDGE } );

const unresolved = await page.evaluate( ( names ) => {
	const scope = document.querySelector( '.ap-admin' );
	const probe = document.createElement( 'span' );
	probe.style.outlineStyle = 'solid';
	scope.appendChild( probe );
	// Sentinel fallbacks: a var() fallback fires ONLY when the token is
	// undefined or guaranteed-invalid (e.g. its source var doesn't exist).
	// A defined token of any type (color / length / number / shorthand)
	// never produces the full three-part sentinel signature: substitution
	// happens before per-property validation, so an odd-type value lands as
	// IACVT → initial/inherited value, not as the sentinel.
	const sig = ( token ) => {
		probe.style.color = `var(${ token }, rgb(1, 2, 3))`;
		probe.style.outlineOffset = `var(${ token }, 133.7px)`;
		probe.style.fontWeight = `var(${ token }, 371)`;
		const cs = getComputedStyle( probe );
		return `${ cs.color }|${ cs.outlineOffset }|${ cs.fontWeight }`;
	};
	const NONE = sig( '--pmdk-zzz-does-not-exist' );
	const bad = [];
	for ( const name of names ) {
		if ( sig( name ) === NONE ) {
			bad.push( name );
		}
	}
	probe.remove();
	return bad;
}, [ ...declared.keys() ] );

await browser.close();

for ( const name of unresolved ) {
	fails.push(
		`${ name } does not resolve in .ap-admin (guaranteed-invalid — source var missing?)`
	);
}

/* --------------------------- report ------------------------------------ */

const renames = [ ...declared.values() ].filter( ( v ) =>
	/^var\(--ap-[a-z0-9-]+\)$/.test( v )
).length;
console.log( `  bridge under test: ${ BRIDGE }` );
console.log(
	`  bridge tokens: ${ declared.size }  (${ renames } renames · ${
		declared.size - renames
	} computed/literal) · table entries: ${ Object.keys( EXPECTED ).length }`
);
if ( fails.length ) {
	console.log( `  ${ fails.length } FAILED:` );
	for ( const f of fails ) console.log( `   ✗ ${ f }` );
	process.exit( 1 );
}
console.log(
	'  mapping matches the intended table + every token resolves in-cascade ✓'
);
