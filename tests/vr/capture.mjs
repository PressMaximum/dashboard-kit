/**
 * Capture the full VR matrix into an output directory.
 *
 *   node tests/vr/capture.mjs <outDir>
 *
 * Filenames: <viewport>__<theme>__<section>.png  (gallery)
 *            <viewport>__<theme>__bookings-inspector.png  (app)
 *
 * Use the same command for the baseline (outDir = tests/vr/baseline) and for
 * the post-bridge run (outDir = tests/vr/current); compare.mjs diffs the two.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
	launch,
	newContext,
	captureSection,
	captureBookingsInspector,
} from './harness.mjs';
import { VIEWPORTS, THEMES, SECTIONS } from './config.mjs';

const outDir = process.argv[ 2 ];
if ( ! outDir ) {
	console.error( 'usage: node tests/vr/capture.mjs <outDir>' );
	process.exit( 2 );
}

const abs = path.resolve( outDir );
await mkdir( abs, { recursive: true } );

const browser = await launch();
let count = 0;
const started = Date.now();

try {
	for ( const viewport of VIEWPORTS ) {
		const context = await newContext( browser, viewport );
		const page = await context.newPage();

		for ( const theme of THEMES ) {
			for ( const section of SECTIONS ) {
				const buf = await captureSection( page, theme, section );
				const file = `${ viewport.name }__${ theme }__${ section }.png`;
				await writeFile( path.join( abs, file ), buf );
				count++;
				process.stdout.write(
					`\r  captured ${ count } shots  (${ file })`.padEnd( 72 )
				);
			}
		}

		// App shot: bookings inspector-open, per theme, same viewport.
		for ( const theme of THEMES ) {
			try {
				const buf = await captureBookingsInspector( page, theme );
				const file = `${ viewport.name }__${ theme }__bookings-inspector.png`;
				await writeFile( path.join( abs, file ), buf );
				count++;
				process.stdout.write(
					`\r  captured ${ count } shots  (${ file })`.padEnd( 72 )
				);
			} catch ( e ) {
				console.warn(
					`\n  ! bookings-inspector ${ viewport.name }/${ theme } skipped: ${ e.message }`
				);
			}
		}

		await context.close();
	}
} finally {
	await browser.close();
}

const secs = ( ( Date.now() - started ) / 1000 ).toFixed( 1 );
console.log( `\n  done: ${ count } shots -> ${ abs }  (${ secs }s)` );
