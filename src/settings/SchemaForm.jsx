/**
 * SchemaForm — Tier-1 layout primitive (SPEC §5.13). Renders ONE panel
 * — the consumer resolves "which panel is active" externally (route
 * param + sub-nav) so the kit doesn't own that state.
 *
 * SPEC §5.4 panel shape:
 *
 *   { id, label, description?, fields: SchemaField[] }     ← schema-driven
 *   { id, label, component: ComponentType }                ← Pro custom takeover
 *
 * Custom-panel takeover (the `component` branch) is how Pro replaces a
 * whole panel — receives `{ panel, values, onFieldChange }` exactly like
 * SchemaForm itself, so swapping in a custom component is transparent
 * to the parent.
 *
 * `values` is the merged settings snapshot from
 * `createSettingsStore.getSettings()` (saved + dirty). The form reads
 * `values[panel.id][field.id]` for each field — the dotted-path
 * convention `'panelId.fieldId'` is what `store.edit(path, value)`
 * accumulates into the dirty buffer.
 *
 * `fieldTypes` is the resolved map (kit `BASE_FIELD_TYPES` + consumer's
 * filter extensions) — see `fieldTypes.jsx` for the rationale of
 * prop-injection over context.
 */

import SchemaField from './SchemaField.jsx';

function getAtPath( target, group, key ) {
	if ( ! target || typeof target !== 'object' ) {
		return undefined;
	}
	const groupObj = target[ group ];
	if ( ! groupObj || typeof groupObj !== 'object' ) {
		return undefined;
	}
	return groupObj[ key ];
}

/**
 * Stable id for the panel heading element so external CardHeader copy
 * can reference it via `aria-labelledby`. Consumers that render their
 * own heading outside the form pass the same id to keep the AT chain.
 *
 * @param {string} id Panel id, e.g. `'performance'`.
 * @return {string} DOM id, e.g. `'pmdk-settings-panel-performance'`.
 */
export function panelHeadingId( id ) {
	return `pmdk-settings-panel-${ id }`;
}

export default function SchemaForm( {
	panel,
	values,
	onFieldChange,
	fieldTypes,
} ) {
	if ( ! panel ) {
		return null;
	}

	const headingId = panelHeadingId( panel.id );

	// Pro full-takeover branch: panel provides its own component instead
	// of a `fields` array. The custom component owns rendering + edit
	// dispatch entirely — kit just supplies the panel + merged values +
	// the onFieldChange callback so it can write back through the same
	// store action the schema-driven branch uses.
	if ( panel.component ) {
		const Custom = panel.component;
		return (
			<div role="group" aria-labelledby={ headingId }>
				<Custom
					panel={ panel }
					values={ values }
					onFieldChange={ onFieldChange }
				/>
			</div>
		);
	}

	return (
		<div
			className="pmdk-schema-form"
			role="group"
			aria-labelledby={ headingId }
		>
			{ ( panel.fields || [] ).map( ( field ) => (
				<SchemaField
					key={ field.id }
					field={ field }
					value={ getAtPath( values, panel.id, field.id ) }
					onChange={ ( next ) =>
						onFieldChange( panel.id, field.id, next )
					}
					fieldTypes={ fieldTypes }
				/>
			) ) }
		</div>
	);
}
