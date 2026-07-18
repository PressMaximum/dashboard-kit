/**
 * KIT-P4 gate evidence — the Aponto mockup rendered THROUGH the kit's
 * `.pmdk-theme-app` values (NEW-look shots for founder review; NOT a
 * zero-diff gate).
 *
 *   node tests/vr/capture-theme-app.mjs [outDir]
 *     outDir default: tests/vr/gate-p4/theme-app
 *
 * Per page the harness:
 *   1. loads the gallery/app URL from the running mockup server (VR_BASE,
 *      127.0.0.1 only — same serving contract as capture.mjs),
 *   2. injects build/style.css (token API + engine) + build/themes/app.css
 *      (the packaged theme) + gate-p4/theme-app/evidence-bridge.css (the
 *      seed re-point, incl. the deep-preset accent the consumer bridge
 *      would provide),
 *   3. stamps `pmdk-theme-app` + `data-pmdk-color-scheme` on the mockup's
 *      token-scope element (<body class="ap-token-scope">) — the exact
 *      consumer wiring documented in src/themes/app.css,
 *   4. freezes animation, waits for fonts, shoots.
 *
 * Shots: 12 gallery sections x light/dark at 1440x900, plus the
 * index.html#bookings route with the in-flow inspector open x light/dark
 * = 26 evidence shots.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, newContext } from './harness.mjs';
import { GALLERY, APP, SECTIONS } from './config.mjs';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT = path.resolve( __dirname, '..', '..' );

const OUT = path.resolve(
	process.argv[ 2 ] || path.join( __dirname, 'gate-p4', 'theme-app' ),
);

const VIEWPORT = { name: '1440x900', width: 1440, height: 900 };
const THEMES = [ 'light', 'dark' ];

const SHEETS = [
	path.join( ROOT, 'build', 'style.css' ),
	path.join( ROOT, 'build', 'themes', 'app.css' ),
	path.join( __dirname, 'gate-p4', 'theme-app', 'evidence-bridge.css' ),
];

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

async function applyThemeApp( page, theme ) {
	for ( const sheet of SHEETS ) {
		await page.addStyleTag( { path: sheet } );
	}
	await page.evaluate( ( t ) => {
		const scope = document.querySelector( '.ap-token-scope' ) || document.body;
		scope.classList.add( 'pmdk-theme-app' );
		if ( t === 'dark' ) {
			scope.setAttribute( 'data-pmdk-color-scheme', 'dark' );
		} else {
			scope.removeAttribute( 'data-pmdk-color-scheme' );
		}
		// Keep the mockup's own scheme switch in step so its non-token
		// scheme hooks (e.g. logo invert) agree with the kit preset.
		scope.dataset.apColorScheme = t;
	}, theme );
	await page.addStyleTag( { content: FREEZE_CSS } );
	await page.evaluate( async () => {
		if ( document.fonts && document.fonts.ready ) {
			await document.fonts.ready;
		}
	} );
	await page.evaluate(
		() =>
			new Promise( ( r ) =>
				requestAnimationFrame( () => requestAnimationFrame( r ) ),
			),
	);
}

async function shootSection( page, theme, section ) {
	await page.goto( `${ GALLERY }?theme=${ theme }#${ section }`, {
		waitUntil: 'networkidle',
	} );
	await applyThemeApp( page, theme );
	const el = page.locator( `#${ section }` );
	await el.scrollIntoViewIfNeeded();
	return el.screenshot( { animations: 'disabled' } );
}

async function shootBookingsInspector( page, theme ) {
	await page.goto( `${ APP }#bookings`, { waitUntil: 'networkidle' } );
	await applyThemeApp( page, theme );

	const row = page.locator( '.pd-table tbody tr' ).first();
	await row.waitFor( { state: 'visible', timeout: 10000 } );
	const box = await row.boundingBox();
	if ( ! box ) {
		throw new Error( 'no booking row to open inspector' );
	}
	await page.mouse.click( box.x + box.width * 0.5, box.y + box.height / 2 );
	await page.waitForFunction(
		() => {
			const el = document.querySelector( '.pd-booking-inspector' );
			return el && el.offsetWidth > 0 && el.offsetHeight > 0;
		},
		{ timeout: 10000 },
	);
	// Re-settle after the inspector opened.
	await page.evaluate(
		() =>
			new Promise( ( r ) =>
				requestAnimationFrame( () => requestAnimationFrame( r ) ),
			),
	);
	return page.screenshot( { animations: 'disabled' } );
}

await mkdir( OUT, { recursive: true } );
const browser = await launch();
let count = 0;
const started = Date.now();

try {
	const context = await newContext( browser, VIEWPORT );
	const page = await context.newPage();

	for ( const theme of THEMES ) {
		for ( const section of SECTIONS ) {
			const buf = await shootSection( page, theme, section );
			const file = `${ VIEWPORT.name }__${ theme }__${ section }__theme-app.png`;
			await writeFile( path.join( OUT, file ), buf );
			count++;
			process.stdout.write(
				`\r  captured ${ count } shots  (${ file })`.padEnd( 80 ),
			);
		}
		const buf = await shootBookingsInspector( page, theme );
		const file = `${ VIEWPORT.name }__${ theme }__bookings-inspector__theme-app.png`;
		await writeFile( path.join( OUT, file ), buf );
		count++;
		process.stdout.write(
			`\r  captured ${ count } shots  (${ file })`.padEnd( 80 ),
		);
	}

	await context.close();
} finally {
	await browser.close();
}

const secs = ( ( Date.now() - started ) / 1000 ).toFixed( 1 );
console.log( `\n  done: ${ count } theme-app evidence shots -> ${ OUT } (${ secs }s)` );
