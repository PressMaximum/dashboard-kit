/**
 * SchemaField — Tier-1 layout primitive (SPEC §5.13). Dispatches on
 * `field.type` against a consumer-supplied `fieldTypes` map; renders
 * nothing when the type isn't registered (consumer-facing typo / Pro
 * field type not yet loaded).
 *
 * Why prop-injection instead of context / hardcoded map?
 * The consumer applies their `{ns}.dashboard.settings.field-types`
 * filter once at the call site (typically in their Settings tab), spreads
 * the resolved map down. Keeps the kit unaware of any specific filter
 * namespace and lets the SchemaForm caller memoize the map.
 *
 * @example
 *   <SchemaField
 *       field={ { id: 'enable', label: 'Enable feature', type: 'boolean' } }
 *       value={ true }
 *       onChange={ (next) => store.edit('group.enable', next) }
 *       fieldTypes={ FIELD_TYPES }
 *   />
 */

export default function SchemaField( { field, value, onChange, fieldTypes } ) {
	if ( ! field || ! fieldTypes ) {
		return null;
	}
	const Component = fieldTypes[ field.type ];
	if ( ! Component ) {
		return null;
	}
	return <Component field={ field } value={ value } onChange={ onChange } />;
}
