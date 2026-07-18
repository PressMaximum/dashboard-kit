/**
 * Headless in-flow inspector resizer (KIT-P3 slice 3).
 *
 * Port of the design-system reference resizer (~90 lines,
 * `[data-ds-resizable-inspector]` in `design-system.js`) onto the kit's
 * `.pmdk-inflow-*` chrome. Behavior contract (DESIGN-SYSTEM "Drawer versus
 * in-flow inspector"):
 *
 *   - pointer drag resizes; ArrowLeft/ArrowRight step by 16px; Home resets to
 *     the default width; End jumps to the max,
 *   - the separator exposes `aria-valuemin/-valuemax/-valuenow`,
 *   - the preference persists in namespaced localStorage (default key
 *     `dashboard-kit.inspector-width.v1`); a temporary narrow viewport clamps
 *     only the RENDERED width and never overwrites the stored preference,
 *   - storage failure never blocks the interaction,
 *   - `is-resizing` on the workspace suppresses transitions while dragging.
 *
 * DOM contract (chrome from `primitives/style.css` — inspector.css):
 *
 *   <div class="pmdk-inflow-workspace is-inspecting">   ← workspace root
 *     <div class="pmdk-inflow-main">…</div>
 *     <div class="pmdk-inflow-resizer" role="separator" tabindex="0"
 *          aria-orientation="vertical" aria-label="Resize panel">
 *       <span aria-hidden="true"></span>
 *     </div>
 *     <aside class="pmdk-inflow-inspector">…</aside>    ← pane
 *   </div>
 *
 * The rendered width is written to a CSS custom property on the workspace
 * (default `--pmdk-inflow-inspector-width`, the chrome variable whose initial
 * value falls back to the token-tier `--pmdk-inspector-width`) — the
 * stylesheet consumes it.
 *
 * @param {HTMLElement}          workspace               The workspace root carrying the CSS var.
 * @param {Object}               [options]
 * @param {HTMLElement}          [options.handle]        Separator (default: `.pmdk-inflow-resizer` inside workspace).
 * @param {HTMLElement}          [options.pane]          Resized pane (default: `.pmdk-inflow-inspector` inside workspace).
 * @param {string}               [options.cssVar]        CSS custom property to write (default `--pmdk-inflow-inspector-width`).
 * @param {string}               [options.storageKey]    localStorage key ('' disables persistence; default `dashboard-kit.inspector-width.v1`).
 * @param {number}               [options.minWidth]      Pane minimum (default 320).
 * @param {number}               [options.maxWidth]      Pane hard maximum (default 520).
 * @param {number}               [options.mainMinWidth]  Main-content minimum preserved while resizing (default 360).
 * @param {number}               [options.defaultWidth]  Default/Home width (default 360).
 * @param {number}               [options.step]          Keyboard step (default 16).
 * @param {(width:number)=>void} [options.onWidthChange] Rendered-width observer.
 * @return {{setWidth:Function, getWidth:Function, refresh:Function, destroy:Function}} Resizer controller.
 */
