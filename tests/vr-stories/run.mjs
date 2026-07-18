/**
 * VR-on-Storybook runner (KIT-P3 gate).
 *
 *   node tests/vr-stories/run.mjs capture <outDir>   # shoot the story matrix
 *   node tests/vr-stories/run.mjs compare            # baseline/ vs current/
 *
 * Serves `storybook-static/` itself on 127.0.0.1 (loopback only), so the flow
 * is: `npm run storybook:build` once, then capture/compare. Determinism copies
 * the tests/vr harness: DPR 1, reduced motion, animation-freeze stylesheet,
 * fonts.ready, double-rAF settle. Interactive popovers are not opened here —
 * behavior is unit-tested; VR guards the rendered chrome.
 */

import { createServer } from 'node:http';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import {
	STORY_IDS,
	VIEWPORT,
	HOST,
	PORT,
	BASE,
	PIXELMATCH_THRESHOLD,
	MAX_DIFF_PIXELS,
} from './config.mjs';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT = path.resolve( __dirname, '..', '..' );
const STATIC_DIR = path.join( ROOT, 'storybook-static' );

const MIME = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.mjs': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
};

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

function serveStorybook() {
	const server = createServer( ( req, res ) => {
		const urlPath = decodeURIComponent(
			new URL( req.url, BASE ).pathname,
		);
		let file = path.normalize(
			path.join( STATIC_DIR, urlPath === '/' ? 'index.html' : urlPath ),
		);
		if ( ! file.startsWith( STATIC_DIR ) || ! existsSync( file ) ) {
			res.writeHead( 404 );
			res.end( 'not found' );
			return;
		}
		res.writeHead( 200, {
			'content-type':
				MIME[ path.extname( file ) ] || 'application/octet-stream',
		} );
		createReadStream( file ).pipe( res );
	} );
	return new Promise( ( resolve ) => {
		server.listen( PORT, HOST, () => resolve( server ) );
	} );
}

async function settle( page ) {
	await page.addStyleTag( { content: FREEZE_CSS } );
	await page.evaluate( async () => {
		if ( document.fonts && document.fonts.ready ) {
			await document.fonts.ready;
		}
	} );
	await page.evaluate(
		() =>
			new Promise( ( resolve ) =>
				requestAnimationFrame( () =>
					requestAnimationFrame( resolve ),
				),
			),
	);
}

async function capture( outDir ) {
	if ( ! existsSync( STATIC_DIR ) ) {
		console.error(
			'storybook-static/ missing — run `npm run storybook:build` first.',
		);
		process.exit( 2 );
	}
	const abs = path.resolve( outDir );
	await mkdir( abs, { recursive: true } );
	const server = await serveStorybook();
	const browser = await chromium.launch( { headless: true } );
	const context = await browser.newContext( {
		viewport: VIEWPORT,
		deviceScaleFactor: 1,
		reducedMotion: 'reduce',
	} );
	// Stories must render from a clean slate — the persistence stories write
	// localStorage, and a stale blob would change the Ready shot.
	await context.addInitScript( () => {
		try {
			window.localStorage.clear();
		} catch {
			/* storage disabled — fine */
		}
	} );
	const page = await context.newPage();
	let count = 0;

	try {
		for ( const id of STORY_IDS ) {
			const url = `${ BASE }/iframe.html?id=${ id }&viewMode=story`;
			await page.goto( url, { waitUntil: 'networkidle' } );
			// Storybook renders into #storybook-root; an empty root or the
			// error screen means the story id is wrong or the story crashed.
			await page.waitForFunction( () => {
				const rootEl = document.getElementById( 'storybook-root' );
				return rootEl && rootEl.children.length > 0;
			} );
			// Storybook always ships a hidden .sb-errordisplay template; the
			// real crash signal is the body-level display class.
			const failed = await page.evaluate( () =>
				document.body.classList.contains( 'sb-show-errordisplay' ),
			);
			if ( failed ) {
				throw new Error( `story ${ id } rendered the error screen` );
			}
			await settle( page );
			const buf = await page.screenshot( {
				fullPage: true,
				animations: 'disabled',
			} );
			await writeFile( path.join( abs, `${ id }.png` ), buf );
			count++;
			process.stdout.write(
				`\r  captured ${ count }/${ STORY_IDS.length }  (${ id })`.padEnd(
					78,
				),
			);
		}
	} finally {
		await browser.close();
		server.close();
	}
	console.log( `\n  done: ${ count } story shots -> ${ abs }` );
}

async function compare() {
	const baseDir = path.join( __dirname, 'baseline' );
	const currentDir = path.join( __dirname, 'current' );
	const diffDir = path.join( __dirname, 'diff' );
	await mkdir( diffDir, { recursive: true } );
	const names = ( await readdir( baseDir ) ).filter( ( name ) =>
		name.endsWith( '.png' ),
	);
	let failures = 0;
	for ( const name of names ) {
		const currentFile = path.join( currentDir, name );
		if ( ! existsSync( currentFile ) ) {
			console.error( `  MISSING current/${ name }` );
			failures++;
			continue;
		}
		const a = PNG.sync.read( await readFile( path.join( baseDir, name ) ) );
		const b = PNG.sync.read( await readFile( currentFile ) );
		if ( a.width !== b.width || a.height !== b.height ) {
			console.error(
				`  SIZE ${ name }: ${ a.width }x${ a.height } vs ${ b.width }x${ b.height }`,
			);
			failures++;
			continue;
		}
		const diff = new PNG( { width: a.width, height: a.height } );
		const mismatched = pixelmatch(
			a.data,
			b.data,
			diff.data,
			a.width,
			a.height,
			{ threshold: PIXELMATCH_THRESHOLD },
		);
		if ( mismatched > MAX_DIFF_PIXELS ) {
			await writeFile(
				path.join( diffDir, name ),
				PNG.sync.write( diff ),
			);
			console.error( `  DIFF ${ name }: ${ mismatched }px` );
			failures++;
		} else {
			console.log( `  ok   ${ name }` );
		}
	}
	if ( failures ) {
		console.error( `\n  ${ failures } story shot(s) diverged.` );
		process.exit( 1 );
	}
	console.log( `\n  all ${ names.length } story shots match baseline.` );
}

const [ , , command, outDir ] = process.argv;
if ( command === 'capture' && outDir ) {
	await capture( outDir );
} else if ( command === 'compare' ) {
	await compare();
} else {
	console.error(
		'usage: node tests/vr-stories/run.mjs capture <outDir> | compare',
	);
	process.exit( 2 );
}
