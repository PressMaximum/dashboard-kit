/*
 * ---------------------------------------------------------------------------
 * Fixed-position containing blocks (K-021)
 * ---------------------------------------------------------------------------
 *
 * A `position: fixed` box resolves `left/top` against the viewport ONLY while
 * no ancestor establishes a containing block for it. An ancestor that does
 * takes that job over, and the coordinates resolve against ITS padding box —
 * so a menu positioned from `getBoundingClientRect()` lands offset by the
 * ancestor's origin, sometimes hundreds of pixels away.
 *
 * The candidates below are the styles that reparent fixed descendants per CSS
 * Position 3 §2.2 / CSS Contain 2 §3 / CSS Will Change 1 §3. The list is
 * deliberately a SUPERSET, because engines do not agree with the spec text or
 * with each other — measured on Chromium 149, 2026-07-25:
 *
 *   reparents: contain layout|paint|content|strict · transform · translate ·
 *              rotate · scale · perspective · filter · backdrop-filter ·
 *              content-visibility:auto · will-change:(transform|filter|contain)
 *   does NOT:  container-type: inline-size|size  ← despite implying layout
 *              containment, Chromium keeps fixed descendants on the viewport
 *
 * A property list alone would therefore MIS-correct a container-query shell on
 * Chromium while under-correcting somewhere else. So the list only nominates a
 * candidate; `resolveContainingBlock()` then probes the engine at three points
 * — the origin and both basis vectors — and accepts the candidate only when
 * the popover starts at its padding-box origin AND each axis moves 1:1 with
 * what is written. An affine map is fixed by exactly those three images, so
 * anything but a pure translation (scale, rotation, skew, 3D projection) is
 * rejected rather than half-corrected by a subtraction that cannot undo it.
 * No candidate (the overwhelmingly common case) means no probe, no
 * correction, and byte-identical coordinates.
 */

const CONTAINMENT_LAYOUT = /\b(?:strict|content|layout|paint)\b/;
const CONTAINING_WILL_CHANGE =
	/\b(?:transform|translate|rotate|scale|perspective|filter|backdrop-filter|contain|content-visibility)\b/;
/*
 * Basis-probe distance, and the slack allowed on every probe comparison
 * (origin and each axis independently). 1px over 100px tolerates a ~1% scale,
 * which leaves a few px of drift on a typical menu offset — versus the
 * HUNDREDS of px of error that rejecting (and keeping the uncorrected
 * coordinates) costs. Leaning permissive here is the cheaper mistake.
 */
const PROBE_OFFSET = 100;
const PROBE_TOLERANCE = 1;
/* Properties whose mere presence may reparent fixed descendants. */
const CONTAINING_PROPERTIES = [
	'transform',
	'translate',
	'rotate',
	'scale',
	'perspective',
	'filter',
	'backdrop-filter',
	'-webkit-backdrop-filter',
	'container-type',
];

/**
 * Reads a computed property and reports whether it holds a non-initial value.
 *
 * Unsupported properties come back as `''` (older engines, jsdom) — treated
 * as "not set" so detection degrades to the pre-K-021 behavior rather than
 * mis-anchoring.
 *
 * @param {CSSStyleDeclaration} style Computed style of the ancestor.
 * @param {string}              prop  CSS property name.
 * @return {boolean} True when the property carries a real value.
 */
function isStyleSet( style, prop ) {
	const value = style.getPropertyValue( prop );
	return !! value && value !== 'none' && value !== 'normal';
}

/**
 * `content-visibility` values that imply layout + paint containment.
 *
 * @param {CSSStyleDeclaration} style Computed style.
 * @return {boolean} True for `auto` / `hidden`.
 */
function isContentVisibilityHidden( style ) {
	const value = style.getPropertyValue( 'content-visibility' );
	return value === 'auto' || value === 'hidden';
}

/**
 * Reads a computed length in px.
 *
 * @param {CSSStyleDeclaration} style Computed style.
 * @param {string}              prop  CSS property name.
 * @return {number} Pixel value, 0 when absent or non-numeric.
 */
function cssLength( style, prop ) {
	return parseFloat( style.getPropertyValue( prop ) ) || 0;
}

