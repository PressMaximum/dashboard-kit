/**
 * K-035 — the module-card icon glyph is sized regardless of its wrapper class.
 *
 * `.pmdk-module-icon` is a 34px grid cell. The glyph inside got a size only
 * from `.pmdk-react-icon > svg { width: 1em }` — the kit's own wrapper class,
 * emitted by `defaultRenderIcon`. A consumer whose icon renderer wraps in its
 * OWN class handed the cell an `<svg>` carrying nothing but a `viewBox`, and a
 * viewBox-only SVG in a grid cell resolves to 0x0: the icon vanished.
 *
 * jsdom has no layout, but it does resolve the cascade, which is exactly what
 * is under test here — WHICH declaration wins for the glyph. The pixel result
 * is verified separately in a browser (both wrappers measure 14x14, unchanged
 * for the kit wrapper).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const CSS = [ 'src/primitives/base.css', 'src/primitives/module-card.css' ]
	.map( ( rel ) => readFileSync( path.resolve( process.cwd(), rel ), 'utf8' ) )
	.join( '\n' );

let host;
let style;

beforeAll( () => {
	style = document.createElement( 'style' );
	style.textContent = CSS;
	document.head.appendChild( style );

	host = document.createElement( 'div' );
	host.className = 'pmdk-dashboard';
	host.innerHTML = `
		<article class="pmdk-module-card is-enabled">
			<div class="pmdk-module-card-head">
				<span class="pmdk-module-icon" id="kit">
					<span class="pmdk-react-icon"><svg viewBox="0 0 24 24"></svg></span>
				</span>
				<span class="pmdk-module-icon" id="foreign">
					<span class="my-plugin-icon"><svg viewBox="0 0 24 24"></svg></span>
				</span>
				<span class="pmdk-module-icon" id="bare">
					<svg viewBox="0 0 24 24"></svg>
				</span>
				<span class="pmdk-module-icon" id="nested">
					<span class="a"><span class="b"><svg viewBox="0 0 24 24"></svg></span></span>
				</span>
			</div>
		</article>`;
	document.body.appendChild( host );
} );

afterAll( () => {
	host.remove();
	style.remove();
} );

const glyphSize = ( id ) => {
	const svg = document.getElementById( id ).querySelector( 'svg' );
	const cs = window.getComputedStyle( svg );
	return [
		cs.getPropertyValue( 'width' ),
		cs.getPropertyValue( 'height' ),
	];
};

describe( 'K-035 module-card icon glyph sizing', () => {
	it( "the kit's own wrapper is unchanged — still 1em", () => {
		// The zero-look-change contract: consumers passing `defaultRenderIcon`
		// output must not move. 1em now resolves to 31px in-browser — K-049 set
		// `font-size:31px` on the icon BOX, which is exactly the wrapper-
		// independence this rule exists to provide (every wrapper moved
		// together; before K-049 the em resolved to the card's ~13px body size).
		expect( glyphSize( 'kit' ) ).toEqual( [ '1em', '1em' ] );
	} );

	it( 'a FOREIGN wrapper class now gets the same 1em glyph', () => {
		expect( glyphSize( 'foreign' ) ).toEqual( [ '1em', '1em' ] );
	} );

	it( 'a bare <svg> child is sized too', () => {
		expect( glyphSize( 'bare' ) ).toEqual( [ '1em', '1em' ] );
	} );

	it( 'both wrappers resolve to the SAME size — no two-tier rendering', () => {
		expect( glyphSize( 'foreign' ) ).toEqual( glyphSize( 'kit' ) );
	} );

	it( 'the box itself is untouched at 34px', () => {
		const cs = window.getComputedStyle( document.getElementById( 'kit' ) );
		expect( [
			cs.getPropertyValue( 'width' ),
			cs.getPropertyValue( 'height' ),
		] ).toEqual( [ '34px', '34px' ] );
	} );

	it( 'documents the depth limit: a doubly-nested glyph is NOT reached', () => {
		// `> * > svg` is one wrapper deep on purpose — a descendant selector
		// would also hit glyphs inside future icon-adjacent chrome. Consumers
		// nesting deeper size their own glyph.
		expect( glyphSize( 'nested' ) ).not.toEqual( [ '1em', '1em' ] );
	} );
} );
