/**
 * TabStrip — Tier-1 layout primitive (SPEC §5.13). Zero translatable
 * strings: every label and the `aria-label` arrive via props, and the
 * dropdown menu takes its accessible name from its own trigger
 * (`aria-labelledby`) rather than a kit-owned string.
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
 *     items={ [ { id, label, hash, align?, children? } ] }
 *     activeId={ 'welcome' }
 *     activeRoute={ '#settings/general' }         // optional, deep child sync
 *     ariaLabel={ 'Dashboard sections' }          // already translated
 *     onSelect={ ({ id, hash, parentId, event }) => void }  // optional override
 *   />
 *
 * Default click behavior calls `useNavigate()`, which honors any active
 * `NavigationGuardProvider` (P3's dirty-state hook wraps via this).
 * Override `onSelect` to take full control (e.g. custom logging /
 * preventDefault skip).
 *
 * ── K-042: split nav + dropdown tabs (additive, 0.3) ──────────────────
 *
 * `align: 'end'` moves a tab into a second, end-aligned run — Aponto's
 * header IA (primary destinations left, utility surfaces right) inside
 * ONE `<nav>` landmark, so active-sync / a11y / theming stay in the kit.
 * The split is opt-in in the DOM as well as the CSS: with no end-aligned
 * item the component renders exactly the flat markup it always has (no
 * group wrappers, no marker attribute), so consumers that pass nothing
 * new are byte-identical. When an end run exists the nav gains
 * `data-has-end` and both runs ship inside `.pmdk-dashboard__tab-group`
 * wrappers; every new layout rule keys off that marker.
 *
 * `children` turns a tab into a dropdown (Aponto's `Offerings ▾` /
 * `Settings ▾`), built on `@wordpress/components` `<Dropdown>` — the
 * `HelpPanel` precedent. Behaviour promoted from Aponto's `NavDropdown`
 * (assets/src/admin/App.jsx):
 *
 *   - a tab WITH a `hash` renders a real link trigger (point the hash at
 *     the default child to reproduce Aponto's Settings ▾) that ALSO
 *     discloses the menu on hover / focus — it never click-toggles;
 *   - a tab with `hash: ''` renders a click-toggle `<button>` trigger
 *     (an explicit empty hash survives `mountDashboard`'s `toTabShape`;
 *     an OMITTED hash is still derived as `'#' + id`);
 *   - `aria-haspopup="menu"` + `aria-expanded` on the trigger, panel
 *     `role="menu"`, items `role="menuitem"`;
 *   - Arrow Up/Down + Home/End rove inside the panel, Escape closes and
 *     restores focus to the trigger.
 *
 * Deliberate deviation from the Aponto source: open state here is driven
 * by STATE ONLY. Aponto also paints the panel from CSS
 * (`:hover / :focus-within { display: block !important }`), which is why
 * its Escape had to move focus out before closing or the surface stayed
 * on screen with `aria-expanded="false"`. The hover / focus disclosure
 * below feeds the same state the click path uses, so the DOM and the ARIA
 * can never disagree.
 */

