/**
 * createMenu — headless menu/popover behavior contract (KIT-P3 slice 3, G4).
 *
 * Ports of the BookingsTable per-component patterns, tested once: trigger
 * toggling + aria-expanded, keyboard-open focuses the first item, roving menu
 * keys, Escape-with-focus-return, outside-pointerdown dismiss, item selection
 * (keyboard returns focus), fixed positioning mode. Pure DOM.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMenu } from '../../src/primitives/menu.js';

let host;
let controller;
let root;
let trigger;
let popover;
let shell;
let inner;
let selections;

const flushFrames = () =>
	new Promise( ( resolve ) =>
		requestAnimationFrame( () => requestAnimationFrame( resolve ) ),
	);

/**
 * Mounts the fixture.
 *
 * Two nested wrappers, `.pmdk-shell` > `.pmdk-inner`, so a test can put
 * containment on the OUTER, the INNER, or both — the two-ancestor case is
 * where a single-candidate search goes wrong (K-021 round 2). `innerStyle`
 * defaults to nothing, which leaves the earlier single-wrapper behaviour.
 *
 * @param {Object} options    createMenu options.
 * @param {string} shellStyle Inline style for the outer wrapper ('' = none).
 * @param {string} innerStyle Inline style for the inner wrapper ('' = none).
 */
function mount( options = {}, shellStyle = '', innerStyle = '' ) {
	host = document.createElement( 'div' );
	document.body.appendChild( host );
	host.innerHTML = `
		<div class="pmdk-shell" style="${ shellStyle }">
		<div class="pmdk-inner" style="${ innerStyle }">
		<div data-menu>
			<button data-menu-trigger type="button">Actions</button>
			<div class="pmdk-row-action-menu" role="menu" aria-label="Actions" hidden>
				<button role="menuitem" type="button" data-id="view">View</button>
				<button role="menuitem" type="button" data-id="edit">Edit</button>
				<div role="separator"></div>
				<button role="menuitem" type="button" data-id="delete" class="is-danger">Delete</button>
			</div>
		</div>
		</div>
		</div>`;
	shell = host.querySelector( '.pmdk-shell' );
	inner = host.querySelector( '.pmdk-inner' );
	root = host.querySelector( '[data-menu]' );
	trigger = root.querySelector( '[data-menu-trigger]' );
	popover = root.querySelector( '[role="menu"]' );
	selections = [];
	controller = createMenu( root, {
		onSelect: ( item ) => selections.push( item.dataset.id ),
		...options,
	} );
}

/* Remount helper for the cases that need a different fixture mid-test. */
function remount( options = {}, shellStyle = '', innerStyle = '' ) {
	controller.destroy();
	host.remove();
	mount( options, shellStyle, innerStyle );
}

const rect = ( top, left, height, width ) => () => ( {
	top,
	left,
	bottom: top + height,
	right: left + width,
	width,
	height,
} );

beforeEach( () => mount() );

afterEach( () => {
	controller.destroy();
	host.remove();
} );

const pointerClick = ( el ) =>
	el.dispatchEvent(
		new MouseEvent( 'click', { bubbles: true, detail: 1 } ),
	);
const keyboardClick = ( el ) =>
	el.dispatchEvent(
		new MouseEvent( 'click', { bubbles: true, detail: 0 } ),
	);

