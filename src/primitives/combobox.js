/**
 * Headless combobox controller (KIT-P3 slice 1).
 *
 * Framework-agnostic: it attaches interaction behavior to existing markup and
 * never renders React. Ported from the mockup design system's relationship
 * picker (`design-system.js` `[data-ds-relationship-picker]` — the behavior
 * contract source) with the same interaction model:
 *
 *   - open on focus / pointerdown / typing / Enter / Arrow keys,
 *   - an option is ALWAYS active while open (the selected one, else the first
 *     visible), `aria-activedescendant` + `.is-active` kept in sync,
 *   - ArrowDown/ArrowUp move with wrap-around (modulo, no clamping),
 *   - pointerenter on an option makes it active (hover + keyboard in sync),
 *   - the input text is selected (`input.select()`) when the picker opens,
 *   - filter state resets when the picker closes,
 *   - outside pointerdown AND outside focusin dismiss.
 *
 * Documented deviations from that source (reasons, not drift):
 *   - Escape closes but KEEPS focus on the input — the source blurs, a
 *     gallery-demo shortcut; the ARIA APG combobox pattern keeps focus.
 *   - A typed exact match (case-insensitive) commits on dismiss, per the
 *     evolved booking-form combobox in `plugin-dashboard.js` — dropping a
 *     fully typed valid value on outside-click would be hostile.
 *   - Home/End jump to the first/last visible option; Tab closes with
 *     restore. Additive keyboard affordances, covered by tests.
 *
 * Markup contract (styled by `primitives/style.css` — `combobox.css`):
 *
 *   <div class="pmdk-combobox" data-combobox data-selected-value="">
 *     <label class="pmdk-compact-field pmdk-combobox-field">
 *       <input data-combobox-input role="combobox" aria-autocomplete="list"
 *              aria-expanded="false" aria-controls="listId" placeholder=" ">
 *       <span class="pmdk-compact-label">Label</span>
 *       <span class="pmdk-field-end-icon">…idle + active icons…</span>
 *     </label>
 *     <div class="pmdk-combobox-popover" id="listId" role="listbox" hidden>
 *       <button data-combobox-option="Value" role="option" aria-selected="false">Value</button>
 *       …
 *       <p data-combobox-empty hidden>No results</p>
 *     </div>
 *   </div>
 *
 * `buildComboboxMarkup()` below returns exactly this string so consumers need
 * not hand-write the ARIA scaffold.
 *
 * @param {HTMLElement}                                   root               The `.pmdk-combobox` element.
 * @param {Object}                                        [options]
 * @param {(value:string, option:HTMLElement|null)=>void} [options.onChange]
 *                                                                           Called after a committed selection change (value may be '').
 * @param {(option:HTMLElement, query:string)=>boolean}   [options.filter]
 *                                                                           Custom match predicate; defaults to substring over option text +
 *                                                                           `data-combobox-keywords`.
 * @return {{open:Function, close:Function, setOptions:Function, getValue:Function, refresh:Function, destroy:Function}} Combobox controller.
 */