/**
 * Whether an element MAY be a containing block for fixed descendants.
 *
 * Nomination only — see the K-021 note: the engine gets the final say.
 *
 * @param {CSSStyleDeclaration} style Computed style of the candidate ancestor.
 * @return {boolean} True when fixed descendants may resolve against it.
 */
function establishesFixedContainingBlock( style ) {
	if ( CONTAINING_PROPERTIES.some( ( prop ) => isStyleSet( style, prop ) ) ) {
		return true;
	}
	if ( CONTAINMENT_LAYOUT.test( style.getPropertyValue( 'contain' ) ) ) {
		return true;
	}
	if ( isContentVisibilityHidden( style ) ) {
		return true;
	}
	return CONTAINING_WILL_CHANGE.test( style.getPropertyValue( 'will-change' ) );
}

/**
 * Walks up from `el` to the first ancestor that may contain fixed descendants.
 *
 * @param {HTMLElement} el   The element that will be `position: fixed`.
 * @param {Window}      view The window whose `getComputedStyle` to use.
 * @return {HTMLElement|null} The containing block, or null for the viewport.
 */
function findFixedContainingBlock( el, view ) {
	if ( typeof view?.getComputedStyle !== 'function' ) {
		return null;
	}
	let node = el.parentElement;
	while ( node ) {
		if ( establishesFixedContainingBlock( view.getComputedStyle( node ) ) ) {
			return node;
		}
		node = node.parentElement;
	}
	return null;
}

/**
 * Headless menu/popover controller (KIT-P3 slice 3 — the G4 primitive).
 *
 * Framework-agnostic port of the interaction model the Aponto BookingsTable
 * implements per-component (row-action kebab, status picker, table actions
 * menu): trigger toggling with `aria-expanded`, keyboard-open focusing the
 * first item, roving menu keys, Escape-with-focus-return, outside-pointerdown
 * dismiss and open-direction handling. Shipping it once means a product table
 * (B4 swap) doesn't re-write ~200 lines of popover behavior per menu.
 *
 * DOM contract (chrome from `primitives/style.css` — status/column-manager/
 * toolbar popover families):
 *
 *   <div class="…" data-menu>
 *     <button data-menu-trigger aria-haspopup="menu" aria-expanded="false">…</button>
 *     <div class="pmdk-row-action-menu" role="menu" hidden>
 *       <button role="menuitem">…</button>
 *       <div role="separator"></div>
 *       <button role="menuitemradio" aria-checked="false">…</button>
 *     </div>
 *   </div>
 *
 * Behaviors (sources: BookingsTable.jsx BookingRowActions / StatusControl /
 * BookingActionsMenu + menuRovingKeydown):
 *   - trigger click toggles; `event.detail === 0` (keyboard) marks the open
 *     so the first enabled item receives focus on the next frame,
 *   - ArrowDown/ArrowUp/Home/End rove `[role=menuitem]`/`[role=menuitemradio]`,
 *   - Escape closes and returns focus to the trigger,
 *   - pointerdown outside the root closes (no focus steal),
 *   - item activation calls `onSelect` then closes; keyboard activation
 *     returns focus to the trigger (pointer activation leaves focus alone),
 *   - `position: 'anchored'` (default) toggles `.opens-up` on the root when
 *     the space below the trigger can't fit the popover (CSS anchors it),
 *   - `position: 'fixed'` ports the floating row-action mode: viewport-clamped
 *     `left/top` coordinates, `.is-floating` class, tracking scroll + resize.
 *     Coordinates are translated into the popover's containing block when an
 *     ancestor established one (K-021 — `transform` / `filter` / `contain`
 *     and friends), so the menu stays glued to its trigger there; the block
 *     is measured rather than assumed, and without one the translation is
 *     skipped and the numbers match the pre-K-021 output exactly.
 *
 * @param {HTMLElement}                           root                    The element containing trigger + popover.
 * @param {Object}                                [options]
 * @param {(item:HTMLElement, event:Event)=>void} [options.onSelect]      Item activation.
 * @param {(open:boolean)=>void}                  [options.onOpenChange]  Open-state observer.
 * @param {'anchored'|'fixed'}                    [options.position]      Positioning mode.
 * @param {number}                                [options.viewportInset] Clamp inset for fixed mode (default 8).
 * @return {{open:Function, close:Function, toggle:Function, isOpen:Function, destroy:Function}} Menu controller.
 */
