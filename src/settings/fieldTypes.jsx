/**
 * BASE_FIELD_TYPES — the kit's built-in field renderers for SchemaField
 * dispatch. SPEC §5.4 + §9.1 `{ns}.dashboard.settings.field-types` filter.
 *
 * Each renderer receives `{ field, value, onChange }`:
 *   - `field` — the field schema (id, label, description, type, options?,
 *     min/max/step? for numbers, etc.)
 *   - `value` — current resolved value (saved + dirty merge from
 *     `createSettingsStore.getSettings()`)
 *   - `onChange` — emits the next value; the SchemaForm caller wires
 *     this to `store.edit(path, value)`.
 *
 * Consumers extend the map via their own filter — kit doesn't apply the
 * filter itself because it would need to know the consumer's namespace.
 * Typical usage:
 *
 *   import { BASE_FIELD_TYPES } from '@pressmaximum/dashboard-kit';
 *   import { applyFilters } from '@wordpress/hooks';
 *   import { createFilterNamespace } from '@pressmaximum/dashboard-kit';
 *
 *   const FILTERS = createFilterNamespace('customify');
 *   const fieldTypes = applyFilters(
 *       FILTERS.settingsFieldTypes,
 *       { ...BASE_FIELD_TYPES }
 *   );
 *   // ...then pass `fieldTypes` to <SchemaForm>.
 */

import {
	ToggleControl,
	SelectControl,
	TextControl,
	RadioControl,
	RangeControl,
} from '@wordpress/components';

function BooleanField( { field, value, onChange } ) {
	return (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ field.label }
			help={ field.description }
			checked={ Boolean( value ) }
			onChange={ onChange }
		/>
	);
}

function SelectField( { field, value, onChange } ) {
	const options = Array.isArray( field.options ) ? field.options : [];
	return (
		<SelectControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ field.label }
			help={ field.description }
			value={ value === null || value === undefined ? '' : String( value ) }
			options={ options.map( ( opt ) => ( {
				value: opt.value,
				label: opt.label,
			} ) ) }
			onChange={ onChange }
		/>
	);
}

function RadioField( { field, value, onChange } ) {
	const options = Array.isArray( field.options ) ? field.options : [];
	return (
		<RadioControl
			label={ field.label }
			help={ field.description }
			selected={ value === null || value === undefined ? '' : String( value ) }
			options={ options.map( ( opt ) => ( {
				value: opt.value,
				label: opt.label,
			} ) ) }
			onChange={ onChange }
		/>
	);
}

function TextField( { field, value, onChange } ) {
	return (
		<TextControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ field.label }
			help={ field.description }
			value={ value === null || value === undefined ? '' : String( value ) }
			onChange={ onChange }
			pattern={ field.pattern }
			maxLength={ field.maxLength }
		/>
	);
}

function NumberField( { field, value, onChange } ) {
	const hasRange =
		Number.isFinite( field.min ) || Number.isFinite( field.max );
	if ( hasRange ) {
		return (
			<RangeControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ field.label }
				help={ field.description }
				value={ Number( value ) || 0 }
				min={ Number.isFinite( field.min ) ? field.min : undefined }
				max={ Number.isFinite( field.max ) ? field.max : undefined }
				step={ Number.isFinite( field.step ) ? field.step : 1 }
				onChange={ onChange }
			/>
		);
	}
	return (
		<TextControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			type="number"
			label={ field.label }
			help={ field.description }
			value={ value === null || value === undefined ? '' : String( value ) }
			step={ Number.isFinite( field.step ) ? field.step : undefined }
			onChange={ ( next ) =>
				onChange( next === '' ? null : Number( next ) )
			}
		/>
	);
}

export const BASE_FIELD_TYPES = {
	boolean: BooleanField,
	select: SelectField,
	radio: RadioField,
	text: TextField,
	number: NumberField,
};

export default BASE_FIELD_TYPES;