export function createCombobox( root, options = {} ) {
	if ( ! root ) {
		throw new Error( 'createCombobox: root element is required' );
	}
	const input = root.querySelector( '[data-combobox-input]' );
	const popover = root.querySelector( '.pmdk-combobox-popover' );
	if ( ! input || ! popover ) {
		throw new Error(
			'createCombobox: root must contain [data-combobox-input] and .pmdk-combobox-popover',
		);
	}

	const onChange = options.onChange || ( () => {} );
	const matches =
		options.filter ||
		( ( option, query ) => {
			const hay = (
				option.dataset.comboboxKeywords ||
				option.dataset.comboboxOption ||
				option.textContent ||
				''
			).toLowerCase();
			return hay.includes( query );
		} );

	let activeEl = null;
	let suppressOpen = false;

	const optionEls = () => [
		...popover.querySelectorAll( '[data-combobox-option]' ),
	];
	const visibleEls = () => optionEls().filter( ( el ) => ! el.hidden );
	const emptyEl = () => popover.querySelector( '[data-combobox-empty]' );
	const isOpen = () => root.classList.contains( 'is-open' );
	const selectedValue = () => root.dataset.selectedValue || '';
	const selectedEl = () =>
		optionEls().find(
			( el ) => el.getAttribute( 'aria-selected' ) === 'true',
		);

	function setActive( el ) {
		optionEls().forEach( ( item ) =>
			item.classList.toggle( 'is-active', item === el ),
		);
		activeEl = el || null;
		if ( activeEl ) {
			if ( activeEl.id ) {
				input.setAttribute( 'aria-activedescendant', activeEl.id );
			}
			activeEl.scrollIntoView?.( { block: 'nearest' } );
		} else {
			input.removeAttribute( 'aria-activedescendant' );
		}
	}

	/*
	 * Filter + keep an option active: the current active one if it survived,
	 * else the first visible (source: design-system.js filterOptions).
	 */
	function filter( query = '' ) {
		const normalized = query.trim().toLowerCase();
		optionEls().forEach( ( el ) => {
			el.hidden = normalized !== '' && ! matches( el, normalized );
		} );
		const visible = visibleEls();
		const empty = emptyEl();
		if ( empty ) {
			empty.hidden = visible.length !== 0;
		}
		setActive(
			visible.includes( activeEl ) ? activeEl : visible[ 0 ] || null,
		);
	}

	function positionUp() {
		// Flip above when the field is closer to the viewport bottom than the
		// popover needs. Mirrors the booking-form combobox's `opens-up`.
		const fieldRect = root.getBoundingClientRect();
		const needed = Math.min( popover.scrollHeight, 220 ) + 8;
		const below = window.innerHeight - fieldRect.bottom;
		const above = fieldRect.top;
		root.classList.toggle( 'opens-up', below < needed && above > below );
	}

	function open() {
		if ( isOpen() || suppressOpen ) {
			return;
		}
		root.classList.add( 'is-open' );
		popover.hidden = false;
		input.setAttribute( 'aria-expanded', 'true' );
		// Open shows the full list with the committed selection active (or
		// the first option), and pre-selects the input text so typing
		// replaces it — source behavior.
		activeEl = selectedEl() || null;
		filter( '' );
		positionUp();
		window.requestAnimationFrame( () => input.select() );
	}

	function syncSelectedAria( el ) {
		optionEls().forEach( ( item ) =>
			item.setAttribute( 'aria-selected', String( item === el ) ),
		);
	}

	function commit( value, el ) {
		const changed = value !== selectedValue();
		root.dataset.selectedValue = value;
		input.value = value;
		syncSelectedAria( el || null );
		if ( changed ) {
			input.dispatchEvent( new Event( 'change', { bubbles: true } ) );
			onChange( value, el || null );
		}
	}

	function selectOption( option, returnFocus = true ) {
		if ( ! option ) {
			return;
		}
		commit( option.dataset.comboboxOption, option );
		close( false );
		if ( returnFocus ) {
			suppressOpen = true;
			input.focus( { preventScroll: true } );
			setTimeout( () => {
				suppressOpen = false;
			}, 0 );
		}
	}

	function close( restoreSelection = true ) {
		if ( restoreSelection ) {
			const typed = input.value.trim().toLowerCase();
			const exact = optionEls().find(
				( el ) => el.dataset.comboboxOption.toLowerCase() === typed,
			);
			if ( exact ) {
				commit( exact.dataset.comboboxOption, exact );
			} else {
				input.value = selectedValue();
			}
		}
		root.classList.remove( 'is-open', 'opens-up' );
		popover.hidden = true;
		input.setAttribute( 'aria-expanded', 'false' );
		input.removeAttribute( 'aria-activedescendant' );
		// Reset filter state so the next open shows the full list (source).
		optionEls().forEach( ( el ) => {
			el.hidden = false;
			el.classList.remove( 'is-active' );
		} );
		activeEl = null;
		const empty = emptyEl();
		if ( empty ) {
			empty.hidden = true;
		}
	}

	/**
	 * Rebuild the option list (dependent-field repopulate).
	 *
	 * @param {string[]} values   New option values.
	 * @param {string}   selected Value to keep selected when still present.
	 */
	function setOptions( values, selected = '' ) {
		const unique = [ ...new Set( ( values || [] ).filter( Boolean ) ) ];
		const resolved = unique.includes( selected ) ? selected : '';
		const listId = popover.id || '';
		const empty = emptyEl();
		popover.replaceChildren();
		unique.forEach( ( value, index ) => {
			const button = document.createElement( 'button' );
			button.type = 'button';
			if ( listId ) {
				button.id = `${ listId }-${ index }`;
			}
			button.setAttribute( 'role', 'option' );
			button.dataset.comboboxOption = value;
			button.setAttribute(
				'aria-selected',
				String( value === resolved ),
			);
			button.textContent = value;
			popover.append( button );
		} );
		if ( empty ) {
			empty.hidden = unique.length !== 0;
			popover.append( empty );
		}
		root.dataset.selectedValue = resolved;
		input.value = resolved;
		input.disabled = unique.length === 0;
		close( false );
	}

	// --- listeners ---------------------------------------------------------
	function onInputFocus() {
		open();
	}
	function onInputInput() {
		if ( ! isOpen() ) {
			// Typing is explicit intent: it must reopen even inside the brief
			// post-selection focus-return window (suppressOpen).
			suppressOpen = false;
			open();
		}
		filter( input.value );
	}
	function moveActive( offset ) {
		const visible = visibleEls();
		if ( ! visible.length ) {
			return;
		}
		const currentIndex = visible.indexOf( activeEl );
		const nextIndex =
			currentIndex < 0
				? 0
				: ( currentIndex + offset + visible.length ) %
					visible.length;
		setActive( visible[ nextIndex ] );
	}
	function onInputKeydown( event ) {
		switch ( event.key ) {
			case 'ArrowDown':
			case 'ArrowUp':
				event.preventDefault();
				if ( ! isOpen() ) {
					suppressOpen = false;
					open();
				}
				moveActive( event.key === 'ArrowDown' ? 1 : -1 );
				break;
			case 'Home':
				if ( isOpen() ) {
					event.preventDefault();
					setActive( visibleEls()[ 0 ] || null );
				}
				break;
			case 'End': {
				if ( isOpen() ) {
					event.preventDefault();
					const visible = visibleEls();
					setActive( visible[ visible.length - 1 ] || null );
				}
				break;
			}
			case 'Enter':
				if ( ! isOpen() ) {
					// Enter on a closed combobox opens it (source behavior).
					event.preventDefault();
					suppressOpen = false;
					open();
				} else if ( activeEl ) {
					event.preventDefault();
					selectOption( activeEl );
				}
				break;
			case 'Escape':
				if ( isOpen() ) {
					event.preventDefault();
					event.stopPropagation();
					close( true );
				}
				break;
			case 'Tab':
				if ( isOpen() ) {
					close( true );
				}
				break;
			default:
				break;
		}
	}
	function onPopoverClick( event ) {
		const option = event.target.closest( '[data-combobox-option]' );
		if ( option ) {
			event.preventDefault();
			selectOption( option );
		}
	}
	function onPopoverPointerOver( event ) {
		// Hover keeps the active option in sync with the pointer (source:
		// per-option pointerenter; delegated here so setOptions() rebuilds
		// need no listener rewiring).
		const option = event.target.closest( '[data-combobox-option]' );
		if ( option && ! option.hidden && option !== activeEl ) {
			setActive( option );
		}
	}
	function onDocumentPointerDown( event ) {
		if ( isOpen() && ! root.contains( event.target ) ) {
			close( true );
		}
	}
	function onDocumentFocusIn( event ) {
		if ( isOpen() && ! root.contains( event.target ) ) {
			close( true );
		}
	}

	input.addEventListener( 'focus', onInputFocus );
	input.addEventListener( 'click', onInputFocus );
	input.addEventListener( 'input', onInputInput );
	input.addEventListener( 'keydown', onInputKeydown );
	popover.addEventListener( 'click', onPopoverClick );
	popover.addEventListener( 'pointerover', onPopoverPointerOver );
	const doc = root.ownerDocument || document;
	doc.addEventListener( 'pointerdown', onDocumentPointerDown );
	doc.addEventListener( 'focusin', onDocumentFocusIn );

	return {
		open,
		close,
		setOptions,
		refresh: () => filter( isOpen() ? input.value : '' ),
		getValue: selectedValue,
		destroy() {
			input.removeEventListener( 'focus', onInputFocus );
			input.removeEventListener( 'click', onInputFocus );
			input.removeEventListener( 'input', onInputInput );
			input.removeEventListener( 'keydown', onInputKeydown );
			popover.removeEventListener( 'click', onPopoverClick );
			popover.removeEventListener(
				'pointerover',
				onPopoverPointerOver,
			);
			doc.removeEventListener( 'pointerdown', onDocumentPointerDown );
			doc.removeEventListener( 'focusin', onDocumentFocusIn );
		},
	};
}

