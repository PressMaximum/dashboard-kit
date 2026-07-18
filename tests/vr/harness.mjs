/**
 * Shared VR harness — deterministic Playwright capture primitives.
 *
 * Determinism controls (so baseline vs. current only differ on real pixels):
 *   - headless Chromium, deviceScaleFactor 1 (image px == CSS px).
 *   - reducedMotion: 'reduce' + a hard stylesheet that kills all
 *     animation/transition, the text caret and smooth scrolling.
 *   - localStorage primary preset pinned to "deep" before any page script.
 *   - wait for network idle AND document.fonts.ready before shooting.
 *   - element screenshots of the section box (not full page) so the sticky
 *     gallery chrome and scroll position never enter the frame.
 */

import { chromium } from 'playwright';
import { PRESET, PRESET_KEY, GALLERY, APP } from './config.mjs';

const FREEZE_CSS = `
*,*::before,*::after{
  animation-duration:0s !important;
  animation-delay:0s !important;
  transition-duration:0s !important;
  transition-delay:0s !important;
  scroll-behavior:auto !important;
  caret-color:transparent !important;
}
html{scroll-behavior:auto !important;}
`;

export async function launch() {
	return chromium.launch({ headless: true } );
}

/**
 * Fresh hardened context at a given CSS viewport. The primary preset is
 * written to localStorage via an init script so the preferences engine reads
 * "deep" on first paint.
 */
export async function newContext( browser, viewport ) {
	const context = await browser.newContext( {
		viewport: { width: viewport.width, height: viewport.height },
		deviceScaleFactor: 1,
		reducedMotion: 'reduce',
	} );
	await context.addInitScript(
		( [ key, value ] ) => {
			try {
				window.localStorage.setItem( key, value );
			} catch ( e ) {
				/* storage disabled — engine falls back to default "deep" */
			}
		},
		[ PRESET_KEY, PRESET ]
	);
	return context;
}

// Optional bridge sheet injected into every page (the KIT-P2 gate run). Set
// VR_INJECT_CSS to the bridge path to prove it is visually inert (zero-diff)
// when added to a real consumer page.
const INJECT_CSS = process.env.VR_INJECT_CSS;

async function settle( page ) {
	if ( INJECT_CSS ) {
		await page.addStyleTag( { path: INJECT_CSS } );
	}
	await page.addStyleTag( { content: FREEZE_CSS } );
	await page.evaluate( async () => {
		if ( document.fonts && document.fonts.ready ) {
			await document.fonts.ready;
		}
	} );
	// Two rAFs to flush any layout the freeze stylesheet triggered.
	await page.evaluate(
		() =>
			new Promise( ( r ) =>
				requestAnimationFrame( () => requestAnimationFrame( r ) )
			)
	);
}

/**
 * Capture one gallery section. Returns the PNG buffer.
 * @param {import('playwright').Page} page
 * @param {string} theme  'light' | 'dark'
 * @param {string} section  section id
 */
export async function captureSection( page, theme, section ) {
	await page.goto( `${ GALLERY }?theme=${ theme }#${ section }`, {
		waitUntil: 'networkidle',
	} );
	await settle( page );

	const applied = await page.evaluate( () => document.body.dataset.apColorScheme );
	if ( applied !== theme ) {
		throw new Error(
			`theme mismatch for #${ section }: wanted ${ theme }, got ${ applied }`
		);
	}

	const el = page.locator( `#${ section }` );
	await el.scrollIntoViewIfNeeded();
	return el.screenshot( { animations: 'disabled' } );
}

/**
 * Capture the Bookings route with the in-flow inspector open. Viewport clip
 * (not element) because the inspector + list is the whole workspace plane.
 *
 * The Bookings table is the real React island (assets/dist/bookings-table.js);
 * its `.pd-booking-inspector` opens on row activation — a real pointer click at
 * the row centre (past the left checkbox column), not the vanilla
 * `#appointmentDrawer` used by other routes.
 */
export async function captureBookingsInspector( page, theme ) {
	await page.goto( `${ APP }#bookings`, { waitUntil: 'networkidle' } );

	// Theme first so the row geometry we click is the final layout.
	await page.evaluate( ( t ) => {
		document.body.dataset.apColorScheme = t;
	}, theme );
	await settle( page );

	const row = page.locator( '.pd-table tbody tr' ).first();
	await row.waitFor( { state: 'visible', timeout: 10000 } );
	const box = await row.boundingBox();
	if ( ! box ) throw new Error( 'no booking row to open inspector' );
	// Centre click activates the row; left ~10% is the checkbox column.
	await page.mouse.click( box.x + box.width * 0.5, box.y + box.height / 2 );

	await page.waitForFunction(
		() => {
			const el = document.querySelector( '.pd-booking-inspector' );
			return el && el.offsetWidth > 0 && el.offsetHeight > 0;
		},
		{ timeout: 10000 }
	);
	await settle( page );

	return page.screenshot( { animations: 'disabled' } );
}
