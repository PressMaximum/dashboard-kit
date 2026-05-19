/**
 * SubNav — Tier-1 vertical nav rail (SPEC §5.3). Two consumer
 * patterns documented in the spec:
 *
 *   1. Settings-style — intra-tab panel switch. Clicking a panel
 *      navigates within the same top-level tab (e.g.
 *      `#settings/:panelId`); the cross-tab dirty-state guard does NOT
 *      fire (consistent with the Settings P7.5 pattern).
 *
 *   2. Multi-source style — Changelog with Pro plugin sources. Hide
 *      the SubNav when fewer than two sources are registered (single
 *      source → render plain content with no rail).
 *
 * The kit handles the "fewer than 2 items" case by returning `null`,
 * matching pattern 2's degrade rule. Consumers that want to force the
 * rail visible at 1 item can render their own wrapper.
 *
 * Slot shape (SPEC §5.3):
 *
 *   <SubNav
 *     items={ [ { id, label, hash } ] }
 *     activeId={ string }
 *     ariaLabel={ string }                // already-translated
 *     onSelect={ ({ id, hash, event }) => void }  // optional
 *   />
 *
 * Default click behavior calls `navigate( hash )` directly — INTRA-tab
 * nav bypasses the `NavigationGuardProvider` (dirty-state guard) per
 * SPEC §5.3 pattern 1. Consumers needing the guard wire `onSelect`
 * themselves and call `useNavigate()(hash)(event)` to reuse the kit's
 * guarded path.
 */

import { navigate } from '../../core/HashRouter';

import './editor.css';

export default function SubNav( {
	items,
	activeId,
	ariaLabel,
	onSelect,
	className,
} ) {
	if ( ! Array.isArray( items ) || items.length < 2 ) {
		return null;
	}

	const classes = 'pmdk-subnav' + ( className ? ' ' + className : '' );

	return (
		<nav className={ classes } aria-label={ ariaLabel }>
			<ul className="pmdk-subnav__list">
				{ items.map( ( item ) => {
					const isActive = item.id === activeId;
					const itemClass =
						'pmdk-subnav__item' +
						( isActive ? ' is-active' : '' );

					const handleClick = ( event ) => {
						event.preventDefault();
						if ( isActive ) {
							return;
						}
						if ( typeof onSelect === 'function' ) {
							onSelect( {
								id: item.id,
								hash: item.hash,
								event,
							} );
							return;
						}
						navigate( item.hash );
					};

					return (
						<li key={ item.id }>
							<a
								href={ item.hash }
								className={ itemClass }
								aria-current={
									isActive ? 'page' : undefined
								}
								onClick={ handleClick }
							>
								{ item.label }
							</a>
						</li>
					);
				} ) }
			</ul>
		</nav>
	);
}