describe( 'createMenu', () => {
	it( 'wires ARIA and toggles on trigger click', () => {
		expect( trigger.getAttribute( 'aria-haspopup' ) ).toBe( 'menu' );
		expect( trigger.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
		pointerClick( trigger );
		expect( controller.isOpen() ).toBe( true );
		expect( popover.hidden ).toBe( false );
		expect( trigger.getAttribute( 'aria-expanded' ) ).toBe( 'true' );
		pointerClick( trigger );
		expect( controller.isOpen() ).toBe( false );
	} );

	it( 'keyboard open focuses the first enabled item', async () => {
		keyboardClick( trigger );
		await flushFrames();
		expect( document.activeElement?.dataset.id ).toBe( 'view' );
	} );

	it( 'pointer open does NOT steal focus', async () => {
		trigger.focus();
		pointerClick( trigger );
		await flushFrames();
		expect( document.activeElement ).toBe( trigger );
	} );

	it( 'roving keys move focus (ArrowDown/ArrowUp/Home/End)', async () => {
		keyboardClick( trigger );
		await flushFrames();
		const key = ( name ) =>
			document.activeElement.dispatchEvent(
				new KeyboardEvent( 'keydown', {
					key: name,
					bubbles: true,
				} ),
			);
		key( 'ArrowDown' );
		expect( document.activeElement?.dataset.id ).toBe( 'edit' );
		key( 'End' );
		expect( document.activeElement?.dataset.id ).toBe( 'delete' );
		key( 'ArrowUp' );
		expect( document.activeElement?.dataset.id ).toBe( 'edit' );
		key( 'Home' );
		expect( document.activeElement?.dataset.id ).toBe( 'view' );
	} );

	it( 'Escape closes and returns focus to the trigger', async () => {
		keyboardClick( trigger );
		await flushFrames();
		document.activeElement.dispatchEvent(
			new KeyboardEvent( 'keydown', {
				key: 'Escape',
				bubbles: true,
			} ),
		);
		await flushFrames();
		expect( controller.isOpen() ).toBe( false );
		expect( document.activeElement ).toBe( trigger );
	} );

	it( 'outside pointerdown dismisses without stealing focus', () => {
		pointerClick( trigger );
		expect( controller.isOpen() ).toBe( true );
		document.body.dispatchEvent(
			new Event( 'pointerdown', { bubbles: true } ),
		);
		expect( controller.isOpen() ).toBe( false );
	} );

	it( 'item click selects and closes; keyboard activation returns focus', async () => {
		pointerClick( trigger );
		pointerClick( popover.querySelector( '[data-id="edit"]' ) );
		expect( selections ).toEqual( [ 'edit' ] );
		expect( controller.isOpen() ).toBe( false );

		keyboardClick( trigger );
		await flushFrames();
		keyboardClick( popover.querySelector( '[data-id="delete"]' ) );
		await flushFrames();
		expect( selections ).toEqual( [ 'edit', 'delete' ] );
		expect( document.activeElement ).toBe( trigger );
	} );

	it( 'disabled items are skipped by selection and roving', async () => {
		controller.destroy();
		host.remove();
		mount();
		popover.querySelector( '[data-id="edit"]' ).disabled = true;
		keyboardClick( trigger );
		await flushFrames();
		document.activeElement.dispatchEvent(
			new KeyboardEvent( 'keydown', {
				key: 'ArrowDown',
				bubbles: true,
			} ),
		);
		expect( document.activeElement?.dataset.id ).toBe( 'delete' );
		pointerClick( popover.querySelector( '[data-id="edit"]' ) );
		expect( selections ).toEqual( [] );
	} );

	it( 'onOpenChange observes both directions', () => {
		const onOpenChange = vi.fn();
		controller.destroy();
		host.remove();
		mount( { onOpenChange } );
		pointerClick( trigger );
		pointerClick( trigger );
		expect( onOpenChange.mock.calls.map( ( c ) => c[ 0 ] ) ).toEqual( [
			true,
			false,
		] );
	} );

	it( 'fixed mode floats the popover with viewport-clamped coordinates', () => {
		// jsdom viewport = 1024x768; popover.scrollHeight = 0 (no layout),
		// offsetWidth = 0 -> menuWidth falls back to 196. All arithmetic
		// below is therefore exact.
		controller.destroy();
		host.remove();
		mount( { position: 'fixed' } );
		trigger.getBoundingClientRect = () => ( {
			top: 100,
			bottom: 134,
			left: 500,
			right: 560,
			width: 60,
			height: 34,
		} );
		pointerClick( trigger );
		expect( popover.classList.contains( 'is-floating' ) ).toBe( true );
		// space below (768-134=634) fits -> opens below: top = bottom + 5.
		expect( popover.style.top ).toBe( '139px' );
		// LTR right-aligns to the trigger: left = right - menuWidth.
		expect( popover.style.left ).toBe( '364px' );
		pointerClick( trigger );
		expect( popover.classList.contains( 'is-floating' ) ).toBe( false );
		expect( popover.style.top ).toBe( '' );
	} );

	it( 'fixed mode opens ABOVE near the viewport bottom (exact top)', () => {
		controller.destroy();
		host.remove();
		mount( { position: 'fixed' } );
		trigger.getBoundingClientRect = () => ( {
			top: 700,
			bottom: 734,
			left: 500,
			right: 560,
			width: 60,
			height: 34,
		} );
		pointerClick( trigger );
		// below = 768-734 = 34 < menuHeight(0)+inset(8)? 34 < 8 is false ->
		// openAbove needs below < needed; with scrollHeight 0 it opens BELOW
		// clamped: top = min(768-0-8, 739) = 739.
		expect( popover.style.top ).toBe( '739px' );
		// Force a real menu height to trigger the flip.
		Object.defineProperty( popover, 'scrollHeight', {
			value: 200,
			configurable: true,
		} );
		pointerClick( trigger ); // close
		pointerClick( trigger ); // reopen with height 200
		// below(34) < 200+8 and above(700) > below -> open above:
		// top = max(8, 700-200-5) = 495.
		expect( popover.style.top ).toBe( '495px' );
	} );

	it( 'fixed mode clamps left to the viewport inset and honors RTL', () => {
		controller.destroy();
		host.remove();
		mount( { position: 'fixed' } );
		// Near the left edge: preferredLeft = right-196 = -96 -> clamp to 8.
		trigger.getBoundingClientRect = () => ( {
			top: 100,
			bottom: 134,
			left: 40,
			right: 100,
			width: 60,
			height: 34,
		} );
		pointerClick( trigger );
		expect( popover.style.left ).toBe( '8px' );
		pointerClick( trigger ); // close
		// RTL flips the preferred edge: left = rect.left (still in range).
		root.style.direction = 'rtl';
		trigger.getBoundingClientRect = () => ( {
			top: 100,
			bottom: 134,
			left: 300,
			right: 360,
			width: 60,
			height: 34,
		} );
		pointerClick( trigger );
		expect( popover.style.left ).toBe( '300px' );
	} );

	it( 'destroy removes listeners', () => {
		controller.destroy();
		pointerClick( trigger );
		expect( popover.hidden ).toBe( true );
	} );
} );

/**
 * K-021 — fixed mode inside a CSS containing block.
 *
 * `transform`, `filter`, `contain: layout` and friends on ANY ancestor make
 * that ancestor the containing block for `position: fixed` descendants, so
 * viewport coordinates land offset by its origin. `container-type` is the
 * interesting one: it implies layout containment, yet Chromium 149 does NOT
 * reparent for it (verified in a real browser, 2026-07-25). createMenu
 * therefore nominates a candidate from computed style and then MEASURES
 * whether the engine agrees before correcting anything.
 *
 * jsdom has no layout, so these tests simulate the engine explicitly:
 * `simulateEngine()` decides where a fixed popover lands for a written
 * `left/top`, which lets one fixture cover both engine behaviors.
 *
 * Fixture geometry (jsdom viewport 1024x768, popover.scrollHeight = 0 and
 * offsetWidth = 0 -> menuWidth falls back to 196, so every number is exact):
 *
 *   trigger  top 100 / bottom 134 / left 500 / right 560
 *   -> viewport placement: top = 134 + 5 = 139, left = 560 - 196 = 364
 *   shell    top 60 / left 120 (padding-box origin when it has no border)
 *   -> contained placement: top = 139 - 60 = 79, left = 364 - 120 = 244
 */
describe( 'createMenu — fixed mode inside a containing block', () => {
	const TRIGGER = rect( 100, 500, 34, 60 );
	const SHELL = rect( 60, 120, 640, 880 );
	/* The inner wrapper sits INSIDE the shell, at a different origin — that
	   difference is what makes the two-ancestor case falsifiable. */
	const INNER = rect( 200, 300, 400, 600 );

	/**
	 * Teaches the fixture where a `position: fixed` popover actually lands.
	 *
	 * Written `left/top` are coordinates in the containing block's own space,
	 * so the engine maps them through that block's matrix before painting.
	 * The model is a GENERAL affine map, written the way CSS does it —
	 * `matrix( a, b, c, d, e, f )` sends `( x, y )` to
	 * `( a·x + c·y + e, b·x + d·y + f )` — so scale, rotation, skew and any
	 * hand-written matrix can be asserted honestly instead of being flattened
	 * into a translation that would hide the coordinate-system guard.
	 *
	 * @param {Object}   engine
	 * @param {number}   [engine.originX] Containing-block origin (0 = viewport).
	 * @param {number}   [engine.originY] Containing-block origin (0 = viewport).
	 * @param {number}   [engine.shiftX]  Extra shift the kit can't undo (margin,
	 *                                    the popover's own transform, …).
	 * @param {number}   [engine.shiftY]  Same, vertical.
	 * @param {number}   [engine.scale]   Containing-block scale factor.
	 * @param {number}   [engine.rotate]  Containing-block rotation, degrees.
	 * @param {number[]} [engine.matrix]  Explicit `[ a, b, c, d ]`, overriding
	 *                                    scale/rotate — for skew and the
	 *                                    diagonal-preserving falsification.
	 */
	function simulateEngine( {
		originX = 0,
		originY = 0,
		shiftX = 0,
		shiftY = 0,
		scale = 1,
		rotate = 0,
		matrix = null,
	} = {} ) {
		const radians = ( rotate * Math.PI ) / 180;
		const cos = Math.cos( radians );
		const sin = Math.sin( radians );
		const [ a, b, c, d ] = matrix || [
			scale * cos,
			scale * sin,
			-scale * sin,
			scale * cos,
		];
		popover.getBoundingClientRect = () => {
			const x = parseFloat( popover.style.left || 0 );
			const y = parseFloat( popover.style.top || 0 );
			const left = originX + shiftX + ( a * x ) + ( c * y );
			const top = originY + shiftY + ( b * x ) + ( d * y );
			return {
				left,
				top,
				right: left + 196,
				bottom: top,
				width: 196,
				height: 0,
			};
		};
	}

	/**
	 * Opens the fixed menu against the standard fixture.
	 *
	 * @param {string} shellStyle Inline style for the outer wrapper.
	 * @param {Object} [setup]    `engine` (see simulateEngine), `innerStyle`,
	 *                            `popoverStyle` + rect overrides.
	 * @return {{top:number, left:number}} Written popover coordinates (px).
	 */
	function openFixedIn( shellStyle, setup = {} ) {
		remount( { position: 'fixed' }, shellStyle, setup.innerStyle || '' );
		trigger.getBoundingClientRect = setup.trigger || TRIGGER;
		shell.getBoundingClientRect = setup.shell || SHELL;
		inner.getBoundingClientRect = setup.inner || INNER;
		if ( setup.popoverStyle ) {
			popover.setAttribute( 'style', setup.popoverStyle );
		}
		simulateEngine( setup.engine );
		pointerClick( trigger );
		return {
			top: parseFloat( popover.style.top ),
			left: parseFloat( popover.style.left ),
		};
	}

	/* The engine that reparents onto the standard shell at (120, 60). */
	const REPARENTED = { originX: 120, originY: 60 };

	it( 'uncontained: coordinates stay in viewport space (pre-K-021 numbers)', () => {
		expect( openFixedIn( '' ) ).toEqual( { top: 139, left: 364 } );
	} );

	it( 'transform ancestor: coordinates resolve against the container', () => {
		expect(
			openFixedIn( 'transform: translateZ(0);', {
				engine: REPARENTED,
			} ),
		).toEqual( { top: 79, left: 244 } );
	} );

	it( 'container-type ancestor: corrected only when the engine reparents', () => {
		// Chromium 149 keeps fixed descendants on the viewport here — the
		// candidate is nominated, the measurement rejects it, and the popover
		// keeps the coordinates it already had. Correcting on the property
		// alone would have moved a menu that was never broken.
		expect( openFixedIn( 'container-type: inline-size;' ) ).toEqual( {
			top: 139,
			left: 364,
		} );
		// An engine that follows the containment spec gets the correction.
		expect(
			openFixedIn( 'container-type: inline-size;', {
				engine: REPARENTED,
			} ),
		).toEqual( { top: 79, left: 244 } );
	} );

	/*
	 * K-021 round 2 — the two-ancestor chain, proven in Aponto's adoption run.
	 *
	 * Real DOM: a fixed row-action menu inside `.pmdk-data-table`
	 * (`container-type: inline-size`, which Chromium does NOT reparent for),
	 * inside a shell wrapper carrying `transform: translateY(5px)` (which it
	 * DOES). The innermost candidate is the table; the actual containing block
	 * is the shell above it. A search that stopped at the first candidate
	 * rejected the table's origin and applied no correction at all, leaving
	 * every menu off by the transform ancestor's origin.
	 */
	it( 'skips a nominated ancestor the engine did NOT reparent to, and keeps walking', () => {
		expect(
			openFixedIn( 'transform: translateY(5px);', {
				innerStyle: 'container-type: inline-size;',
				// The engine reparented onto the SHELL (120, 60), not the
				// inner container-query wrapper at (300, 200).
				engine: REPARENTED,
			} ),
		).toEqual( { top: 79, left: 244 } );
	} );

	it( 'adopts the INNER candidate when that is the one the engine used', () => {
		// Mirror image: both ancestors nominate, but the engine reparented onto
		// the inner one, so innermost-first must win rather than the outer.
		expect(
			openFixedIn( 'transform: translateY(5px);', {
				innerStyle: 'transform: translateZ(0);',
				engine: { originX: 300, originY: 200 },
			} ),
		).toEqual( { top: 139 - 200, left: 364 - 300 } );
	} );

	it( 'still gives up when NO candidate in the chain matches', () => {
		// Two nominated ancestors, engine origin belongs to neither (a popover
		// carrying its own transform looks like this) — fall back, don't guess.
		expect(
			openFixedIn( 'transform: translateY(5px);', {
				innerStyle: 'container-type: inline-size;',
				engine: { originX: 777, originY: 555 },
			} ),
		).toEqual( { top: 139, left: 364 } );
	} );

	it( 'probes once for the whole chain, not once per candidate', () => {
		// The probe measures where the popover LANDS, so it is
		// candidate-independent: two nominated ancestors must still cost a
		// single probe. Counted via the transition suppression that wraps each
		// probeFixedFrame() call exactly once (the three probe points
		// themselves write `left: 0px` twice, so those are not a clean proxy).
		remount( { position: 'fixed' }, 'transform: translateY(5px);', 'container-type: inline-size;' );
		trigger.getBoundingClientRect = TRIGGER;
		shell.getBoundingClientRect = SHELL;
		inner.getBoundingClientRect = INNER;
		simulateEngine( REPARENTED );
		let probes = 0;
		const style = popover.style;
		const originalSetProperty = style.setProperty.bind( style );
		Object.defineProperty( popover, 'style', {
			configurable: true,
			value: new Proxy( style, {
				set( target, prop, value ) {
					if ( prop === 'transition' && value === 'none' ) {
						probes++;
					}
					target[ prop ] = value;
					return true;
				},
				get( target, prop ) {
					if ( prop === 'setProperty' ) {
						return originalSetProperty;
					}
					const value = target[ prop ];
					return typeof value === 'function'
						? value.bind( target )
						: value;
				},
			} ),
		} );
		pointerClick( trigger );
		expect( probes ).toBe( 1 );
	} );

	it( 'the popover lands at the SAME viewport position, contained or not', () => {
		// Re-adding the containing-block origin must reproduce the uncontained
		// answer exactly — the menu is glued to its trigger whatever the
		// ancestor does. This is the anti-regression contract: consumers see
		// one placement, not two.
		const baseline = openFixedIn( '' );
		expect( baseline ).toEqual( { top: 139, left: 364 } );
		for ( const style of [
			'transform: translateZ(0);',
			'contain: layout;',
			'filter: blur(2px);',
		] ) {
			const { top, left } = openFixedIn( style, { engine: REPARENTED } );
			expect( { style, top: top + 60, left: left + 120 } ).toEqual( {
				style,
				...baseline,
			} );
		}
	} );

	it( 'nominates every containing-block-forming style', () => {
		// Nomination + acceptance under an engine that translates. The styles
		// that can BEND the coordinate system (scale, rotate) are asserted
		// separately below against the matrix they really produce — modelling
		// them as translations here would mask the guard.
		//
		// `backdrop-filter` runs the same code path but jsdom's CSS parser
		// drops the declaration, so it can't be asserted here.
		const styles = [
			'container-type: inline-size;',
			'container-type: size;',
			'transform: translateZ(0);',
			'perspective: 100px;',
			'filter: blur(2px);',
			'contain: layout;',
			'contain: layout style;',
			'contain: strict;',
			'contain: content;',
			'content-visibility: auto;',
			'will-change: transform;',
			'will-change: opacity, filter;',
		];
		for ( const style of styles ) {
			expect( {
				style,
				...openFixedIn( style, { engine: REPARENTED } ),
			} ).toEqual( { style, top: 79, left: 244 } );
		}
	} );

	it( 'accepts a translated containing block (still a pure translation)', () => {
		// `translate: 10px` moves the block itself, so its rect AND the origin
		// the popover lands on are both (130, 60) — and writing N px still
		// moves the popover N px, so the correction stays exact.
		expect(
			openFixedIn( 'translate: 10px;', {
				shell: rect( 60, 130, 640, 880 ),
				engine: { originX: 130, originY: 60 },
			} ),
		).toEqual( { top: 79, left: 364 - 130 } );
	} );

	it( 'REJECTS a scaled containing block — a subtraction cannot undo it', () => {
		// transform: scale(0.9) with the origin still at (120, 60): the origin
		// check alone would pass, but 100px written moves the popover 90px, so
		// subtracting the origin would leave the menu ~10% off its trigger.
		// Falling back = the pre-K-021 coordinates, i.e. no regression.
		expect(
			openFixedIn( 'transform: scale(0.9);', {
				engine: { ...REPARENTED, scale: 0.9 },
			} ),
		).toEqual( { top: 139, left: 364 } );
	} );

	it( 'REJECTS a rotated containing block', () => {
		// rotate: 3deg — written axes no longer line up with viewport axes.
		expect(
			openFixedIn( 'rotate: 3deg;', {
				engine: { ...REPARENTED, rotate: 3 },
			} ),
		).toEqual( { top: 139, left: 364 } );
	} );

	it( 'REJECTS a perspective-projected containing block', () => {
		// A 3D rendering context projects the popover: writing 100px moves it
		// by some other amount (modelled here as 1.25x).
		expect(
			openFixedIn( 'perspective: 200px;', {
				engine: { ...REPARENTED, scale: 1.25 },
			} ),
		).toEqual( { top: 139, left: 364 } );
	} );

	it( 'REJECTS a skewed containing block', () => {
		// skewX( 11deg ) = matrix( 1, 0, tan 11deg, 1, 0, 0 ): the x axis is
		// untouched, the y axis leans. A per-axis check catches the y axis.
		expect(
			openFixedIn( 'transform: skewX(11deg);', {
				engine: {
					...REPARENTED,
					matrix: [ 1, 0, Math.tan( ( 11 * Math.PI ) / 180 ), 1 ],
				},
			} ),
		).toEqual( { top: 139, left: 364 } );
	} );

	it( 'REJECTS a matrix that preserves the diagonal but shears both axes', () => {
		// FALSIFICATION CASE for the single-diagonal probe this replaced.
		// matrix( 1.2, .2, -.2, .8 ) maps (100, 100) -> (100, 100) exactly, so
		// a probe that only sampled the diagonal accepted it and then applied
		// a translation-only correction it cannot use — the popover lands
		// (20, 20) off per 100px of offset. Probing the axes separately sees
		// (100, 0) -> (120, 20) and (0, 100) -> (-20, 80) and rejects.
		expect(
			openFixedIn( 'transform: matrix(1.2, 0.2, -0.2, 0.8, 0, 0);', {
				engine: { ...REPARENTED, matrix: [ 1.2, 0.2, -0.2, 0.8 ] },
			} ),
		).toEqual( { top: 139, left: 364 } );
	} );

	it( 'accepts an identity matrix — a translation is still a translation', () => {
		// The mirror of the case above: same code path, unsheared axes, so the
		// guard must NOT reject. Keeps the rejection tests honest.
		expect(
			openFixedIn( 'transform: matrix(1, 0, 0, 1, 0, 0);', {
				engine: { ...REPARENTED, matrix: [ 1, 0, 0, 1 ] },
			} ),
		).toEqual( { top: 79, left: 244 } );
	} );

	it( 'tolerates a sub-1% scale rather than falling back hundreds of px', () => {
		// PROBE_TOLERANCE is 1px over a 100px probe. scale(0.995) stays inside
		// it and keeps the correction: ~1px of drift beats the ~120px error of
		// rejecting. scale(0.97) is outside and falls back.
		expect(
			openFixedIn( 'transform: scale(0.995);', {
				engine: { ...REPARENTED, scale: 0.995 },
			} ),
		).toEqual( { top: 79, left: 244 } );
		expect(
			openFixedIn( 'transform: scale(0.97);', {
				engine: { ...REPARENTED, scale: 0.97 },
			} ),
		).toEqual( { top: 139, left: 364 } );
	} );

	it( 'ignores ancestors that do NOT reparent fixed descendants', () => {
		// No nomination -> no measurement -> the viewport numbers stand, even
		// though this fixture's engine would have reparented.
		const styles = [
			'position: relative;',
			'overflow: hidden;',
			'contain: style;',
			'contain: size;',
			'will-change: opacity;',
			'container-type: normal;',
			'transform: none;',
			'z-index: 5; isolation: isolate;',
		];
		for ( const style of styles ) {
			expect( {
				style,
				...openFixedIn( style, { engine: REPARENTED } ),
			} ).toEqual( { style, top: 139, left: 364 } );
		}
	} );

	it( 'the origin is the containing block PADDING box, not its border box', () => {
		// border-top 6 / border-left 4 -> the engine's origin is (124, 66).
		expect(
			openFixedIn(
				'transform: translateZ(0); border-top-width: 6px; border-left-width: 4px;',
				{ engine: { originX: 124, originY: 66 } },
			),
		).toEqual( { top: 139 - 66, left: 364 - 124 } );
	} );

	it( 'a margin on the popover survives the correction', () => {
		// The measurement sees origin + margin; the correction subtracts the
		// origin only, so the margin keeps shifting the popover as authored.
		expect(
			openFixedIn( 'transform: translateZ(0);', {
				popoverStyle: 'margin-left: 10px; margin-top: 4px;',
				engine: { ...REPARENTED, shiftX: 10, shiftY: 4 },
			} ),
		).toEqual( { top: 79, left: 244 } );
	} );

	it( 'refuses to guess when the popover carries its own offset', () => {
		// A transform/animation on the popover itself makes the landing point
		// unrecoverable by a single translation. Leaving the pre-K-021
		// coordinates alone beats inventing a wrong correction.
		expect(
			openFixedIn( 'transform: translateZ(0);', {
				engine: { ...REPARENTED, shiftX: 0, shiftY: 24 },
			} ),
		).toEqual( { top: 139, left: 364 } );
	} );

	it( 're-resolves the containing block on the next open', () => {
		openFixedIn( 'transform: translateZ(0);', { engine: REPARENTED } );
		expect( popover.style.top ).toBe( '79px' );
		// Consumer drops the transform (breakpoint, feature toggle) and the
		// engine stops reparenting: back to viewport coordinates, which also
		// proves close() released the cached block.
		pointerClick( trigger ); // close
		shell.removeAttribute( 'style' );
		simulateEngine();
		pointerClick( trigger ); // reopen
		expect( popover.style.top ).toBe( '139px' );
		expect( popover.style.left ).toBe( '364px' );
	} );

	it( 'tracks the trigger while a contained popover scrolls with its block', () => {
		openFixedIn( 'transform: translateZ(0);', { engine: REPARENTED } );
		expect( popover.style.top ).toBe( '79px' );
		// Page scrolls 40px: both the trigger and its containing block move up
		// together, so the LOCAL offset must not drift.
		trigger.getBoundingClientRect = rect( 60, 500, 34, 60 );
		shell.getBoundingClientRect = rect( 20, 120, 640, 880 );
		window.dispatchEvent( new Event( 'scroll' ) );
		expect( popover.style.top ).toBe( '79px' );
		expect( popover.style.left ).toBe( '244px' );
	} );

	it( 'leaves the popover inline styles clean after close', () => {
		// The measurement writes `left/top` before restoring them — a close
		// must still leave the popover with no inline coordinates at all.
		openFixedIn( 'transform: translateZ(0);', { engine: REPARENTED } );
		pointerClick( trigger );
		expect( popover.style.left ).toBe( '' );
		expect( popover.style.top ).toBe( '' );
	} );
} );
