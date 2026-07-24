/**
 * KIT-P3 slice 3 — drawer panel + headless menu (G4).
 *
 * Drawer: the overlay-plane sibling of the in-flow inspector (short blocking
 * flows). `data-panel-kind="detail"` is the read-only MODE tuning (kept in
 * the kit — a mode, not a product domain). Menu: `createMenu` attaches the
 * BookingsTable interaction model (trigger toggle, keyboard-open focus,
 * roving keys, Escape-focus-return, outside dismiss) to the popover chrome.
 */

import { useEffect, useRef, useState } from 'react';
import '../../src/primitives/style.css';
import '../../src/themes/app.css';
import { createMenu } from '../../src/primitives/index.mjs';
import { Chassis } from '../helpers/Chassis.jsx';
import { defaultRenderIcon } from '../../src/table/index.mjs';

export default {
	title: 'Primitives/DrawerMenu',
	parameters: { layout: 'padded' },
};

function DetailDrawer() {
	return (
		<div
			className="pmdk-drawer open"
			data-panel-kind="detail"
			style={ { position: 'relative', maxWidth: 420 } }
		>
			<div className="pmdk-drawer-head">
				<div className="pmdk-drawer-title-group">
					<div className="pmdk-drawer-title-copy">
						<h2>Record details</h2>
						<p>Read-only context</p>
					</div>
				</div>
				<button
					className="pmdk-icon-button"
					type="button"
					aria-label="Close drawer"
				>
					{ defaultRenderIcon( 'close' ) }
				</button>
			</div>
			<div className="pmdk-drawer-body">
				<div className="pmdk-drawer-hero">
					<span className="pmdk-avatar" aria-hidden="true">
						M
					</span>
					<div className="pmdk-drawer-hero-copy">
						<h3>Maya Patel</h3>
						<p>maya@example.com</p>
					</div>
				</div>
				<div className="pmdk-panel-section">
					<h4>Summary</h4>
					<p>
						Spacing and quiet rules carry the hierarchy — no
						nested cards inside the drawer body.
					</p>
				</div>
			</div>
			<div className="pmdk-drawer-confirm-foot">
				<p>
					<strong>Delete this record?</strong>
					<span>An activity entry is kept.</span>
				</p>
				<div className="pmdk-drawer-confirm-actions">
					<button className="pmdk-button sm" type="button">
						Keep
					</button>
					<button className="pmdk-button danger sm" type="button">
						Delete
					</button>
				</div>
			</div>
		</div>
	);
}

export const DetailPanel = {
	render: () => (
		<Chassis>
			<DetailDrawer />
		</Chassis>
	),
};

export const DetailPanelThemeAppDark = {
	render: () => (
		<Chassis theme scheme="dark">
			<DetailDrawer />
		</Chassis>
	),
};

function MenuMount( { position } ) {
	const rootRef = useRef( null );
	const [ lastAction, setLastAction ] = useState( '' );

	useEffect( () => {
		const root = rootRef.current;
		if ( ! root ) {
			return undefined;
		}
		const menu = createMenu( root, {
			position,
			onSelect: ( item ) => setLastAction( item.dataset.action ),
		} );
		return () => menu.destroy();
	}, [ position ] );

	return (
		<div style={ { minHeight: 220 } }>
			<div
				className="pmdk-row-actions"
				data-menu
				ref={ rootRef }
				style={ { justifyContent: 'flex-start' } }
			>
				<button
					className="pmdk-row-action pmdk-row-action-icon"
					data-menu-trigger
					type="button"
					aria-label="Record actions"
				>
					{ defaultRenderIcon( 'moreVertical' ) }
				</button>
				<div
					className="pmdk-row-action-menu"
					role="menu"
					aria-label="Record actions"
					hidden
				>
					<button
						type="button"
						role="menuitem"
						data-action="view"
					>
						{ defaultRenderIcon( 'list' ) }
						<span>View details</span>
					</button>
					<button
						type="button"
						role="menuitem"
						data-action="export"
					>
						{ defaultRenderIcon( 'csv' ) }
						<span>Export record</span>
					</button>
					<div
						className="pmdk-row-action-separator"
						role="separator"
					/>
					<button
						className="is-danger"
						type="button"
						role="menuitem"
						data-action="delete"
					>
						{ defaultRenderIcon( 'close' ) }
						<span>Delete record</span>
					</button>
				</div>
			</div>
			<p
				style={ {
					marginTop: 16,
					fontSize: 'var(--pmdk-font-size-caption)',
					color: 'var(--pmdk-color-text-muted)',
				} }
			>
				Last action: <strong>{ lastAction || '—' }</strong> · open
				with the keyboard (Enter/Space) to see roving focus; Escape
				returns focus to the trigger.
			</p>
		</div>
	);
}

