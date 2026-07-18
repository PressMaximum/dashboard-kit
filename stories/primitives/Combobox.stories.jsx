/**
 * KIT-P3 slice 1 — headless combobox (searchable relationship picker).
 *
 * Proves the headless split: `buildComboboxMarkup()` emits the ARIA scaffold,
 * `createCombobox()` attaches behavior — no React inside the primitive. The
 * story is just a mount point. Keyboard: ArrowUp/Down + Home/End rove options,
 * Enter selects, Escape/outside-click closes and restores a valid selection.
 */

import { useEffect, useRef, useState } from 'react';
import '../../src/primitives/style.css';
import '../../src/themes/app.css';
import {
	createCombobox,
	buildComboboxMarkup,
} from '../../src/primitives/index.mjs';
import { Chassis } from '../helpers/Chassis.jsx';

export default {
	title: 'Primitives/Combobox',
	parameters: { layout: 'padded' },
};

const SERVICES = [
	'Consultation',
	'Deep tissue massage',
	'Facial treatment',
	'Haircut & style',
	'Manicure',
	'Personal training',
];

function ComboboxMount( { entity = false } ) {
	const hostRef = useRef( null );
	const [ value, setValue ] = useState( '' );

	useEffect( () => {
		const host = hostRef.current;
		if ( ! host ) {
			return undefined;
		}
		host.innerHTML = buildComboboxMarkup( {
			name: entity ? 'owner' : 'service',
			label: entity ? 'Search owner' : 'Service',
			options: SERVICES,
			selected: '',
			listId: entity ? 'owner-list' : 'service-list',
		} );
		if ( entity ) {
			host.querySelector( '.pmdk-combobox' ).classList.add(
				'is-entity',
			);
		}
		const combobox = createCombobox(
			host.querySelector( '.pmdk-combobox' ),
			{ onChange: ( next ) => setValue( next ) },
		);
		return () => combobox.destroy();
	}, [ entity ] );

	return (
		<div style={ { maxWidth: 380 } }>
			<div ref={ hostRef } />
			<p
				style={ {
					marginTop: 12,
					fontSize: 'var(--pmdk-font-size-caption)',
					color: 'var(--pmdk-color-text-muted)',
				} }
			>
				Committed value: <strong>{ value || '(none)' }</strong>
			</p>
		</div>
	);
}

export const Interactive = {
	render: () => (
		<Chassis>
			<ComboboxMount />
		</Chassis>
	),
};

export const ThemeApp = {
	render: () => (
		<Chassis theme>
			<ComboboxMount />
		</Chassis>
	),
};
