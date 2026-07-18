/**
 * KIT-P3 slice 4 — avatar, tabs, toast, save-bar chrome.
 *
 * Avatar: one uppercase letter, one shared quiet tint (no per-record color
 * cycling). Tabs: `.pmdk-section-tabs` + `createTablist` (Left/Right/Home/End
 * with wrap; count badges optional). Toast: transient confirmation, `.show`
 * state. Save bar: the DS chrome for `.pmdk-save-bar` — unified with the
 * core SaveBar component in KIT-P4 (see the SaveBarUnifiedComponent
 * stories: one component, chrome opt-in via primitives/style.css).
 */

import { useEffect, useRef, useState } from 'react';
import '../../src/primitives/style.css';
import '../../src/themes/app.css';
import { createTablist } from '../../src/primitives/index.mjs';
import SaveBarComponent from '../../src/settings/SaveBar.jsx';
import { Chassis } from '../helpers/Chassis.jsx';

export default {
	title: 'Primitives/FeedbackShell',
	parameters: { layout: 'padded' },
};

export const Avatars = {
	render: () => (
		<Chassis>
			<div style={ { display: 'flex', gap: 12, alignItems: 'center' } }>
				<span className="pmdk-avatar">A</span>
				<span className="pmdk-avatar">M</span>
				<span className="pmdk-avatar">Z</span>
				<span className="pmdk-avatar is-large">K</span>
			</div>
		</Chassis>
	),
};

function TabsMount() {
	const rootRef = useRef( null );
	const [ active, setActive ] = useState( 'Upcoming' );

	useEffect( () => {
		const root = rootRef.current;
		if ( ! root ) {
			return undefined;
		}
		const tablist = createTablist( root, {
			onChange: ( tab ) =>
				setActive( tab.textContent.replace( /\d+$/, '' ).trim() ),
		} );
		return () => tablist.destroy();
	}, [] );

	return (
		<div>
			<div className="pmdk-section-tabs" ref={ rootRef }>
				<button role="tab" aria-selected="true" type="button">
					Upcoming <span>3</span>
				</button>
				<button role="tab" aria-selected="false" type="button">
					Past
				</button>
				<button role="tab" aria-selected="false" type="button">
					Cancelled <span>1</span>
				</button>
			</div>
			<p
				style={ {
					fontSize: 'var(--pmdk-font-size-caption)',
					color: 'var(--pmdk-color-text-muted)',
				} }
			>
				Active view: <strong>{ active }</strong> — arrows move with
				wrap-around; the panel swap stays product-side.
			</p>
		</div>
	);
}

export const Tabs = {
	render: () => (
		<Chassis>
			<TabsMount />
		</Chassis>
	),
};

export const TabsThemeAppDark = {
	render: () => (
		<Chassis theme scheme="dark">
			<TabsMount />
		</Chassis>
	),
};

export const Toast = {
	render: () => (
		<Chassis>
			<div style={ { position: 'relative', minHeight: 120 } }>
				<p style={ { color: 'var(--pmdk-color-text-muted)' } }>
					The toast anchors to the workspace corner and never traps
					focus.
				</p>
				<div className="pmdk-toast show" role="status">
					Booking confirmed · notification sent.
				</div>
			</div>
		</Chassis>
	),
};

function SaveBarChrome() {
	return (
		<div style={ { paddingTop: 40 } }>
			<div className="pmdk-save-bar">
				<p>Unsaved changes to 2 settings.</p>
				<div className="pmdk-save-actions">
					<button className="pmdk-button" type="button">
						Discard
					</button>
					<button className="pmdk-button primary" type="button">
						Save changes
					</button>
				</div>
			</div>
		</div>
	);
}

export const SaveBar = {
	render: () => (
		<Chassis>
			<SaveBarChrome />
		</Chassis>
	),
};

export const SaveBarThemeAppDark = {
	render: () => (
		<Chassis theme scheme="dark">
			<SaveBarChrome />
		</Chassis>
	),
};

/* KIT-P4 unification proof: the CORE `<SaveBar>` component rendered under
   the primitives chassis. Same markup that ships the WP-native default in
   core-only consumers picks up the DS sticky chrome here — one component,
   one chrome sheet, two opt-in tiers. */
function SaveBarComponentMount( { isDirty } ) {
	return (
		<div style={ { paddingTop: 40 } }>
			<SaveBarComponent
				isDirty={ isDirty }
				isSaving={ false }
				onSave={ () => {} }
				onReset={ () => {} }
			/>
		</div>
	);
}

export const SaveBarUnifiedComponent = {
	render: () => (
		<Chassis theme>
			<SaveBarComponentMount isDirty />
		</Chassis>
	),
};

export const SaveBarUnifiedComponentDark = {
	render: () => (
		<Chassis theme scheme="dark">
			<SaveBarComponentMount isDirty />
		</Chassis>
	),
};
