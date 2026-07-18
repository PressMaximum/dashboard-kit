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

	let openedByKeyboard = false;

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
		const below = window.innerHeight - rect.bottom;
		const above = rect.top;
		root.classList.toggle( 'opens-up', below < needed && above > below );
	}

	/* Fixed mode: viewport-clamped coordinates (BookingRowActions port). */
	function positionFixed() {
		const rect = trigger.getBoundingClientRect();
		const menuHeight = popover.scrollHeight;
		const menuWidth = popover.offsetWidth || 196;
		const openAbove =
			window.innerHeight - rect.bottom < menuHeight + viewportInset &&
			rect.top > window.innerHeight - rect.bottom;
		let top;
		if ( openAbove ) {
			top = Math.max( viewportInset, rect.top - menuHeight - 5 );
		} else {
			top = Math.min(
				window.innerHeight - menuHeight - viewportInset,
				rect.bottom + 5,
			);
		}
		const isRtl =
			( root.ownerDocument.defaultView || window ).getComputedStyle(
				root,
			).direction === 'rtl';
		const preferredLeft = isRtl ? rect.left : rect.right - menuWidth;
		const left = Math.max(
			viewportInset,
			Math.min(
				window.innerWidth - menuWidth - viewportInset,
				preferredLeft,
			),
		);
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

	function open() {
		if ( isOpen() ) {
			return;
		}
		popover.hidden = false;
		trigger.setAttribute( 'aria-expanded', 'true' );
		if ( position === 'fixed' ) {
			popover.classList.add( 'is-floating' );
			window.addEventListener( 'scroll', reposition, true );
			window.addEventListener( 'resize', reposition );
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
			window.removeEventListener( 'scroll', reposition, true );
			window.removeEventListener( 'resize', reposition );
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
				window.removeEventListener( 'scroll', reposition, true );
				window.removeEventListener( 'resize', reposition );
			}
		},
	};
}