/**
 * Build the ARIA combobox markup string for a set of string options — so
 * consumers get a correct scaffold without hand-writing it. Values are escaped.
 *
 * @param {Object}                config
 * @param {string}                config.name         Input name.
 * @param {string}                config.label        Floating label text.
 * @param {string[]}              config.options      Option values.
 * @param {string}                [config.selected]   Pre-selected value.
 * @param {string}                [config.listId]     Popover id (defaults to `${name}-list`).
 * @param {(name:string)=>string} [config.idleIcon]   Idle chevron HTML.
 * @param {(name:string)=>string} [config.activeIcon] Active search-icon HTML.
 * @return {string} HTML string.
 */
export function buildComboboxMarkup( {
	name,
	label,
	options = [],
	selected = '',
	listId = `${ name }-list`,
	idleIcon = () => '',
	activeIcon = () => '',
} ) {
	const esc = ( value ) =>
		String( value ).replace(
			/[&<>"']/g,
			( ch ) =>
				( {
					'&': '&amp;',
					'<': '&lt;',
					'>': '&gt;',
					'"': '&quot;',
					"'": '&#39;',
				} )[ ch ],
		);
	const optionButtons = options
		.map(
			( value, index ) =>
				`<button type="button" role="option" id="${ esc(
					listId,
				) }-${ index }" data-combobox-option="${ esc(
					value,
				) }" aria-selected="${ value === selected }">${ esc(
					value,
				) }</button>`,
		)
		.join( '' );
	return `<div class="pmdk-combobox" data-combobox data-selected-value="${ esc(
		selected,
	) }"><label class="pmdk-compact-field pmdk-combobox-field"><input type="text" name="${ esc(
		name,
	) }" value="${ esc(
		selected,
	) }" placeholder=" " role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${ esc(
		listId,
	) }" data-combobox-input><span class="pmdk-compact-label">${ esc(
		label,
	) }</span><span class="pmdk-field-end-icon"><span class="pmdk-combobox-idle-icon">${ idleIcon(
		'chevronDown',
	) }</span><span class="pmdk-combobox-active-icon">${ activeIcon(
		'search',
	) }</span></span></label><div class="pmdk-combobox-popover" id="${ esc(
		listId,
	) }" role="listbox" hidden>${ optionButtons }<p data-combobox-empty hidden>No ${ esc(
		label.toLowerCase(),
	) } found</p></div></div>`;
}
