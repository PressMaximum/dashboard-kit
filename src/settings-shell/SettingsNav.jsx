/**
 * SettingsNav — Tier-1 grouped/collapsible settings rail (K-043).
 *
 * Promoted from Aponto's `SettingsNode` (assets/src/admin/routes/
 * SettingsRoute.jsx) with its interaction contract intact:
 *
 *   - A parent click SELECTS ITS FIRST CHILD. The tree deliberately never
 *     grows a second interaction ("expand" vs "select") for the same
 *     click; exactly one branch is open — the active one — so disclosure
 *     is a consequence of selection, not a separate control.
 *   - Arrow Up/Down/Left/Right + Home/End move FOCUS over the visible rail
 *     buttons without activating them. This is navigation, not a tablist:
 *     activating on arrow would fire a consumer's dirty-form confirm on
 *     every keypress.
 *   - A leaf activates itself and carries `aria-current="page"`; a parent
 *     carries `aria-expanded`, and `aria-controls` only while the group it
 *     points at exists (a collapsed branch renders no children, and a
 *     dangling reference is worse than none).
 *
 * NEW class family `.pmdk-settings-nav*` — `<SubNav>` and its locked
 * `.pmdk-subnav*` classes are untouched, including its "fewer than two
 * items ⇒ null" rule, which is wrong for a settings rail that may
 * legitimately ship one section.
 *
 * Zero translatable strings: labels and the `aria-label` arrive as props /
 * tree data, and the child group is named by its own parent's label.
 */

import { useRef } from '@wordpress/element';

const FOCUS_KEYS = [
	'ArrowDown',
	'ArrowRight',
	'ArrowUp',
	'ArrowLeft',
	'Home',
	'End',
];

/**
 * Roving FOCUS over whatever the rail currently shows (every parent plus
 * the open branch's children).
 *
 * Bound to each BUTTON rather than to the `<nav>`: the keydown always
 * originates on one of them, and hanging keyboard handlers off a
 * non-interactive landmark is the thing `jsx-a11y` (rightly) objects to.
 *
 * @param {KeyboardEvent} event Keydown on a rail button.
 * @param {HTMLElement}   rail  The rail element that owns the buttons.
 */
function railRovingKeydown( event, rail ) {
	if ( ! FOCUS_KEYS.includes( event.key ) || ! rail ) {
		return;
	}
	const nodes = [ ...rail.querySelectorAll( 'button' ) ];
	if ( ! nodes.length ) {
		return;
	}
	event.preventDefault();
	const index = nodes.indexOf( rail.ownerDocument.activeElement );
	const last = nodes.length - 1;
	let next;
	if ( event.key === 'Home' ) {
		next = 0;
	} else if ( event.key === 'End' ) {
		next = last;
	} else if ( event.key === 'ArrowDown' || event.key === 'ArrowRight' ) {
		next = index >= last ? 0 : index + 1;
	} else {
		next = index <= 0 ? last : index - 1;
	}
	nodes[ next ]?.focus();
}

/**
 * One rail node: a leaf button, or a parent disclosure plus its group.
 *
 * @param {Object}   props
 * @param {Object}   props.node         Tree node.
 * @param {string}   props.activeParent Active parent id.
 * @param {string}   props.activeChild  Active child id.
 * @param {string}   props.idPrefix     Namespace for the generated group id.
 * @param {Function} props.onSelect     `( parentId, childId ) => void`.
 * @param {Function} props.onKeyDown    Roving-focus handler, bound per button.
 */
function SettingsNode( {
	node,
	activeParent,
	activeChild,
	idPrefix,
	onSelect,
	onKeyDown,
} ) {
	const children = Array.isArray( node.children ) ? node.children : [];
	const open = activeParent === node.id;

	// The icon cell is ALWAYS emitted, even empty: it is a grid track, and
	// a node that skipped it would drop its label into the 18px icon
	// column and truncate to one character. `is-iconless` (below) is what
	// removes the track, and it is a whole-rail decision.
	const icon = (
		<span className="pmdk-settings-nav__icon" aria-hidden="true">
			{ node.icon || null }
		</span>
	);

	if ( ! children.length ) {
		const leafClass =
			'pmdk-settings-nav__node is-leaf' + ( open ? ' is-active' : '' );
		return (
			<button
				className={ leafClass }
				type="button"
				aria-current={ open ? 'page' : undefined }
				onClick={ () => onSelect( node.id, '' ) }
				onKeyDown={ onKeyDown }
			>
				{ icon }
				<span className="pmdk-settings-nav__label">{ node.label }</span>
			</button>
		);
	}

	const groupId = `${ idPrefix }-group-${ node.id }`;
	const branchClass =
		'pmdk-settings-nav__branch' + ( open ? ' is-open' : '' );

	return (
		<div className={ branchClass }>
			<button
				className="pmdk-settings-nav__node"
				type="button"
				aria-expanded={ open }
				aria-controls={ open ? groupId : undefined }
				onClick={ () => onSelect( node.id, children[ 0 ].id ) }
				onKeyDown={ onKeyDown }
			>
				{ icon }
				<span className="pmdk-settings-nav__label">{ node.label }</span>
				<span
					className="pmdk-settings-nav__caret"
					aria-hidden="true"
				/>
			</button>
			{ open && (
				<div
					className="pmdk-settings-nav__children"
					id={ groupId }
					role="group"
					aria-label={ node.label }
				>
					{ children.map( ( child ) => {
						const childActive = activeChild === child.id;
						return (
							<button
								key={ child.id }
								className={
									'pmdk-settings-nav__child' +
									( childActive ? ' is-active' : '' )
								}
								type="button"
								aria-current={
									childActive ? 'page' : undefined
								}
								onClick={ () => onSelect( node.id, child.id ) }
								onKeyDown={ onKeyDown }
							>
								{ child.label }
							</button>
						);
					} ) }
				</div>
			) }
		</div>
	);
}

export default function SettingsNav( {
	tree,
	activeParent,
	activeChild,
	onSelect,
	ariaLabel,
	idPrefix = 'pmdk-settings',
	className,
} ) {
	const railRef = useRef( null );

	const nodes = Array.isArray( tree ) ? tree : [];
	if ( ! nodes.length ) {
		return null;
	}

	// Whole-rail decision, not per-node: reserving the icon track only for
	// the nodes that fill it would stagger the labels. A tree with no
	// glyphs at all drops the track instead of carrying a dead gutter.
	const iconless = ! nodes.some( ( node ) => node.icon );

	const classes =
		'pmdk-settings-nav' +
		( iconless ? ' is-iconless' : '' ) +
		( className ? ' ' + className : '' );

	const select = ( parentId, childId ) => {
		if ( typeof onSelect === 'function' ) {
			onSelect( parentId, childId );
		}
	};

	const onKeyDown = ( event ) =>
		railRovingKeydown( event, railRef.current );

	return (
		<nav className={ classes } ref={ railRef } aria-label={ ariaLabel }>
			{ nodes.map( ( node ) => (
				<SettingsNode
					key={ node.id }
					node={ node }
					activeParent={ activeParent }
					activeChild={ activeChild }
					idPrefix={ idPrefix }
					onSelect={ select }
					onKeyDown={ onKeyDown }
				/>
			) ) }
		</nav>
	);
}
