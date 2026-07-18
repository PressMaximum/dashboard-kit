/**
 * KIT-P3 slice 1 — button + icon-button primitives.
 *
 * CSS-only primitives: stories render the documented markup contract against
 * `primitives/style.css`. Variants per the DS button decision table: neutral,
 * primary (one per cluster), text, destructive, icon-only; sm tier; disabled.
 */

import '../../src/primitives/style.css';
import '../../src/themes/app.css';
import { Chassis } from '../helpers/Chassis.jsx';
import { defaultRenderIcon } from '../../src/table/icons.jsx';

export default {
	title: 'Primitives/Buttons',
	parameters: { layout: 'padded' },
};

function ButtonRows() {
	return (
		<div
			style={ {
				display: 'flex',
				flexDirection: 'column',
				gap: 16,
				alignItems: 'flex-start',
			} }
		>
			<div style={ { display: 'flex', gap: 8 } }>
				<button className="pmdk-button" type="button">
					Neutral
				</button>
				<button className="pmdk-button primary" type="button">
					Primary
				</button>
				<button className="pmdk-button text" type="button">
					Text action
				</button>
				<button className="pmdk-button danger" type="button">
					Delete record
				</button>
			</div>
			<div style={ { display: 'flex', gap: 8 } }>
				<button className="pmdk-button sm" type="button">
					Small neutral
				</button>
				<button className="pmdk-button primary sm" type="button">
					{ defaultRenderIcon( 'plus' ) }
					<span>New record</span>
				</button>
				<button
					className="pmdk-button icon-only"
					type="button"
					aria-label="More actions"
				>
					{ defaultRenderIcon( 'moreVertical' ) }
				</button>
				<button
					className="pmdk-icon-button"
					type="button"
					aria-label="Help"
				>
					{ defaultRenderIcon( 'search' ) }
				</button>
			</div>
			<div style={ { display: 'flex', gap: 8 } }>
				<button className="pmdk-button" type="button" disabled>
					Disabled neutral
				</button>
				<button
					className="pmdk-button primary"
					type="button"
					disabled
				>
					Disabled primary
				</button>
			</div>
		</div>
	);
}

export const Default = {
	render: () => (
		<Chassis>
			<ButtonRows />
		</Chassis>
	),
};

export const ThemeApp = {
	render: () => (
		<Chassis theme>
			<ButtonRows />
		</Chassis>
	),
};

export const ThemeAppDark = {
	render: () => (
		<Chassis theme scheme="dark">
			<ButtonRows />
		</Chassis>
	),
};
