/**
 * KIT-P4 gate evidence — Blocksify consumer shots (REVISED C zero
 * look-change proof).
 *
 *   node tests/vr/gate-p4/blocksify/shoot.mjs <outDir>
 *
 * Shoots the five kit-consuming dashboard routes of the REAL Blocksify
 * plugin running in its WordPress Studio site (blocksify.wp.local →
 * 127.0.0.1). Run once against the plugin built with the last released
 * kit (before/), once against the local KIT-P4 worktree bump (after/),
 * then diff with compare.mjs — required result: ZERO pixels.
 *
 * Determinism: fixed 1440x900 viewport, DPR 1, reduced motion +
 * animation-freeze stylesheet, fonts.ready, spinner drain + settle
 * delay for the SPA's async mounts (checklist checks, DataViews fetch).
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.BSY_BASE || 'http://blocksify.wp.local';
const LOGIN = `${ BASE }/studio-auto-login?redirect_to=%2Fwp-admin%2F`;
const PAGE = `${ BASE }/wp-admin/admin.php?page=blocksify`;

// The kit-consuming tabs (dashboard SPA hash routes).
const ROUTES = [ 'welcome', 'settings', 'templates', 'free-vs-pro', 'changelog' ];

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

const outDir = process.argv[ 2 ];
if ( ! outDir ) {
	console.error( 'usage: node tests/vr/gate-p4/blocksify/shoot.mjs <outDir>' );
	process.exit( 2 );
}
const abs = path.resolve( outDir );
await mkdir( abs, { recursive: true } );

const browser = await chromium.launch( { headless: true } );
const context = await browser.newContext( {
	viewport: { width: 1440, height: 900 },
	deviceScaleFactor: 1,
	reducedMotion: 'reduce',
} );
const page = await context.newPage();

async function settle() {
	await page.addStyleTag( { content: FREEZE_CSS } );
	await page.evaluate( async () => {
		if ( document.fonts && document.fonts.ready ) {
			await document.fonts.ready;
		}
	} );
	// Drain async mounts: wait until no spinner is visible (checklist
	// auto-checks, settings load, DataViews fetch), max 15s.
	await page
		.waitForFunction(
			() => ! document.querySelector( '.components-spinner' ),
			{ timeout: 15000 },
		)
		.catch( () => {} );
	await page.waitForLoadState( 'networkidle' ).catch( () => {} );
	await page.waitForTimeout( 400 );
	await page.evaluate(
		() =>
			new Promise( ( r ) =>
				requestAnimationFrame( () => requestAnimationFrame( r ) ),
			),
	);
}

try {
	// Studio auto-login establishes the wp-admin session cookie.
	await page.goto( LOGIN, { waitUntil: 'networkidle' } );

	let count = 0;
	for ( const route of ROUTES ) {
		await page.goto( `${ PAGE }#${ route }`, { waitUntil: 'networkidle' } );
		// SPA boots on the hash — make sure the dashboard chassis mounted
		// and the route content rendered.
		await page.waitForSelector( '.pmdk-dashboard__main', {
			timeout: 15000,
		} );
		await settle();
		const buf = await page.screenshot( {
			fullPage: true,
			animations: 'disabled',
		} );
		const file = `${ route }.png`;
		await writeFile( path.join( abs, file ), buf );
		count++;
		process.stdout.write( `\r  captured ${ count }/${ ROUTES.length } (${ file })`.padEnd( 60 ) );
	}
	console.log( `\n  done: ${ count } shots -> ${ abs }` );
} finally {
	await browser.close();
}
