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

/*
 * K-050 — the badge track can never starve the title.
 *
 * Every badge is `white-space:nowrap`, so under the old `auto` track a wide
 * cluster grew without limit and squeezed the copy column (measured 206px ->
 * 80px, titles ellipsing with room to spare). `fit-content(40%)` clamps the
 * track and `flex-wrap` lets the clamped cluster wrap onto a second row.
 *
 * Left card: the pathological cluster. Right card: a normal short cluster,
 * which must still resolve to max-content — i.e. render exactly as it did
 * before the fix. The two together are the regression lock.
 */
export const LongBadgeCluster = {
	render: () => (
		<Chassis>
			<div className="pmdk-module-grid">
				<PMDKModuleCard
					icon={ defaultRenderIcon( 'sliders' ) }
					meta="Operations · Module"
					title="Saved searches and alerts"
					description="A title that has room to breathe, next to a badge cluster that used to take it away."
					tier={ { label: 'Premium', variant: 'premium' } }
					badges={
						<>
							<span className="pmdk-module-phase">
								Coming in P4
							</span>
							<span className="pmdk-module-phase">
								Beta programme
							</span>
						</>
					}
					state="enabled"
					onToggle={ () => {} }
					action={
						<button className="pmdk-button text" type="button">
							Configure
						</button>
					}
				/>
				<PMDKModuleCard
					icon={ defaultRenderIcon( 'sliders' ) }
					meta="Operations · Module"
					title="Saved searches and alerts"
					description="The same card with a short cluster — the max-content path, unchanged by the clamp."
					tier={ { label: 'Free', variant: 'free' } }
					badges={ <span className="pmdk-module-phase">P4</span> }
					state="enabled"
					onToggle={ () => {} }
					action={
						<button className="pmdk-button text" type="button">
							Configure
						</button>
					}
				/>
			</div>
		</Chassis>
	),
};

/*
 * K-052 — `statusLabel` beside a LIVE toggle.
 *
 * Until 0.3.1 the slot only rendered where the toggle was absent (planned /
 * `toggle={false}`), so a toggleable card could not show a static footer note
 * and consumers pushed it into `action` instead. Left card: toggle + note.
 * Right card: the same card with no `statusLabel`, which must emit exactly the
 * DOM it always did — the absent-by-default half of the contract.
 */
export const ToggleWithStatusNote = {
	render: () => (
		<Chassis>
			<div className="pmdk-module-grid">
				<ToggleableCard
					icon={ defaultRenderIcon( 'sliders' ) }
					meta="Operations · Module"
					title="Saved searches"
					description="A live, toggleable module carrying a transient footer note."
					tier={ { label: 'Free', variant: 'free' } }
					state="enabled"
					statusLabel="Reload to apply"
					action={
						<button className="pmdk-button text" type="button">
							Configure
						</button>
					}
				/>
				<ToggleableCard
					icon={ defaultRenderIcon( 'sliders' ) }
					meta="Operations · Module"
					title="Saved searches"
					description="The same card with no statusLabel — unchanged footer."
					tier={ { label: 'Free', variant: 'free' } }
					state="enabled"
					action={
						<button className="pmdk-button text" type="button">
							Configure
						</button>
					}
				/>
			</div>
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

/*
 * K-023 / K-024 / K-025 — the first-consumer cases PressListing needed.
 *
 * Interaction/variant coverage, deliberately NOT in the VR matrix (the four
 * module-card shots there pin the DEFAULT look, which these props must not
 * move; the unit tests pin these behaviours instead).
 */
export const NonToggleableIntegration = {
	render: () => (
		<Chassis>
			<div className="pmdk-module-grid">
				{ /* K-023: a connected integration with no on/off switch —
				     configuration lives behind the deep link, so the card must
				     NOT ship a dead checkbox. `enabled` chrome is preserved,
				     unlike the `planned` workaround. */ }
				<PMDKModuleCard
					icon={ defaultRenderIcon( 'csv' ) }
					meta="Payments · Integration"
					title="Stripe"
					description="Card payments, hosted checkout and refunds."
					state="enabled"
					toggle={ false }
					statusLabel="Connected"
					integrationState="Connected as acct_1234"
					connected
					tier={ { label: 'Premium', variant: 'premium' } }
					action={
						<button className="pmdk-button text" type="button">
							Configure
						</button>
					}
				/>
				{ /* K-024: a marked-up title still gets a clean accessible
				     name, via titleText. Inspect the toggle: "Disable Stripe
				     Tax", not "Disable [object Object]". */ }
				<PMDKModuleCard
					icon={ defaultRenderIcon( 'list' ) }
					meta="Payments · Integration"
					title={
						<>
							Stripe Tax{ ' ' }
							<em className="pmdk-module-title-note">beta</em>
						</>
					}
					titleText="Stripe Tax"
					description="Automatic tax calculation at checkout."
					state="enabled"
					onToggle={ () => {} }
					tier={ { label: 'Premium', variant: 'premium' } }
				/>
				{ /* K-035: an icon from a FOREIGN renderer — the product's own
				     wrapper class, not the kit's `.pmdk-react-icon`. Before the
				     fix the <svg> carried only a viewBox, so the grid cell
				     collapsed it to 0x0 and the icon was invisible. It must now
				     match the kit-wrapped glyphs above, pixel for pixel. */ }
				<PMDKModuleCard
					icon={
						<span className="my-plugin-icon">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
								<rect x="3" y="3" width="18" height="18" rx="4" />
								<path d="M8 12h8M12 8v8" />
							</svg>
						</span>
					}
					meta="Payments · Integration"
					title="Foreign icon wrapper"
					description="Icon wrapped by the product, not by defaultRenderIcon."
					state="enabled"
					onToggle={ () => {} }
				/>
				{ /* K-025: the opt-in free variant — the green tier badge that
				     shipped in the chrome but nothing could reach. Consumers
				     that pass `{ label: 'Free' }` with no variant keep the bare
				     badge, so no shipped look changes. */ }
				<PMDKModuleCard
					icon={ defaultRenderIcon( 'sliders' ) }
					meta="Communication · Module"
					title="Notifications"
					description="Email confirmations for every record."
					state="enabled"
					onToggle={ () => {} }
					tier={ { label: 'Free', variant: 'free' } }
				/>
			</div>
		</Chassis>
	),
};
