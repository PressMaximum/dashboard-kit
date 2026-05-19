/**
 * SnackbarSlot — bottom-centered transient notices slot bound to WP's
 * `core/notices` data store. Renders snackbar-typed notices in a fixed
 * overlay so they survive route changes without being inside the
 * active page tree.
 *
 * Why the store name as a string instead of `import from
 * '@wordpress/notices'`? Avoids adding a peer dep for what is really
 * just a string handle into a globally-registered data store. WP admin
 * registers `core/notices` on page load; the kit just consumes the
 * descriptor.
 *
 * Consumers create snackbars via the standard WP idiom:
 *
 *   import { dispatch } from '@wordpress/data';
 *   dispatch( 'core/notices' ).createSuccessNotice( __( 'Saved.', 'my-plugin' ), { type: 'snackbar' } );
 *
 * The kit just renders whatever has `type === 'snackbar'` in the store.
 */

import { useSelect, useDispatch } from '@wordpress/data';
import { SnackbarList } from '@wordpress/components';

const NOTICES_STORE = 'core/notices';

export default function SnackbarSlot( { className } ) {
	const notices = useSelect(
		( select ) => select( NOTICES_STORE )?.getNotices() ?? [],
		[],
	);
	// `useDispatch` against an unregistered store returns `null` in older
	// WP data versions + in vitest/jsdom (no WP runtime). Default to a
	// no-op so the kit doesn't crash when the consumer happens not to
	// have @wordpress/notices registered (typical in unit tests).
	const dispatchers = useDispatch( NOTICES_STORE ) || {};
	const removeNotice = dispatchers.removeNotice || ( () => undefined );

	const snackbarNotices = notices.filter( ( n ) => n.type === 'snackbar' );

	const classes =
		'pmdk-dashboard__snackbar' + ( className ? ' ' + className : '' );

	return (
		<SnackbarList
			className={ classes }
			notices={ snackbarNotices }
			onRemove={ removeNotice }
		/>
	);
}
