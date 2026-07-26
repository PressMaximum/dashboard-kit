/**
 * K-043 — CONSUMER EXAMPLE: a Settings page, the Aponto/PressListing way.
 *
 * Everything OUTSIDE <SettingsShell> here is product-side by design (K-043
 * + SPEC §5.14): the TREE itself (ids, labels, icons, groupings), the hash
 * routing, the panel schema and field copy, the dirty buffer, the save
 * handler, and the page header. The kit contributes the chassis — the
 * grid, the rail's interaction + a11y contract, the named content region,
 * the flush-bleed container mode and the ≤820px collapse.
 *
 * The two settings surfaces the kit already shipped are composed AS IS,
 * with zero edits: <SchemaForm> renders the active section's panel and
 * <SaveBar> sticks to the bottom of the content column (its DS sticky
 * chrome already ships in primitives/save-bar.css). If this story renders
 * and behaves, the K-043 boundary holds.
 */

import { useMemo, useState } from '@wordpress/element';
import '../../src/primitives/style.css';
import '../../src/themes/app.css';
import {
	SettingsShell,
	createSettingsTree,
} from '../../src/settings-shell/index.mjs';
import SchemaForm from '../../src/settings/SchemaForm.jsx';
import { BASE_FIELD_TYPES } from '../../src/settings/fieldTypes.jsx';
import SaveBar from '../../src/settings/SaveBar.jsx';
import ListPageHeader from '../../src/layouts/ListPageHeader/index.jsx';
import { Chassis } from '../helpers/Chassis.jsx';
import { defaultRenderIcon } from '../../src/table/index.mjs';

export default {
	title: 'SettingsShell/SettingsPage',
	parameters: { layout: 'fullscreen' },
};

/* ── product-side IA: the tree, its copy and its glyphs ─────────────── */
const TREE = [
	{
		id: 'general',
		label: 'General',
		icon: defaultRenderIcon( 'sliders' ),
		children: [
			{ id: 'business', label: 'Business', panel: 'business' },
			{ id: 'localization', label: 'Localization', panel: 'localization' },
		],
	},
	{
		id: 'booking',
		label: 'Booking',
		icon: defaultRenderIcon( 'list' ),
		children: [
			{ id: 'policy', label: 'Policy', panel: 'policy' },
			{ id: 'form', label: 'Form presentation', panel: 'form' },
		],
	},
	{
		id: 'notifications',
		label: 'Notifications',
		icon: defaultRenderIcon( 'check' ),
		description: 'Templates, sender and send log',
		panel: 'notifications',
	},
	{
		id: 'advanced',
		label: 'Advanced',
		icon: defaultRenderIcon( 'search' ),
		description: 'Diagnostics, logs and uninstall',
		panel: 'advanced',
	},
];

/* ── product-side schema: one panel per leaf ────────────────────────── */
const PANELS = {
	business: {
		id: 'business',
		label: 'Business',
		description: 'How the business identifies itself to customers.',
		fields: [
			{ id: 'name', label: 'Business name', type: 'text' },
			{
				id: 'email',
				label: 'Contact email',
				description: 'Where booking notifications are sent.',
				type: 'text',
			},
			{
				id: 'public',
				label: 'List publicly',
				description: 'Show this business in the public directory.',
				type: 'boolean',
			},
		],
	},
	localization: {
		id: 'localization',
		label: 'Localization',
		description: 'Formats customers see.',
		fields: [
			{
				id: 'timezone',
				label: 'Time zone',
				type: 'select',
				options: [
					{ value: 'utc', label: 'UTC' },
					{ value: 'ict', label: 'Asia/Ho_Chi_Minh' },
				],
			},
			{
				id: 'week_start',
				label: 'Week starts on',
				type: 'radio',
				options: [
					{ value: 'mon', label: 'Monday' },
					{ value: 'sun', label: 'Sunday' },
				],
			},
		],
	},
	policy: {
		id: 'policy',
		label: 'Policy',
		description: 'Booking rules applied at checkout.',
		fields: [
			{ id: 'lead_time', label: 'Lead time (hours)', type: 'number' },
			{ id: 'allow_cancel', label: 'Allow cancellation', type: 'boolean' },
		],
	},
	form: {
		id: 'form',
		label: 'Form presentation',
		description: 'What the booking form shows.',
		fields: [ { id: 'show_notes', label: 'Notes field', type: 'boolean' } ],
	},
	notifications: {
		id: 'notifications',
		label: 'Notifications',
		description: 'One surface, one save — this section is a leaf.',
		fields: [
			{ id: 'confirm_email', label: 'Confirmation email', type: 'boolean' },
			{ id: 'reminder', label: 'Reminder email', type: 'boolean' },
		],
	},
	advanced: {
		id: 'advanced',
		label: 'Advanced',
		description: 'Diagnostics and destructive operations.',
		fields: [
			{ id: 'debug', label: 'Debug logging', type: 'boolean' },
			{ id: 'purge_days', label: 'Purge logs after (days)', type: 'number' },
		],
	},
};

