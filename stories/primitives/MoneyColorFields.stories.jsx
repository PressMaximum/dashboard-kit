/**
 * KIT-P3 slice 1 — money field + colour picker field.
 *
 * Money: LTR-isolated compact field with a leading currency glyph zone (25px
 * inline inset for input text AND floating label). Colour: one compact hex
 * input composed with a native `input[type=color]` — the visible swatch IS the
 * picker control (DESIGN-SYSTEM: fields).
 */

import '../../src/primitives/style.css';
import '../../src/themes/app.css';
import { Chassis } from '../helpers/Chassis.jsx';

export default {
	title: 'Primitives/MoneyColorFields',
	parameters: { layout: 'padded' },
};

function Fields() {
	return (
		<div
			style={ {
				maxWidth: 380,
				display: 'flex',
				flexDirection: 'column',
				gap: 10,
			} }
		>
			<label className="pmdk-compact-field pmdk-money-field is-filled">
				<input type="text" placeholder=" " defaultValue="120.00" />
				<span
					aria-hidden="true"
					style={ {
						position: 'absolute',
						insetInlineStart: 12,
						bottom: 8,
						color: 'var(--pmdk-color-text-soft)',
						fontSize: 'var(--pmdk-font-size-field-value)',
					} }
				>
					$
				</span>
				<span className="pmdk-compact-label">Price</span>
			</label>
			<div className="pmdk-color-picker-field">
				<label className="pmdk-compact-field is-filled">
					<input
						type="text"
						placeholder=" "
						defaultValue="#3366FF"
					/>
					<span className="pmdk-compact-label">Accent colour</span>
				</label>
				<input
					type="color"
					defaultValue="#3366ff"
					aria-label="Pick accent colour"
				/>
			</div>
		</div>
	);
}

export const Default = {
	render: () => (
		<Chassis>
			<Fields />
		</Chassis>
	),
};

export const ThemeAppDark = {
	render: () => (
		<Chassis theme scheme="dark">
			<Fields />
		</Chassis>
	),
};
