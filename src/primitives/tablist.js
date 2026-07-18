/**
 * Headless tablist controller (KIT-P3 slice 4).
 *
 * Port of the ~25-line design-system tablist (`[data-ds-tablist]` in
 * `design-system.js`) for the `.pmdk-section-tabs` chrome. Behavior contract
 * (DESIGN-SYSTEM "Tabs"): Left/Right arrows move with wrap-around, Home/End
 * jump to the ends, activation follows focus, and `aria-selected` stays in
 * sync. Panel visibility is the consumer's job (headless — wire it in
 * `onChange`), matching the source.
 *
 * DOM contract:
 *
 *   <div class="pmdk-section-tabs" role="tablist" data-tablist>
 *     <button role="tab" aria-selected="true">Upcoming <span>3</span></button>
 *     <button role="tab" aria-selected="false">Past</button>
 *   </div>
 *
 * @param {HTMLElement}                           root               The tablist element containing `[role="tab"]`s.
 * @param {Object}                                [options]
 * @param {(tab:HTMLElement, index:number)=>void} [options.onChange] Called on activation.
 * @return {{activate:Function, getActive:Function, destroy:Function}} Tablist controller.
 */
export function createTablist( root, options = {} ) {
	if ( ! root ) {
		throw new Error( 'createTablist: root element is required' );
	}
	const tabs = [ ...root.querySelectorAll( '[role="tab"]' ) ];
	if ( ! tabs.length ) {
		throw new Error(
			'createTablist: root must contain [role="tab"] elements',
		);
	}
	const onChange = options.onChange || ( () => {} );

	function activate( tab, moveFocus = false ) {
		if ( ! tab || ! tabs.includes( tab ) ) {
			return;
		}
		tabs.forEach( ( item ) =>
			item.setAttribute( 'aria-selected', String( item === tab ) ),
		);
		if ( moveFocus ) {
			tab.focus();
		}
		onChange( tab, tabs.indexOf( tab ) );
	}

	const listeners = tabs.map( ( tab, index ) => {
		const onClick = () => activate( tab );
		const onKeydown = ( event ) => {
			let nextIndex = index;
			if ( event.key === 'ArrowRight' ) {
				nextIndex = ( index + 1 ) % tabs.length;
			} else if ( event.key === 'ArrowLeft' ) {
				nextIndex = ( index - 1 + tabs.length ) % tabs.length;
			} else if ( event.key === 'Home' ) {
				nextIndex = 0;
			} else if ( event.key === 'End' ) {
				nextIndex = tabs.length - 1;
			} else {
				return;
			}
			event.preventDefault();
			activate( tabs[ nextIndex ], true );
		};
		tab.addEventListener( 'click', onClick );
		tab.addEventListener( 'keydown', onKeydown );
		return { tab, onClick, onKeydown };
	} );

	if ( ! root.hasAttribute( 'role' ) ) {
		root.setAttribute( 'role', 'tablist' );
	}

	return {
		activate,
		getActive: () =>
			tabs.find(
				( tab ) => tab.getAttribute( 'aria-selected' ) === 'true',
			) || null,
		destroy() {
			listeners.forEach( ( { tab, onClick, onKeydown } ) => {
				tab.removeEventListener( 'click', onClick );
				tab.removeEventListener( 'keydown', onKeydown );
			} );
		},
	};
}