export function createMenu( root, options = {} ) {
	if ( ! root ) {
		throw new Error( 'createMenu: root element is required' );
	}
	const trigger = root.querySelector( '[data-menu-trigger]' );
	const popover = root.querySelector(
		'[role="menu"],[role="listbox"],[data-menu-popover]',
	);
	if ( ! trigger || ! popover ) {
		throw new Error(
			'createMenu: root must contain [data-menu-trigger] and a [role="menu"] (or [data-menu-popover]) element',
		);
	}

	const onSelect = options.onSelect || ( () => {} );
	const onOpenChange = options.onOpenChange || ( () => {} );
	const position = options.position || 'anchored';
	const viewportInset = options.viewportInset ?? 8;
	const view = root.ownerDocument?.defaultView || window;

	let openedByKeyboard = false;
	/*
	 * Fixed mode only. Resolved once per open — containment can't appear or
	 * vanish while the menu is on screen — and re-resolved on resize, where a
	 * breakpoint could have changed it. The RECT is re-read on every reposition
	 * instead: a contained popover scrolls with its block.
	 */
	let containingBlock = null;

	/**
	 * Probes how the engine maps written `left/top` onto the viewport.
	 *
	 * Three points, because the correction that follows is a plain subtraction
	 * and only a TRANSLATION can be undone that way:
	 *
	 *   - `left/top: 0` gives the origin. (0, 0) means the popover is still
	 *     laid out against the viewport; anything else is its containing
	 *     block's origin, plus the popover's own margin (caller's business).
	 *   - `( PROBE_OFFSET, 0 )` and `( 0, PROBE_OFFSET )` give the images of
	 *     the two basis vectors. An affine map is fixed by the origin plus
	 *     both basis images, so if all three land where they were written the
	 *     mapping IS a pure translation — nothing can slip through.
	 *
	 * Probing the axes SEPARATELY is the point. One diagonal probe at
	 * `( N, N )` is not enough: `matrix( 1.2, .2, -.2, .8, 0, 0 )` maps
	 * (100, 100) onto itself while shearing both axes, so it would false-pass
	 * and then get a translation-only correction it cannot use.
	 *
	 * Measuring beats reading `getComputedStyle( candidate ).transform`: the
	 * mapping can also come from a transformed ancestor ABOVE the candidate,
	 * from a 3D rendering context, or from page zoom — none of which show up
	 * on the candidate's own `transform`. This is the same engine-over-
	 * inference principle the origin check uses, for two extra rect reads.
	 *
	 * @return {{x:number, y:number, translational:boolean}} Fixed-origin
	 *   viewport coordinates plus whether the mapping is a pure translation.
	 */
	function probeFixedFrame() {
		const previousLeft = popover.style.left;
		const previousTop = popover.style.top;
		/* Reading the rect flushes style — don't let that start a transition
		   on a consumer popover that animates its coordinates. */
		const previousTransition = popover.style.transition;
		popover.style.transition = 'none';
		const probeAt = ( x, y ) => {
			popover.style.left = `${ x }px`;
			popover.style.top = `${ y }px`;
			return popover.getBoundingClientRect();
		};
		const origin = probeAt( 0, 0 );
		const alongX = probeAt( PROBE_OFFSET, 0 );
		const alongY = probeAt( 0, PROBE_OFFSET );
		popover.style.left = previousLeft;
		popover.style.top = previousTop;
		popover.style.transition = previousTransition;
		const landedAt = ( box, x, y ) =>
			Math.abs( box.left - origin.left - x ) <= PROBE_TOLERANCE &&
			Math.abs( box.top - origin.top - y ) <= PROBE_TOLERANCE;
		return {
			x: origin.left,
			y: origin.top,
			translational:
				landedAt( alongX, PROBE_OFFSET, 0 ) &&
				landedAt( alongY, 0, PROBE_OFFSET ),
		};
	}

	/* Nominate a containing block, then let the engine confirm or reject it. */
	function resolveContainingBlock() {
		containingBlock = null;
		const el = findFixedContainingBlock( popover, view );
		if ( ! el ) {
			return;
		}
		const style = view.getComputedStyle( el );
		const borderLeft = cssLength( style, 'border-left-width' );
		const borderTop = cssLength( style, 'border-top-width' );
		const box = el.getBoundingClientRect();
		const popoverStyle = view.getComputedStyle( popover );
		const frame = probeFixedFrame();
		/*
		 * Two engine-truthful rejections, both falling back to the pre-K-021
		 * coordinates — no correction beats a wrong one:
		 *
		 * 1. the mapping isn't a pure translation (scaled / rotated / 3D
		 *    containing block), so subtracting an origin cannot undo it;
		 * 2. the origin isn't the candidate's padding box — Chromium does NOT
		 *    reparent for `container-type`, and a popover carrying its own
		 *    transform lands somewhere we can't attribute to the candidate.
		 */
		if (
			! frame.translational ||
			Math.abs(
				frame.x -
					box.left -
					borderLeft -
					cssLength( popoverStyle, 'margin-left' ),
			) > PROBE_TOLERANCE ||
			Math.abs(
				frame.y -
					box.top -
					borderTop -
					cssLength( popoverStyle, 'margin-top' ),
			) > PROBE_TOLERANCE
		) {
			return;
		}
		containingBlock = { el, borderLeft, borderTop };
	}

	const isOpen = () => ! popover.hidden;
	const itemEls = () =>
		[
			...popover.querySelectorAll(
				'[role="menuitem"],[role="menuitemradio"]',
			),
		].filter( ( item ) => ! item.disabled );

	function focusFirstItem() {
		window.requestAnimationFrame( () => itemEls()[ 0 ]?.focus() );
	}

	/* Anchored mode: flip above when the popover doesn't fit below. */
	function positionAnchored() {
		const rect = trigger.getBoundingClientRect();
		const needed = popover.scrollHeight + viewportInset;
		const below = view.innerHeight - rect.bottom;
		const above = rect.top;
		root.classList.toggle( 'opens-up', below < needed && above > below );
	}

	/* Fixed mode: viewport-clamped coordinates (BookingRowActions port). */
	function positionFixed() {
		const rect = trigger.getBoundingClientRect();
		const menuHeight = popover.scrollHeight;
		const menuWidth = popover.offsetWidth || 196;
		const openAbove =
			view.innerHeight - rect.bottom < menuHeight + viewportInset &&
			rect.top > view.innerHeight - rect.bottom;
		let top;
		if ( openAbove ) {
			top = Math.max( viewportInset, rect.top - menuHeight - 5 );
		} else {
			top = Math.min(
				view.innerHeight - menuHeight - viewportInset,
				rect.bottom + 5,
			);
		}
		const isRtl = view.getComputedStyle( root ).direction === 'rtl';
		const preferredLeft = isRtl ? rect.left : rect.right - menuWidth;
		let left = Math.max(
			viewportInset,
			Math.min( view.innerWidth - menuWidth - viewportInset, preferredLeft ),
		);
		/*
		 * `top`/`left` are viewport coordinates. Re-express them in the
		 * popover's confirmed containing block (K-021) — its padding-box
		 * origin, re-read every time because a contained popover scrolls with
		 * its block. Without a confirmed block this is skipped entirely and
		 * the arithmetic above is what reaches the DOM, unchanged.
		 */
		if ( containingBlock ) {
			const box = containingBlock.el.getBoundingClientRect();
			left -= box.left + containingBlock.borderLeft;
			top -= box.top + containingBlock.borderTop;
		}
		popover.style.left = `${ left }px`;
		popover.style.top = `${ top }px`;
	}

	function reposition() {
		if ( position === 'fixed' ) {
			positionFixed();
		} else {
			positionAnchored();
		}
	}

	/* A resize can move a breakpoint that adds/removes containment. */
	function onViewportResize() {
		if ( position === 'fixed' ) {
			resolveContainingBlock();
		}
		reposition();
	}

	function open() {
		if ( isOpen() ) {
			return;
		}
		popover.hidden = false;
		trigger.setAttribute( 'aria-expanded', 'true' );
		if ( position === 'fixed' ) {
			popover.classList.add( 'is-floating' );
			resolveContainingBlock();
			view.addEventListener( 'scroll', reposition, true );
			view.addEventListener( 'resize', onViewportResize );
		}
		reposition();
		if ( openedByKeyboard ) {
			focusFirstItem();
		}
		onOpenChange( true );
	}

	function close( { returnFocus = false } = {} ) {
		if ( ! isOpen() ) {
			return;
		}
		popover.hidden = true;
		trigger.setAttribute( 'aria-expanded', 'false' );
		root.classList.remove( 'opens-up' );
		if ( position === 'fixed' ) {
			popover.classList.remove( 'is-floating' );
			popover.style.left = '';
			popover.style.top = '';
			/* Drop the element reference — the block may be unmounted next. */
			containingBlock = null;
			view.removeEventListener( 'scroll', reposition, true );
			view.removeEventListener( 'resize', onViewportResize );
		}
		openedByKeyboard = false;
		if ( returnFocus ) {
			window.requestAnimationFrame( () =>
				trigger.focus( { preventScroll: true } ),
			);
		}
		onOpenChange( false );
	}

	function toggle() {
		if ( isOpen() ) {
			close();
		} else {
			open();
		}
	}

	// --- listeners ---------------------------------------------------------
	function onTriggerClick( event ) {
		openedByKeyboard = event.detail === 0;
		event.preventDefault();
		event.stopPropagation();
		toggle();
	}

	/*
	 * Roving focus (Arrow Up/Down, Home, End) — menuRovingKeydown port.
	 */
	function onPopoverKeydown( event ) {
		const items = itemEls();
		if (
			! items.length ||
			! [ 'ArrowDown', 'ArrowUp', 'Home', 'End' ].includes( event.key )
		) {
			return;
		}
		event.preventDefault();
		const index = items.indexOf(
			event.currentTarget.ownerDocument.activeElement,
		);
		let target;
		if ( event.key === 'Home' ) {
			target = items[ 0 ];
		} else if ( event.key === 'End' ) {
			target = items[ items.length - 1 ];
		} else if ( event.key === 'ArrowDown' ) {
			target =
				items[ Math.min( index + 1, items.length - 1 ) ] ||
				items[ 0 ];
		} else {
			target = items[ Math.max( index, 0 ) - 1 ] || items[ 0 ];
		}
		target?.focus();
	}

	function onRootKeydown( event ) {
		if ( event.key !== 'Escape' || ! isOpen() ) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		close( { returnFocus: true } );
	}

	function onPopoverClick( event ) {
		const item = event.target.closest(
			'[role="menuitem"],[role="menuitemradio"]',
		);
		if ( ! item || item.disabled ) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		onSelect( item, event );
		// Keyboard activation would drop focus with the popover — hand it
		// back to the trigger; pointer users keep their pointer context.
		close( { returnFocus: event.detail === 0 } );
	}

	function onDocumentPointerDown( event ) {
		if ( isOpen() && ! root.contains( event.target ) ) {
			close();
		}
	}

	trigger.addEventListener( 'click', onTriggerClick );
	popover.addEventListener( 'keydown', onPopoverKeydown );
	popover.addEventListener( 'click', onPopoverClick );
	root.addEventListener( 'keydown', onRootKeydown );
	const doc = root.ownerDocument || document;
	doc.addEventListener( 'pointerdown', onDocumentPointerDown );

	if ( ! trigger.hasAttribute( 'aria-haspopup' ) ) {
		trigger.setAttribute( 'aria-haspopup', 'menu' );
	}
	if ( ! trigger.hasAttribute( 'aria-expanded' ) ) {
		trigger.setAttribute( 'aria-expanded', 'false' );
	}

	return {
		open,
		close,
		toggle,
		isOpen,
		destroy() {
			trigger.removeEventListener( 'click', onTriggerClick );
			popover.removeEventListener( 'keydown', onPopoverKeydown );
			popover.removeEventListener( 'click', onPopoverClick );
			root.removeEventListener( 'keydown', onRootKeydown );
			doc.removeEventListener( 'pointerdown', onDocumentPointerDown );
			if ( position === 'fixed' ) {
				containingBlock = null;
				view.removeEventListener( 'scroll', reposition, true );
				view.removeEventListener( 'resize', onViewportResize );
			}
		},
	};
}
