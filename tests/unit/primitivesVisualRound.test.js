/**
 * PressListing P2.5 QA round — the CSS pins for K-046 / K-049 / K-050 / K-051.
 *
 * Same technique as `moduleIconGlyph.test.js`: jsdom has no layout engine, but
 * it does resolve the cascade, and the cascade is what regressed here. Every
 * assertion below is "WHICH declaration wins", not "how many pixels" — the pixel
 * results are locked by the storybook VR matrix instead.
 *
 * The through-line for all four: the primitives tier was extracted from the
 * Aponto plugin-dashboard mockup, whose stylesheet opens with a GLOBAL
 * `*{box-sizing:border-box}` and a bare `button{cursor:pointer}`. Element-level
 * rules had no `.pd-` selector to rename, so the mechanical port silently
 * dropped them and every authored number in the tier was being read against the
 * wrong box model.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const SHEETS = [
	'src/primitives/base.css',
	'src/primitives/buttons.css',
	'src/primitives/tabs.css',
	'src/primitives/module-card.css',
];
const CSS = SHEETS.map( ( rel ) =>
	readFileSync( path.resolve( process.cwd(), rel ), 'utf8' ),
).join( '\n' );

let host;
let style;

const cs = ( id ) => window.getComputedStyle( document.getElementById( id ) );

beforeAll( () => {
	style = document.createElement( 'style' );
	style.textContent = CSS;
	document.head.appendChild( style );

	host = document.createElement( 'div' );
	host.className = 'pmdk-dashboard';
	host.innerHTML = `
		<article class="pmdk-module-card is-enabled" id="card">
			<div class="pmdk-module-card-head" id="head">
				<span class="pmdk-module-icon" id="icon"></span>
				<div class="pmdk-module-copy"><h2>Title</h2></div>
				<span class="pmdk-module-badges" id="badges">
					<span class="pmdk-module-license is-premium" id="license">Premium</span>
					<span class="pmdk-module-phase" id="phase">Coming in P4</span>
				</span>
			</div>
			<div class="pmdk-module-card-foot">
				<label class="pmdk-module-toggle">
					<span class="pmdk-toggle-track" id="track"><span></span></span>
				</label>
			</div>
		</article>
		<div class="pmdk-module-overview" id="overview">
			<span id="overview-count"><b id="overview-b">3</b> on</span>
			<i id="overview-sep" aria-hidden="true">·</i>
		</div>
		<button class="pmdk-button" id="button">Save</button>
		<button class="pmdk-icon-button" id="icon-button"></button>
		<div class="pmdk-section-tabs"><button id="tab">All</button></div>`;
	document.body.appendChild( host );
} );

afterAll( () => {
	host.remove();
	style.remove();
} );

/* --- K-046: the border-box reset ------------------------------------------ */
describe( 'K-046 primitives border-box reset', () => {
	it.each( [
		[ 'the toggle track (authored 38x22, rendered 44x28)', 'track' ],
		[ 'the module card (authored 302, rendered 340)', 'card' ],
		[ 'the phase badge (authored 28, rendered 42)', 'phase' ],
		[ 'the tier badge', 'license' ],
		[ 'a plain kit button', 'button' ],
	] )( 'applies to %s', ( _label, id ) => {
		expect( cs( id ).getPropertyValue( 'box-sizing' ) ).toBe( 'border-box' );
	} );

	it( 'reaches arbitrary depth, not just the classes the kit happens to style', () => {
		const deep = document.createElement( 'div' );
		deep.id = 'deep-unstyled';
		document
			.getElementById( 'card' )
			.appendChild( deep )
			.appendChild( document.createElement( 'span' ) );
		expect( cs( 'deep-unstyled' ).getPropertyValue( 'box-sizing' ) ).toBe(
			'border-box',
		);
	} );

	it( 'is scoped to the chassis — nothing outside `.pmdk-dashboard` is touched', () => {
		// The whole point of the REVISED-C scoping: core-only consumers import
		// `style.css`, never this sheet, so their box model cannot move. An
		// element outside the chassis is the in-test proxy for that promise.
		const outside = document.createElement( 'div' );
		outside.id = 'outside';
		document.body.appendChild( outside );
		expect( cs( 'outside' ).getPropertyValue( 'box-sizing' ) ).not.toBe(
			'border-box',
		);
		outside.remove();
	} );
} );

