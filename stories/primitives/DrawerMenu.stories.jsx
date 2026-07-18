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
