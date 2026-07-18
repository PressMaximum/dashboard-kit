/**
 * Pixel-diff two capture directories.
 *
 *   node tests/vr/compare.mjs <baselineDir> <currentDir> [diffDir]
 *
 * Exit 0 when every shot is byte-or-pixel identical. For KIT-P2 this proves the
 * bridge is NON-DESTRUCTIVE when added to the live gallery (which does not yet
 * consume `--pmdk-*`); consumer-pixel equivalence is a KIT-P3/P5 gate. Exit 1
 * when any shot differs; each non-zero shot is written to diffDir with
 * mismatching pixels highlighted so every diff can be accounted for in the
 * report.
 */

import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const [ baseDir, curDir, diffDir = 'tests/vr/diff' ] = process.argv.slice( 2 );
if ( ! baseDir || ! curDir ) {
	console.error(
		'usage: node tests/vr/compare.mjs <baselineDir> <currentDir> [diffDir]'
	);
	process.exit( 2 );
}

const baseAbs = path.resolve( baseDir );
const curAbs = path.resolve( curDir );
const diffAbs = path.resolve( diffDir );
await mkdir( diffAbs, { recursive: true } );

const baseFiles = ( await readdir( baseAbs ) )
	.filter( ( f ) => f.endsWith( '.png' ) )
	.sort();

let totalDiffPixels = 0;
let changedShots = 0;
let missing = 0;
const rows = [];

for ( const file of baseFiles ) {
	let curBuf;
	try {
		curBuf = await readFile( path.join( curAbs, file ) );
	} catch {
		missing++;
		rows.push( [ file, 'MISSING in current', '-' ] );
		continue;
	}
	const baseBuf = await readFile( path.join( baseAbs, file ) );

	// Fast path: identical bytes => identical pixels.
	if ( baseBuf.equals( curBuf ) ) {
		rows.push( [ file, 'identical', '0' ] );
		continue;
	}

	const a = PNG.sync.read( baseBuf );
	const b = PNG.sync.read( curBuf );
	if ( a.width !== b.width || a.height !== b.height ) {
		changedShots++;
		rows.push( [
			file,
			`DIM ${ a.width }x${ a.height } -> ${ b.width }x${ b.height }`,
			'n/a',
		] );
		continue;
	}

	const diff = new PNG( { width: a.width, height: a.height } );
	const n = pixelmatch( a.data, b.data, diff.data, a.width, a.height, {
		threshold: 0.1,
		includeAA: true,
	} );
	if ( n > 0 ) {
		changedShots++;
		totalDiffPixels += n;
		await writeFile( path.join( diffAbs, file ), PNG.sync.write( diff ) );
		rows.push( [ file, 'DIFF', String( n ) ] );
	} else {
		// Different bytes, zero visible pixels (metadata/encoding only).
		rows.push( [ file, 'identical (px)', '0' ] );
	}
}

const w0 = Math.max( ...rows.map( ( r ) => r[ 0 ].length ), 4 );
console.log(
	`${ 'shot'.padEnd( w0 ) }  ${ 'status'.padEnd( 22 ) }  diffPx`
);
for ( const [ f, s, n ] of rows ) {
	console.log( `${ f.padEnd( w0 ) }  ${ s.padEnd( 22 ) }  ${ n }` );
}

console.log(
	`\n  ${ baseFiles.length } shots · ${ changedShots } changed · ` +
		`${ missing } missing · ${ totalDiffPixels } total diff px`
);

if ( changedShots > 0 || missing > 0 ) {
	console.log( `  diffs written to ${ diffAbs }` );
	process.exit( 1 );
}
console.log( '  ZERO-DIFF ✓' );
