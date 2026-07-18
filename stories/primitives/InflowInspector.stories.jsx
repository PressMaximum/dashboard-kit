/**
 * KIT-P3 slice 3 — in-flow inspector tier + resizer.
 *
 * The workspace plane: main content narrows when the inspector opens (no
 * backdrop, no body lock), the divider is the `.pmdk-inflow-resizer`
 * separator driven by `createInspectorResizer` — pointer drag, Arrow keys in
 * 16px steps, Home/End, width persisted under
 * `dashboard-kit.inspector-width.v1`. Behavior contract: DESIGN-SYSTEM
 * "Drawer versus in-flow inspector versus full page".
 */

import { useEffect, useRef } from 'react';
import '../../src/primitives/style.css';
import '../../src/themes/app.css';
import { createInspectorResizer } from '../../src/primitives/index.mjs';
import { Chassis } from '../helpers/Chassis.jsx';
import { defaultRenderIcon } from '../../src/table/index.mjs';

export default {
	title: 'Primitives/InflowInspector',
	parameters: { layout: 'fullscreen' },
};

function InspectorWorkspace() {
	const workspaceRef = useRef( null );

	useEffect( () => {
		const workspace = workspaceRef.current;
		if ( ! workspace ) {
			return undefined;
		}
		const resizer = createInspectorResizer( workspace, {
			// Stories must not leak state between refreshes/VR runs.
			storageKey: '',
		} );
		return () => resizer.destroy();
	}, [] );

	return (
		<div
			className="pmdk-inflow-workspace is-inspecting"
			ref={ workspaceRef }
			style={ { minHeight: 480 } }
		>
			<div className="pmdk-inflow-main">
				<h2 style={ { marginTop: 0 } }>Records</h2>
				<p style={ { color: 'var(--pmdk-color-text-muted)' } }>
					The list stays actionable while the inspector is open.
					Drag the divider (or focus it and use Arrow keys, Home,
					End) to resize the panel.
				</p>
			</div>
			<div
				className="pmdk-inflow-resizer"
				role="separator"
				tabIndex={ 0 }
				aria-orientation="vertical"
				aria-label="Resize panel"
			>
				<span data-resizer-value aria-hidden="true" />
			</div>
			<aside
				className="pmdk-inflow-inspector"
				style={ { display: 'flex', flexDirection: 'column' } }
			>
				<div
					className="pmdk-inflow-inspector-head"
					style={ { display: 'flex', gap: 10 } }
				>
					<span className="pmdk-avatar" aria-hidden="true">
						A
					</span>
					<div style={ { flex: 1 } }>
						<h2>Ava Chen</h2>
						<p>Record 014 · Consultation</p>
					</div>
					<button
						className="pmdk-icon-button"
						type="button"
						aria-label="Close panel"
					>
						{ defaultRenderIcon( 'close' ) }
					</button>
				</div>
				<div className="pmdk-drawer-body">
					<div className="pmdk-mini-stats">
						<div>
							<strong>12</strong>
							<span>Total records</span>
						</div>
						<div>
							<strong>$1,240</strong>
							<span>Lifetime value</span>
						</div>
						<div>
							<strong>2</strong>
							<span>Cancelled</span>
						</div>
					</div>
					<div className="pmdk-panel-section">
						<h4>Details</h4>
						<p>
							Read-only context first; a compact footer action
							transitions the same panel to Edit.
						</p>
					</div>
				</div>
				<div
					className="pmdk-drawer-foot"
					style={ {
						display: 'flex',
						gap: 8,
						justifyContent: 'flex-end',
					} }
				>
					<button className="pmdk-button sm" type="button">
						Edit record
					</button>
					<button className="pmdk-button primary sm" type="button">
						New booking
					</button>
				</div>
			</aside>
		</div>
	);
}

export const WorkspaceWithResizer = {
	render: () => (
		<Chassis>
			<InspectorWorkspace />
		</Chassis>
	),
};

export const ThemeApp = {
	render: () => (
		<Chassis theme>
			<InspectorWorkspace />
		</Chassis>
	),
};

export const ThemeAppDark = {
	render: () => (
		<Chassis theme scheme="dark">
			<InspectorWorkspace />
		</Chassis>
	),
};