export function createInspectorResizer( workspace, options = {} ) {
	if ( ! workspace ) {
		throw new Error(
			'createInspectorResizer: workspace element is required',
		);
	}
	const handle =
		options.handle || workspace.querySelector( '.pmdk-inflow-resizer' );
	const pane =
		options.pane || workspace.querySelector( '.pmdk-inflow-inspector' );
	if ( ! handle || ! pane ) {
		throw new Error(
			'createInspectorResizer: workspace must contain a handle (.pmdk-inflow-resizer) and a pane (.pmdk-inflow-inspector)',
		);
	}

	// The chrome variable (inspector.css consumes it); distinct from the
	// token-tier scalar `--pmdk-inspector-width`, which provides its default.
	const cssVar = options.cssVar || '--pmdk-inflow-inspector-width';
	const storageKey =
		options.storageKey !== undefined
			? options.storageKey
			: 'dashboard-kit.inspector-width.v1';
	const minWidth = options.minWidth ?? 320;
	const hardMaxWidth = options.maxWidth ?? 520;
	const mainMinWidth = options.mainMinWidth ?? 360;
	const defaultWidth = options.defaultWidth ?? 360;
	const step = options.step ?? 16;
	const onWidthChange = options.onWidthChange || ( () => {} );
	const valueEl = handle.querySelector( '[data-resizer-value]' );

	function readStoredWidth() {
		if ( ! storageKey ) {
			return defaultWidth;
		}
		try {
			const value = Number(
				window.localStorage.getItem( storageKey ),
			);
			return Number.isFinite( value ) && value > 0
				? Math.max( minWidth, Math.min( hardMaxWidth, value ) )
				: defaultWidth;
		} catch {
			return defaultWidth;
		}
	}
	function storeWidth( value ) {
		if ( ! storageKey ) {
			return;
		}
		try {
			window.localStorage.setItem( storageKey, String( value ) );
		} catch {
			/* storage unavailable — resizing still works for this view */
		}
	}

	let preferredWidth = readStoredWidth();

	function getBounds() {
		const available = Math.floor(
			workspace.getBoundingClientRect().width -
				mainMinWidth -
				handle.getBoundingClientRect().width,
		);
		return {
			min: minWidth,
			max: Math.max(
				minWidth,
				Math.min( hardMaxWidth, available ),
			),
		};
	}

	function getCurrentWidth() {
		return Math.round( pane.getBoundingClientRect().width );
	}

	/*
	 * Render a width (clamped to the CURRENT bounds); persist the requested
	 * value (clamped only to the hard min/max) when `persist` — so a narrow
	 * viewport clamps the render without overwriting the stored preference.
	 */
	function setWidth( value, persist = false ) {
		if ( persist ) {
			preferredWidth = Math.max(
				minWidth,
				Math.min( hardMaxWidth, Math.round( value ) ),
			);
			storeWidth( preferredWidth );
		}
		const bounds = getBounds();
		const width = Math.max(
			bounds.min,
			Math.min( bounds.max, Math.round( value ) ),
		);
		workspace.style.setProperty( cssVar, `${ width }px` );
		handle.setAttribute( 'aria-valuemin', String( bounds.min ) );
		handle.setAttribute( 'aria-valuemax', String( bounds.max ) );
		handle.setAttribute( 'aria-valuenow', String( width ) );
		if ( valueEl ) {
			valueEl.textContent = `${ width }px`;
		}
		onWidthChange( width );
		return width;
	}

	// --- pointer drag ------------------------------------------------------
	function onPointerDown( event ) {
		if ( event.button !== 0 ) {
			return;
		}
		event.preventDefault();
		const rtl =
			( workspace.ownerDocument.defaultView || window )
				.getComputedStyle( workspace ).direction === 'rtl';
		const startX = event.clientX;
		const startWidth = getCurrentWidth();
		workspace.classList.add( 'is-resizing' );
		workspace.ownerDocument.body.style.cursor = 'col-resize';

		function onMove( moveEvent ) {
			const delta = ( moveEvent.clientX - startX ) * ( rtl ? -1 : 1 );
			// Inspector sits at the inline end: dragging toward it shrinks.
			setWidth( startWidth - delta );
		}
		function onEnd() {
			setWidth( getCurrentWidth(), true );
			workspace.classList.remove( 'is-resizing' );
			workspace.ownerDocument.body.style.cursor = '';
			window.removeEventListener( 'pointermove', onMove );
			window.removeEventListener( 'pointerup', onEnd );
			window.removeEventListener( 'pointercancel', onEnd );
		}
		window.addEventListener( 'pointermove', onMove );
		window.addEventListener( 'pointerup', onEnd );
		window.addEventListener( 'pointercancel', onEnd );
	}

	// --- keyboard ----------------------------------------------------------
	function onKeydown( event ) {
		let nextWidth = getCurrentWidth();
		if ( event.key === 'ArrowLeft' ) {
			nextWidth += step;
		} else if ( event.key === 'ArrowRight' ) {
			nextWidth -= step;
		} else if ( event.key === 'Home' ) {
			nextWidth = defaultWidth;
		} else if ( event.key === 'End' ) {
			nextWidth = getBounds().max;
		} else {
			return;
		}
		event.preventDefault();
		setWidth( nextWidth, true );
	}

	const onWindowResize = () => setWidth( preferredWidth );

	handle.addEventListener( 'pointerdown', onPointerDown );
	handle.addEventListener( 'keydown', onKeydown );
	window.addEventListener( 'resize', onWindowResize );

	if ( ! handle.hasAttribute( 'aria-orientation' ) ) {
		handle.setAttribute( 'aria-orientation', 'vertical' );
	}
	setWidth( preferredWidth );

	return {
		setWidth,
		getWidth: getCurrentWidth,
		refresh: () => setWidth( preferredWidth ),
		destroy() {
			handle.removeEventListener( 'pointerdown', onPointerDown );
			handle.removeEventListener( 'keydown', onKeydown );
			window.removeEventListener( 'resize', onWindowResize );
		},
	};
}
