/**
 * TabStrip — Tier-1 layout primitive (SPEC §5.13). Zero translatable
 * strings: every label and the `aria-label` arrive via props.
 *
 * Rendered inside `DashboardShell`'s header, but exported standalone so
 * Pro plugins / future consumers can repurpose the visual. DOM uses the
 * SPEC §16.2 locked class names (`pmdk-dashboard__tabs`,
 * `pmdk-dashboard__tab`) — these classes are the kit's public CSS
 * surface and consumers target them for hover / focus restyles.
 *
 * Slot shape:
 *
 *   <TabStrip
 *     items={ [ { id, label, hash } ] }
 *     activeId={ 'welcome' }
 *     ariaLabel={ 'Dashboard sections' }   // already translated
 *     onSelect={ ({ id, hash, event }) => void }  // optional override
 *   />
 *
 * Default click behavior calls `useNavigate()`, which honors any active
 * `NavigationGuardProvider` (P3's dirty-state hook wraps via this).
 * Override `onSelect` to take full control (e.g. custom logging /
 * preventDefault skip).
 */

import { useNavigate } from './HashRouter';

import './TabStrip.css';

export default function TabStrip( {
	items,
	activeId,
	ariaLabel,
	onSelect,
	className,
} ) {
	const onNavigate = useNavigate();

	if ( ! Array.isArray( items ) || items.length === 0 ) {
		return null;
	}

	const classes =
		'pmdk-dashboard__tabs' + ( className ? ' ' + className : '' );

	return (
		<nav className={ classes } aria-label={ ariaLabel }>
			{ items.map( ( item ) => {
				const isActive = item.id === activeId;
				const tabClass =
					'pmdk-dashboard__tab' +
					( isActive ? ' is-active' : '' );

				const handleClick = ( event ) => {
					if ( typeof onSelect === 'function' ) {
						onSelect( { id: item.id, hash: item.hash, event } );
						return;
					}
					onNavigate( item.hash )( event );
				};

				return (
					<a
						key={ item.id }
						href={ item.hash }
						className={ tabClass }
						aria-current={ isActive ? 'page' : undefined }
						onClick={ handleClick }
					>
						{ item.label }
					</a>
				);
			} ) }
		</nav>
	);
}