/* --- K-049: the icon glyph resolves to the mockup's 31px ------------------ */
describe( 'K-049 module icon glyph size', () => {
	it( 'sets 31px on the icon BOX, so the K-035 1em glyph rule resolves to 31', () => {
		// Deliberately on the wrapper, not the svg: K-035 sizes every child
		// glyph at 1em precisely so the size does not depend on which element
		// the consumer passes in. `font-size` is the one lever that keeps that.
		expect( cs( 'icon' ).getPropertyValue( 'font-size' ) ).toBe( '31px' );
	} );

	it( 'leaves the 34px box alone — the glyph got bigger, the cell did not', () => {
		expect( [
			cs( 'icon' ).getPropertyValue( 'width' ),
			cs( 'icon' ).getPropertyValue( 'height' ),
		] ).toEqual( [ '34px', '34px' ] );
	} );
} );

/* --- K-050: badges can never starve the title ----------------------------- */
describe( 'K-050 badge track cannot starve the copy column', () => {
	it( 'clamps the badges track with fit-content(40%)', () => {
		// `auto` let a nowrap cluster grow without limit (copy column measured
		// 206px -> 80px). `fit-content()` still resolves to max-content while
		// max-content fits, so short-badge cards are pixel-identical.
		const template = cs( 'head' ).getPropertyValue( 'grid-template-columns' );
		expect( template ).toContain( 'fit-content(40%)' );
		expect( template ).not.toMatch( /\bauto\s*$/ );
	} );

	it( 'lets the clamped cluster wrap instead of overflowing', () => {
		expect( cs( 'badges' ).getPropertyValue( 'flex-wrap' ) ).toBe( 'wrap' );
	} );

	it( 'keeps a row gap so a wrapped second row does not collide', () => {
		expect( cs( 'badges' ).getPropertyValue( 'row-gap' ) ).toBe( '5px' );
	} );
} );

/* --- K-048: the counts strip is its own surface --------------------------- */
describe( 'K-048 module overview counts strip', () => {
	it( 'is a compact inline flex run, not a boxed grid', () => {
		expect( cs( 'overview' ).getPropertyValue( 'display' ) ).toBe( 'flex' );
		expect( cs( 'overview' ).getPropertyValue( 'font-size' ) ).toBe(
			'var( --pmdk-font-size-caption )',
		);
	} );

	it( 'tints the count and the separator differently', () => {
		expect( cs( 'overview-b' ).getPropertyValue( 'color' ) ).toBe(
			'var( --pmdk-color-text-muted )',
		);
		expect( cs( 'overview-sep' ).getPropertyValue( 'font-style' ) ).toBe(
			'normal',
		);
	} );
} );

/* --- K-051: interactive chrome says it is interactive --------------------- */
describe( 'K-051 pointer cursor on interactive chrome', () => {
	it.each( [
		[ '.pmdk-button', 'button' ],
		[ '.pmdk-icon-button', 'icon-button' ],
		[ '.pmdk-section-tabs button', 'tab' ],
	] )( '%s', ( _label, id ) => {
		expect( cs( id ).getPropertyValue( 'cursor' ) ).toBe( 'pointer' );
	} );

	it( 'a disabled button still overrides to not-allowed', () => {
		const btn = document.getElementById( 'button' );
		btn.disabled = true;
		expect( cs( 'button' ).getPropertyValue( 'cursor' ) ).toBe(
			'not-allowed',
		);
		btn.disabled = false;
	} );
} );