export const MenuAnchored = {
	render: () => (
		<Chassis>
			<MenuMount position="anchored" />
		</Chassis>
	),
};

export const MenuFixedFloating = {
	render: () => (
		<Chassis>
			<MenuMount position="fixed" />
		</Chassis>
	),
};

/*
 * K-021 — fixed mode inside a CSS containing block.
 *
 * `transform`, `filter`, `contain: layout` and friends make the ancestor the
 * containing block for `position: fixed` descendants, so viewport coordinates
 * land offset by its origin — before the fix these cases were off by hundreds
 * of pixels. `container-type` is the interesting one: it implies layout
 * containment, yet Chromium keeps fixed descendants on the viewport, which is
 * why `createMenu` measures the engine instead of trusting the property.
 *
 * Each case auto-opens a fixed menu and measures the popover against its
 * trigger. The contract is the same in EVERY case: the popover's end edge
 * aligns with the trigger's (dx 0) and it sits 5px below it (dy 5).
 */
function AlignmentProbe( { label, wrapperStyle } ) {
	const rootRef = useRef( null );
	const [ delta, setDelta ] = useState( null );

	useEffect( () => {
		const root = rootRef.current;
		if ( ! root ) {
			return undefined;
		}
		const menu = createMenu( root, { position: 'fixed' } );
		menu.open();
		const frame = window.requestAnimationFrame( () => {
			const triggerBox = root
				.querySelector( '[data-menu-trigger]' )
				.getBoundingClientRect();
			const popoverBox = root
				.querySelector( '[role="menu"]' )
				.getBoundingClientRect();
			setDelta( {
				dx: Math.round( popoverBox.right - triggerBox.right ),
				dy: Math.round( popoverBox.top - triggerBox.bottom ),
			} );
		} );
		return () => {
			window.cancelAnimationFrame( frame );
			menu.destroy();
		};
	}, [] );

	const aligned = delta && delta.dx === 0 && delta.dy === 5;

	return (
		<div
			style={ {
				border: '1px dashed var(--pmdk-color-border-strong)',
				borderRadius: 8,
				padding: 16,
				minHeight: 150,
				...wrapperStyle,
			} }
		>
			<p
				style={ {
					margin: '0 0 12px',
					fontSize: 'var(--pmdk-font-size-caption)',
					color: 'var(--pmdk-color-text-muted)',
				} }
			>
				{ label }
			</p>
			<div
				className="pmdk-row-actions"
				data-menu
				ref={ rootRef }
				style={ { justifyContent: 'flex-start' } }
			>
				<button
					className="pmdk-row-action pmdk-row-action-icon"
					data-menu-trigger
					type="button"
					aria-label={ `Record actions — ${ label }` }
				>
					{ defaultRenderIcon( 'moreVertical' ) }
				</button>
				<div
					className="pmdk-row-action-menu"
					role="menu"
					aria-label={ `Record actions — ${ label }` }
					hidden
				>
					<button type="button" role="menuitem" data-action="view">
						{ defaultRenderIcon( 'list' ) }
						<span>View details</span>
					</button>
					<button type="button" role="menuitem" data-action="export">
						{ defaultRenderIcon( 'csv' ) }
						<span>Export record</span>
					</button>
				</div>
			</div>
			<p
				style={ {
					margin: '96px 0 0',
					fontSize: 'var(--pmdk-font-size-caption)',
					color: aligned
						? 'var(--pmdk-color-success)'
						: 'var(--pmdk-color-danger)',
				} }
			>
				{ delta
					? `${ aligned ? 'aligned' : 'OFFSET' } — dx ${ delta.dx }px · dy ${ delta.dy }px`
					: 'measuring…' }
			</p>
		</div>
	);
}

export const MenuFixedInsideContainment = {
	render: () => (
		<Chassis>
			<div
				style={ {
					display: 'grid',
					gap: 16,
					gridTemplateColumns:
						'repeat( auto-fit, minmax( 240px, 1fr ) )',
				} }
			>
				<AlignmentProbe label="No containment (baseline)" />
				<AlignmentProbe
					label="container-type: inline-size"
					wrapperStyle={ { containerType: 'inline-size' } }
				/>
				<AlignmentProbe
					label="transform: translateZ(0)"
					wrapperStyle={ { transform: 'translateZ(0)' } }
				/>
				<AlignmentProbe
					label="filter: saturate(1)"
					wrapperStyle={ { filter: 'saturate(1)' } }
				/>
				<AlignmentProbe
					label="contain: layout"
					wrapperStyle={ { contain: 'layout' } }
				/>
				<AlignmentProbe
					label="transform + overflow: hidden (clips)"
					wrapperStyle={ {
						transform: 'translateZ(0)',
						overflow: 'hidden',
					} }
				/>
			</div>
		</Chassis>
	),
};
