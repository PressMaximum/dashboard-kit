/**
 * KIT-P3 slice 4 + K-018 — <PMDKModuleCard>.
 *
 * The stories consume the COMPONENT (not hand-written chrome): kit ships
 * behavior + chrome + slots; everything passed as props here — icons, meta
 * copy, badge labels, descriptions, actions — is the product side of the
 * split. Anatomy per K-018 / DESIGN-SYSTEM "Cards and modules".
 */

import { useState } from 'react';
import '../../src/primitives/style.css';
import '../../src/themes/app.css';
import { PMDKModuleCard } from '../../src/module-card/index.mjs';
import { Chassis } from '../helpers/Chassis.jsx';
import { defaultRenderIcon } from '../../src/table/index.mjs';

export default {
	title: 'Primitives/ModuleCard',
	parameters: { layout: 'padded' },
};

function ToggleableCard( props ) {
	const [ enabled, setEnabled ] = useState( props.state === 'enabled' );
	let state = enabled ? 'enabled' : 'disabled';
	if ( props.state === 'planned' ) {
		state = 'planned';
	}
	return (
		<PMDKModuleCard
			{ ...props }
			state={ state }
			onToggle={ setEnabled }
		/>
	);
}

function Catalogue() {
	return (
		<div className="pmdk-module-grid">
			<ToggleableCard
				icon={ defaultRenderIcon( 'sliders' ) }
				meta="Communication · Module"
				title="Notifications"
				description="Email confirmations and reminders for every record."
				tier={ { label: 'Free' } }
				state="enabled"
				action={
					<button className="pmdk-button text" type="button">
						Configure
					</button>
				}
			/>
			<ToggleableCard
				icon={ defaultRenderIcon( 'csv' ) }
				meta="Insights · Module"
				title="Advanced reports"
				description="Cohorts, exports and scheduled summaries."
				tier={ { label: 'Premium', isPremium: true } }
				state="disabled"
				toggleDisabled
				action={
					<button className="pmdk-button text" type="button">
						Upgrade
					</button>
				}
			/>
			<PMDKModuleCard
				icon={ defaultRenderIcon( 'import' ) }
				meta="Sync · Integration"
				title="Integrations"
				description="Third-party sync — planned for a later phase."
				tier={ { label: 'Free' } }
				badges={ <span className="pmdk-module-phase">P3</span> }
				state="planned"
				plannedLabel="Planned"
				action={
					<button className="pmdk-button text" type="button">
						View roadmap
					</button>
				}
			/>
		</div>
	);
}

export const Catalogue3Up = {
	render: () => (
		<Chassis>
			<Catalogue />
		</Chassis>
	),
};

export const IntegrationStates = {
	render: () => (
		<Chassis>
			<div className="pmdk-module-grid">
				<ToggleableCard
					icon={ defaultRenderIcon( 'arrowRight' ) }
					meta="Payments · Integration"
					title="Stripe"
					description="Charge deposits at booking time."
					tier={ { label: 'Premium', isPremium: true } }
					state="enabled"
					integrationState="Connected as ops@example.com"
					connected
					action={
						<button className="pmdk-button text" type="button">
							Manage connection
						</button>
					}
				/>
				<ToggleableCard
					icon={ defaultRenderIcon( 'arrowRight' ) }
					meta="Calendars · Integration"
					title="Google Calendar"
					description="Two-way sync with staff calendars."
					tier={ { label: 'Free' } }
					state="disabled"
					integrationState="Not connected"
					action={
						<button className="pmdk-button text" type="button">
							Connect
						</button>
					}
				/>
			</div>
		</Chassis>
	),
};

export const ThemeApp = {
	render: () => (
		<Chassis theme>
			<Catalogue />
		</Chassis>
	),
};

export const ThemeAppDark = {
	render: () => (
		<Chassis theme scheme="dark">
			<Catalogue />
		</Chassis>
	),
};