import {
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import { Dropdown, Icon } from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';

import { useNavigate } from './HashRouter';

import './TabStrip.css';

/**
 * Grace period (ms) before a pointer leaving a dropdown closes it. The
 * panel renders `inline`, i.e. as a DOM descendant of the wrapper, so
 * travelling from trigger to panel never leaves the wrapper — the delay
 * only forgives a pointer that clips the corner of the surface on its way
 * back in.
 */
const HOVER_CLOSE_DELAY = 120;

const MENU_KEYS = [ 'ArrowDown', 'ArrowUp', 'Home', 'End' ];

function stripHash( value ) {
	return typeof value === 'string' && value.startsWith( '#' )
		? value.slice( 1 )
		: value;
}

/**
 * A dropdown child's target: its own `href`, else the conventional
 * `#<id>` a top-level route would use.
 *
 * @param {Object} child Child definition.
 * @return {string} Hash target.
 */
function childHref( child ) {
	return child.href || '#' + child.id;
}

/**
 * Is this dropdown child the active one?
 *
 * Two mechanisms, both derivable with no consumer wiring: the child id
 * matches the top-level tab id (`activeTabId()` — a child that is its own
 * route), or the child's href matches the resolved route (a child nested
 * under the parent's route, e.g. `#settings/general`).
 *
 * @param {Object} child       Child definition.
 * @param {string} activeId    Active top-level tab id.
 * @param {string} activeRoute Resolved route, optional.
 * @return {boolean} True when the child is the active destination.
 */
function isChildActive( child, activeId, activeRoute ) {
	if ( activeId && child.id === activeId ) {
		return true;
	}
	if ( ! activeRoute ) {
		return false;
	}
	return stripHash( childHref( child ) ) === stripHash( activeRoute );
}

/**
 * Roving focus inside an open `role="menu"` (SPEC §11 menu contract).
 * Arrow keys wrap at the ends; Home/End jump to the edges. Focus moves
 * only — activation stays on Enter / Space / click.
 *
 * @param {KeyboardEvent} event Keydown on the menu container.
 */
function menuRovingKeydown( event ) {
	if ( ! MENU_KEYS.includes( event.key ) ) {
		return;
	}
	const nodes = [
		...event.currentTarget.querySelectorAll( '[role="menuitem"]' ),
	];
	if ( ! nodes.length ) {
		return;
	}
	event.preventDefault();
	const index = nodes.indexOf(
		event.currentTarget.ownerDocument.activeElement,
	);
	const last = nodes.length - 1;
	let target;
	if ( event.key === 'Home' ) {
		target = nodes[ 0 ];
	} else if ( event.key === 'End' ) {
		target = nodes[ last ];
	} else if ( event.key === 'ArrowDown' ) {
		target = nodes[ index >= last ? 0 : index + 1 ];
	} else {
		target = nodes[ index <= 0 ? last : index - 1 ];
	}
	target?.focus();
}

/**
 * One dropdown tab: trigger + `role="menu"` panel.
 *
 * @param {Object}   props
 * @param {Object}   props.item        Tab definition carrying `children`.
 * @param {boolean}  props.isActive    Whether the parent trigger is the active route.
 * @param {string}   props.activeId    Active top-level tab id.
 * @param {string}   props.activeRoute Resolved route (deep child sync), optional.
 * @param {Function} props.onActivate  `( { id, hash, parentId, event } ) => void`.
 */
function TabMenu( { item, isActive, activeId, activeRoute, onActivate } ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const triggerId = useId();
	const closeTimer = useRef( null );
	const triggerRef = useRef( null );
	const panelRef = useRef( null );

	const children = item.children;
	// The tab's own `hash` decides the trigger's shape, and nothing else:
	// point it at the default child for Aponto's "Settings ▾ goes straight
	// to the default section" link, or blank it (`hash: ''`) for a
	// pure-menu click-toggle button. No inference from the children — a
	// consumer must not have to blank a child href to get a button.
	const triggerHref = item.hash || '';

	const cancelClose = useCallback( () => {
		if ( closeTimer.current ) {
			clearTimeout( closeTimer.current );
			closeTimer.current = null;
		}
	}, [] );

	useEffect( () => cancelClose, [ cancelClose ] );

	const open = useCallback( () => {
		cancelClose();
		setIsOpen( true );
	}, [ cancelClose ] );

	const close = useCallback( () => {
		cancelClose();
		setIsOpen( false );
	}, [ cancelClose ] );

	const closeAndRestore = useCallback( () => {
		close();
		triggerRef.current?.focus();
	}, [ close ] );

	const scheduleClose = useCallback( () => {
		cancelClose();
		closeTimer.current = setTimeout(
			() => setIsOpen( false ),
			HOVER_CLOSE_DELAY,
		);
	}, [ cancelClose ] );

	const focusFirstItem = useCallback( () => {
		panelRef.current?.querySelector( '[role="menuitem"]' )?.focus();
	}, [] );

	// Trigger keyboard: Down/Up open the menu and land on the first item
	// (menu-button pattern); Escape closes without leaving the trigger.
	const onTriggerKeyDown = ( event ) => {
		if ( event.key === 'ArrowDown' || event.key === 'ArrowUp' ) {
			event.preventDefault();
			open();
			// The panel mounts on the next commit — defer the focus move.
			setTimeout( focusFirstItem, 0 );
			return;
		}
		if ( event.key === 'Escape' && isOpen ) {
			event.preventDefault();
			close();
		}
	};

	const onPanelKeyDown = ( event ) => {
		if ( event.key === 'Escape' ) {
			event.preventDefault();
			closeAndRestore();
			return;
		}
		menuRovingKeydown( event );
	};

	const wrapClass =
		'pmdk-dashboard__tab-menu-wrap' +
		( item.align === 'end' ? ' is-end' : '' );

	const triggerClass =
		'pmdk-dashboard__tab pmdk-dashboard__tab-trigger' +
		( isActive ? ' is-active' : '' );

	const triggerContent = (
		<>
			{ item.label }
			<span className="pmdk-dashboard__tab-caret" aria-hidden="true">
				<Icon icon={ chevronDown } size={ 16 } />
			</span>
		</>
	);

	const onWrapBlur = ( event ) => {
		if ( ! event.currentTarget.contains( event.relatedTarget ) ) {
			close();
		}
	};

	// Hover / focus disclosure for the LINK trigger only: a button trigger
	// owns its open state through the click that toggles it, so opening it
	// on hover would fight that toggle.
	const disclosureProps = {};
	if ( triggerHref ) {
		disclosureProps.onMouseEnter = open;
		disclosureProps.onMouseLeave = scheduleClose;
		disclosureProps.onFocus = open;
		disclosureProps.onBlur = onWrapBlur;
	}

	return (
		<div className={ wrapClass } { ...disclosureProps }>
			<Dropdown
				className="pmdk-dashboard__tab-dropdown"
				contentClassName="pmdk-dashboard__tab-menu-popover"
				open={ isOpen }
				onToggle={ setIsOpen }
				// Hover-opened surfaces must not steal focus; the keyboard
				// path moves focus explicitly (see `onTriggerKeyDown`).
				focusOnMount={ false }
				popoverProps={ {
					// `inline` keeps the panel a DOM descendant of this
					// wrapper instead of portalling it to <body>: hover
					// travel from trigger to panel never leaves the wrapper,
					// and consumer CSS reaches it through the tab scope.
					inline: true,
					placement:
						item.align === 'end' ? 'bottom-end' : 'bottom-start',
					offset: 0,
				} }
				renderToggle={ ( { onToggle } ) => {
					const shared = {
						id: triggerId,
						className: triggerClass,
						'aria-haspopup': 'menu',
						'aria-expanded': isOpen,
						'aria-current': isActive ? 'page' : undefined,
						onKeyDown: onTriggerKeyDown,
					};
					if ( triggerHref ) {
						return (
							<a
								{ ...shared }
								ref={ triggerRef }
								href={ triggerHref }
								onClick={ ( event ) => {
									close();
									onActivate( {
										id: item.id,
										hash: triggerHref,
										event,
									} );
								} }
							>
								{ triggerContent }
							</a>
						);
					}
					return (
						<button
							{ ...shared }
							ref={ triggerRef }
							type="button"
							onClick={ onToggle }
						>
							{ triggerContent }
						</button>
					);
				} }
				renderContent={ () => (
					<div
						ref={ panelRef }
						className="pmdk-dashboard__tab-menu"
						role="menu"
						// The menu container is a keydown host (roving +
						// Escape), so it needs to be focusable even though
						// focus normally lands on a `menuitem`.
						tabIndex={ -1 }
						aria-labelledby={ triggerId }
						onKeyDown={ onPanelKeyDown }
					>
						{ children.map( ( child ) => {
							const href = childHref( child );
							const childActive = isChildActive(
								child,
								activeId,
								activeRoute,
							);
							return (
								<a
									key={ child.id }
									className="pmdk-dashboard__tab-menu-item"
									role="menuitem"
									href={ href }
									aria-current={
										childActive ? 'page' : undefined
									}
									onClick={ ( event ) => {
										closeAndRestore();
										onActivate( {
											id: child.id,
											hash: href,
											parentId: item.id,
											event,
										} );
									} }
								>
									<strong className="pmdk-dashboard__tab-menu-label">
										{ child.label }
									</strong>
									{ child.description && (
										<em className="pmdk-dashboard__tab-menu-description">
											{ child.description }
										</em>
									) }
								</a>
							);
						} ) }
					</div>
				) }
			/>
		</div>
	);
}

export default function TabStrip( {
	items,
	activeId,
	activeRoute,
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

	const onActivate = ( { id, hash, parentId, event } ) => {
		if ( typeof onSelect === 'function' ) {
			onSelect( { id, hash, parentId, event } );
			return;
		}
		onNavigate( hash )( event );
	};

	const hasChildren = ( item ) =>
		Array.isArray( item.children ) && item.children.length > 0;

	const renderItem = ( item ) => {
		const isActive =
			item.id === activeId ||
			( hasChildren( item ) &&
				item.children.some( ( child ) =>
					isChildActive( child, activeId, activeRoute ),
				) );

		if ( hasChildren( item ) ) {
			return (
				<TabMenu
					key={ item.id }
					item={ item }
					isActive={ isActive }
					activeId={ activeId }
					activeRoute={ activeRoute }
					onActivate={ onActivate }
				/>
			);
		}

		const tabClass =
			'pmdk-dashboard__tab' + ( isActive ? ' is-active' : '' );

		return (
			<a
				key={ item.id }
				href={ item.hash }
				className={ tabClass }
				aria-current={ isActive ? 'page' : undefined }
				onClick={ ( event ) =>
					onActivate( { id: item.id, hash: item.hash, event } )
				}
			>
				{ item.label }
			</a>
		);
	};

	const endItems = items.filter( ( item ) => item.align === 'end' );

	// No end run ⇒ the historical flat markup, unchanged: no group
	// wrappers, no marker attribute, so every existing consumer's DOM and
	// geometry are byte-identical (REVISED-C).
	if ( endItems.length === 0 ) {
		return (
			<nav className={ classes } aria-label={ ariaLabel }>
				{ items.map( renderItem ) }
			</nav>
		);
	}

	const startItems = items.filter( ( item ) => item.align !== 'end' );

	return (
		<nav className={ classes } aria-label={ ariaLabel } data-has-end="true">
			<div
				className="pmdk-dashboard__tab-group"
				data-tab-group="start"
			>
				{ startItems.map( renderItem ) }
			</div>
			<div className="pmdk-dashboard__tab-group" data-tab-group="end">
				{ endItems.map( renderItem ) }
			</div>
		</nav>
	);
}
