/**
 * KIT-P3 slice 1 — compact field kit (floating-label fields).
 *
 * The constrained-editor field primitives: 56px single-line compact fields
 * with a floating label (empty label centers at field-value size; focus/value
 * floats it to field-label size), the top-anchored compact textarea exception,
 * the `.pmdk-compact-select` native select with reserved end-icon zone, the
 * two-column field grid and the value summary block. Behavior contract:
 * DESIGN-SYSTEM "Fields".
 */

import '../../src/primitives/style.css';
import '../../src/themes/app.css';
import { Chassis } from '../helpers/Chassis.jsx';
import { defaultRenderIcon } from '../../src/table/icons.jsx';

export default {
	title: 'Primitives/CompactFields',
	parameters: { layout: 'padded' },
};

function FieldKit() {
	return (
		<div style={ { maxWidth: 420 } }>
			<div className="pmdk-editor-section">
				<div className="pmdk-editor-section-head">
					<h3>Details</h3>
				</div>
				<label className="pmdk-compact-field">
					<input type="text" placeholder=" " />
					<span className="pmdk-compact-label">
						Record title (empty)
					</span>
				</label>
				<label className="pmdk-compact-field is-filled">
					<input type="text" placeholder=" " defaultValue="Aurora" />
					<span className="pmdk-compact-label">
						Record title (filled)
					</span>
				</label>
				<div className="pmdk-field-grid">
					<label className="pmdk-compact-field">
						<input type="date" placeholder=" " />
						<span className="pmdk-compact-label">Date</span>
					</label>
					<label className="pmdk-compact-field pmdk-compact-select">
						<select defaultValue="">
							<option value="" hidden />
							<option>Morning</option>
							<option>Afternoon</option>
						</select>
						<span className="pmdk-compact-label">Slot</span>
						<span className="pmdk-field-end-icon">
							{ defaultRenderIcon( 'chevronDown' ) }
						</span>
					</label>
				</div>
				<label className="pmdk-compact-field pmdk-compact-notes">
					<textarea placeholder=" " />
					<span className="pmdk-compact-label">
						Internal note (top-anchored)
					</span>
				</label>
				<div className="pmdk-value-summary">
					<div>
						<dt>Subtotal</dt>
						<dd>$120.00</dd>
					</div>
					<div>
						<dt>Tax</dt>
						<dd>$9.60</dd>
					</div>
					<div className="is-total">
						<dt>Total</dt>
						<dd>$129.60</dd>
					</div>
				</div>
			</div>
		</div>
	);
}

export const Default = {
	render: () => (
		<Chassis>
			<FieldKit />
		</Chassis>
	),
};

export const ThemeApp = {
	render: () => (
		<Chassis theme>
			<FieldKit />
		</Chassis>
	),
};

export const ThemeAppDark = {
	render: () => (
		<Chassis theme scheme="dark">
			<FieldKit />
		</Chassis>
	),
};
