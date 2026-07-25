/**
 * K-030 — the kit's CSS must survive a consumer-side rtlcss pass.
 *
 * The kit ships LTR stylesheets only; every consumer's build (wp-scripts) runs
 * rtlcss over them to emit `*-rtl.css`. Two constructs are booby traps there,
 * and both had shipped:
 *
 *  1. an RTL override keyed on the kit's OWN scope (`.pmdk-dashboard[dir=rtl]`)
 *     never matches — direction comes from `<html dir="rtl">`, the app root
 *     carries no `dir` attribute — AND rtlcss mirrors its declarations a second
 *     time, so if it ever did match it would render LTR;
 *  2. a literal `direction: ltr` (money/time/id runs) is rewritten to
 *     `direction: rtl`, flipping exactly the runs the rule exists to pin.
 *
 * The escape hatch is that rtlcss never rewrites custom-property DECLARATIONS,
 * so `--pmdk-dir-lock: ltr` + `direction: var( --pmdk-dir-lock )` survives. It
 * does rewrite `var()` FALLBACKS (`var( --x, ltr )` → `var( --x, rtl )`), which
 * is why the declaration has to ship in every sheet that uses it.
 *
 * This asserts the source, then runs the real rtlcss over it.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import rtlcss from 'rtlcss';

const SRC = path.resolve( process.cwd(), 'src' );

function cssFiles( dir ) {
	return readdirSync( dir ).flatMap( ( entry ) => {
		const full = path.join( dir, entry );
		if ( statSync( full ).isDirectory() ) {
			return cssFiles( full );
		}
		return entry.endsWith( '.css' ) ? [ full ] : [];
	} );
}

const FILES = cssFiles( SRC ).map( ( full ) => ( {
	rel: path.relative( process.cwd(), full ),
	/* Comments carry prose about these very constructs — strip them. */
	css: readFileSync( full, 'utf8' ).replace( /\/\*[\s\S]*?\*\//g, '' ),
} ) );

describe( 'K-030 rtlcss safety of the kit stylesheets', () => {
	it( 'finds stylesheets to check', () => {
		expect( FILES.length ).toBeGreaterThan( 10 );
	} );

	it( 'no RTL override is keyed on a kit scope class', () => {
		// `[dir=rtl] .pmdk-…` (html-level) is fine and stays allowed; what is
		// banned is a kit class carrying the attribute itself.
		const offenders = FILES.flatMap( ( { rel, css } ) =>
			( css.match( /\.pmdk-[a-z0-9-]*\[\s*dir\s*[~|]?=/gi ) || [] ).map(
				( hit ) => `${ rel }: ${ hit }`,
			),
		);
		expect( offenders ).toEqual( [] );
	} );

	it( 'no literal direction value — every one goes through the dir-lock token', () => {
		const offenders = FILES.flatMap( ( { rel, css } ) =>
			(
				css.match( /(?<!flex-)direction:\s*(?:ltr|rtl)\b/gi ) || []
			).map( ( hit ) => `${ rel }: ${ hit }` ),
		);
		expect( offenders ).toEqual( [] );
	} );

	it( 'the dir-lock is never used with a var() fallback (rtlcss rewrites those)', () => {
		const offenders = FILES.flatMap( ( { rel, css } ) =>
			( css.match( /var\(\s*--pmdk-dir-lock\s*,/g ) || [] ).map(
				( hit ) => `${ rel }: ${ hit }`,
			),
		);
		expect( offenders ).toEqual( [] );
	} );

	it( 'every sheet that uses the dir-lock also declares it', () => {
		// No fallback is possible, so a sheet cannot rely on another being
		// loaded. `primitives/style.css` gets it from base.css via @import.
		const DECLARING = [ 'src/styles/tokens.css', 'src/primitives/base.css' ];
		const declared = FILES.filter( ( f ) =>
			/--pmdk-dir-lock:\s*\w+/.test( f.css ),
		).map( ( f ) => f.rel );
		expect( declared.sort() ).toEqual( DECLARING.sort() );
	} );

	it( 'rtlcss over the source emits no direction flip anywhere', () => {
		const flips = FILES.flatMap( ( { rel, css } ) => {
			const rtl = rtlcss.process( css );
			return (
				rtl.match( /(?<!flex-)direction:\s*(?:ltr|rtl)\b/gi ) || []
			).map( ( hit ) => `${ rel }: ${ hit }` );
		} );
		expect( flips ).toEqual( [] );
	} );

	it( 'rtlcss keeps the dir-lock declaration and its use sites intact', () => {
		const uses = FILES.filter( ( f ) =>
			/direction:\s*var\(\s*--pmdk-dir-lock\s*\)/.test( f.css ),
		);
		expect( uses.length ).toBeGreaterThan( 0 );
		for ( const { rel, css } of uses ) {
			const rtl = rtlcss.process( css );
			expect( {
				rel,
				uses: (
					rtl.match(
						/direction:\s*var\(\s*--pmdk-dir-lock\s*\)/g,
					) || []
				).length,
			} ).toEqual( {
				rel,
				uses: (
					css.match(
						/direction:\s*var\(\s*--pmdk-dir-lock\s*\)/g,
					) || []
				).length,
			} );
		}
		for ( const rel of [ 'src/styles/tokens.css', 'src/primitives/base.css' ] ) {
			const css = FILES.find( ( f ) => f.rel === rel ).css;
			expect( rtlcss.process( css ) ).toContain( '--pmdk-dir-lock: ltr' );
		}
	} );

	it( 'transform rotations are symmetric, so rtlcss negating them is a no-op', () => {
		// rtlcss rewrites `rotate(Xdeg)` inside `transform` to `rotate(-Xdeg)`.
		// That only renders identically at 180deg. Any other angle must move to
		// the individual `rotate:` property, which rtlcss leaves alone.
		const offenders = FILES.flatMap( ( { rel, css } ) =>
			( css.match( /transform:[^;}]*rotate\(\s*-?[\d.]+deg/gi ) || [] )
				.filter( ( hit ) => ! /rotate\(\s*-?180deg/i.test( hit ) )
				.map( ( hit ) => `${ rel }: ${ hit }` ),
		);
		expect( offenders ).toEqual( [] );
	} );
} );