function SettingsPage( { initial } ) {
	// The kit helper resolves the tree; the PRODUCT owns where the route
	// comes from. A real consumer feeds it `location.hash` — the story
	// keeps it in state so Storybook's iframe hash stays out of the way.
	const ia = useMemo( () => createSettingsTree( TREE ), [] );
	const [ route, setRoute ] = useState(
		() => ia.resolve( initial || [] ),
	);
	const [ values, setValues ] = useState( {
		business: { name: 'Aponto Studio', email: 'ops@example.com', public: true },
		localization: { timezone: 'ict', week_start: 'mon' },
		policy: { lead_time: 12, allow_cancel: true },
		form: { show_notes: true },
		notifications: { confirm_email: true, reminder: false },
		advanced: { debug: false, purge_days: 30 },
	} );
	const [ isDirty, setIsDirty ] = useState( false );

	const section = ia.section( route.parent, route.child );
	const panel = PANELS[ section.source?.panel ] || null;

	const onFieldChange = ( panelId, fieldId, next ) => {
		setIsDirty( true );
		setValues( ( prev ) => ( {
			...prev,
			[ panelId ]: { ...( prev[ panelId ] || {} ), [ fieldId ]: next },
		} ) );
	};

	return (
		<SettingsShell
			tree={ TREE }
			activeParent={ route.parent }
			activeChild={ route.child }
			onSelect={ ( parent, child ) => setRoute( { parent, child } ) }
			// Product copy: the region announces the section the user is on.
			regionLabel={ section.label }
			header={
				<ListPageHeader
					title="Settings"
					description={ ia.subline( section.parent ) }
				/>
			}
		>
			<SchemaForm
				panel={ panel }
				values={ values }
				onFieldChange={ onFieldChange }
				fieldTypes={ BASE_FIELD_TYPES }
			/>
			<SaveBar
				isDirty={ isDirty }
				isSaving={ false }
				onSave={ () => {
					setIsDirty( false );
					return Promise.resolve();
				} }
				onReset={ () => Promise.resolve() }
			/>
		</SettingsShell>
	);
}

export const BranchSection = {
	name: 'Consumer recipe — branch section',
	render: () => (
		<Chassis>
			<SettingsPage initial={ [ 'general', 'business' ] } />
		</Chassis>
	),
};

export const LeafSection = {
	name: 'Consumer recipe — leaf section (no open branch)',
	render: () => (
		<Chassis>
			<SettingsPage initial={ [ 'advanced' ] } />
		</Chassis>
	),
};

export const ThemeAppDark = {
	name: 'Consumer recipe — theme-app dark',
	render: () => (
		<Chassis theme scheme="dark">
			<SettingsPage initial={ [ 'general', 'localization' ] } />
		</Chassis>
	),
};
