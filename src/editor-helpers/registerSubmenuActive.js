/**
 * registerSubmenuActive — keep the WP admin submenu's `.current`
 * highlight in sync with the dashboard's hash route. SPEC §5.7 + §11
 * hack #5.
 *
 * WordPress highlights submenu items by comparing `?page=` server-side;
 * the hash portion of the URL is invisible to PHP. For a dashboard SPA
 * where every tab is `admin.php?page=consumer#tab`, WP would either
 * highlight the parent mirror entry (`Welcome`) or nothing. This
 * helper closes the gap client-side: on mount + on every `hashchange`,
 * walk the submenu, mark the item whose `<a href>` contains the
 * matching `hash` as `.current`, and clear the others.
 *
 * Consumer wiring:
 *
 *   // consumer-plugin/src/dashboard.js (or any admin-loaded script)
 *   import { registerSubmenuActive } from '@pressmaximum/dashboard-kit/editor-helpers';
 *
 *   registerSubmenuActive( {
 *       menuId: 'toplevel_page_customify',   // the parent menu's DOM id
 *       hash: '#templates',                  // the dashboard route to highlight
 *   } );
 *
 * When `#templates` is active, the matching submenu link gets
 * `.current`. When the route is elsewhere, the highlight falls back to
 * the first item (the parent mirror, conventionally "Welcome"), mirroring
 * WP's own default behavior.
 *
 * @param {Object} config
 * @param {string} config.menuId DOM id of the parent menu element
 *                               (the `#toplevel_page_*` wrapper).
 * @param {string} config.hash   Hash route to mark active, e.g. `'#templates'`.
 * @return {(() => void) | null}  Unsubscribe handle (drops the
 *                                hashchange listener), or `null` when
 *                                called outside a browser / before the
 *                                submenu is in the DOM.
 */
export function registerSubmenuActive( { menuId, hash } = {} ) {
	if ( ! menuId ) {
		throw new TypeError(
			'registerSubmenuActive: `menuId` is required.',
		);
	}
	if ( ! hash ) {
		throw new TypeError(
			'registerSubmenuActive: `hash` is required.',
		);
	}
	if ( typeof document === 'undefined' ) {
		return null;
	}

	const submenu = document.querySelector(
		`#${ menuId } .wp-submenu`,
	);
	if ( ! submenu ) {
		return null;
	}

	const items = Array.from( submenu.querySelectorAll( 'li' ) );
	const target = items.find( ( li ) => {
		const a = li.querySelector( 'a' );
		return (
			a &&
			a.getAttribute( 'href' ) &&
			a.getAttribute( 'href' ).indexOf( hash ) !== -1
		);
	} );
	if ( ! target ) {
		return null;
	}

	function sync() {
		const onMatch = window.location.hash === hash;
		items.forEach( ( li ) => li.classList.remove( 'current' ) );
		if ( onMatch ) {
			target.classList.add( 'current' );
		} else {
			const first = items.find( ( li ) =>
				li.querySelector( 'a.wp-first-item' ),
			);
			if ( first ) {
				first.classList.add( 'current' );
			}
		}
	}

	sync();
	window.addEventListener( 'hashchange', sync );
	return () => window.removeEventListener( 'hashchange', sync );
}

export default registerSubmenuActive;
