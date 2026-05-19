/**
 * SchemaForm — full-mount story with hand-built panels covering each
 * built-in field type. Exercises:
 *   - boolean (ToggleControl)
 *   - select (SelectControl)
 *   - radio (RadioControl)
 *   - text (TextControl)
 *   - number with min/max (RangeControl)
 *   - number without range (numeric TextControl)
 *   - Pro full-takeover panel via `component`
 */

import { useState } from '@wordpress/element';

import SchemaForm from '../src/settings/SchemaForm.jsx';
import { BASE_FIELD_TYPES } from '../src/settings/fieldTypes.jsx';

const PANEL_BASICS = {
	id: 'basics',
	label: 'Basics',
	description: 'Schema-driven panel covering every built-in field type.',
	fields: [
		{
			id: 'enable_feature',
			label: 'Enable feature',
			description: 'Toggle the headline feature on or off.',
			type: 'boolean',
		},
		{
			id: 'mode',
			label: 'Mode',
			description: 'How aggressively the feature applies.',
			type: 'select',
			options: [
				{ value: 'auto', label: 'Auto' },
				{ value: 'manual', label: 'Manual' },
				{ value: 'off', label: 'Off' },
			],
		},
		{
			id: 'theme',
			label: 'Theme',
			type: 'radio',
			options: [
				{ value: 'light', label: 'Light' },
				{ value: 'dark', label: 'Dark' },
			],
		},
		{
			id: 'label',
			label: 'Display label',
			description: 'Free-text label for the public-facing widget.',
			type: 'text',
		},
		{
			id: 'threshold',
			label: 'Threshold',
			description: 'Min/max range — renders as RangeControl.',
			type: 'number',
			min: 0,
			max: 100,
			step: 5,
		},
		{
			id: 'count',
			label: 'Count',
			description: 'Plain number field (no min/max → numeric TextControl).',
			type: 'number',
		},
	],
};

function CustomPanelBody( { panel, values } ) {
	return (
		<div
			style={ {
				padding: 16,
				background: '#f0f6ff',
				border: '1px dashed #c7d2fe',
				borderRadius: 4,
			} }
		>
			<p>
				<strong>{ panel.label } — Pro takeover</strong>
			</p>
			<p>
				The kit hands `panel`, `values`, and `onFieldChange` to a
				custom component. Receiving values:
			</p>
			<pre>{ JSON.stringify( values, null, 2 ) }</pre>
		</div>
	);
}

const PANEL_CUSTOM = {
	id: 'pro',
	label: 'Pro takeover',
	component: CustomPanelBody,
};

function Harness( { panel } ) {
	const [ values, setValues ] = useState( {
		basics: {
			enable_feature: true,
			mode: 'auto',
			theme: 'light',
			label: 'Headline',
			threshold: 30,
			count: 7,
		},
	} );

	const onFieldChange = ( panelId, fieldId, next ) => {
		setValues( ( prev ) => ( {
			...prev,
			[ panelId ]: {
				...( prev[ panelId ] || {} ),
				[ fieldId ]: next,
			},
		} ) );
	};

	return (
		<div style={ { maxWidth: 640 } }>
			<SchemaForm
				panel={ panel }
				values={ values }
				onFieldChange={ onFieldChange }
				fieldTypes={ BASE_FIELD_TYPES }
			/>
		</div>
	);
}

export default {
	title: 'Settings/SchemaForm',
	parameters: { layout: 'padded' },
};

export const SchemaDriven = {
	render: () => <Harness panel={ PANEL_BASICS } />,
};

export const ProTakeover = {
	render: () => <Harness panel={ PANEL_CUSTOM } />,
};
