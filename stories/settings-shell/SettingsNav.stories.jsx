/**
 * K-043 component matrix — every rail state side by side, so a look
 * regression in ONE of them is visible without driving the page story.
 *
 * Rendered without <SettingsShell> on purpose: the rail is exported
 * standalone (a consumer with its own layout can use it alone), and the
 * matrix is about the node chrome, not the grid.
 */

import '../../src/primitives/style.css';
import '../../src/themes/app.css';
import { SettingsNav } from '../../src/settings-shell/index.mjs';
import { Chassis } from '../helpers/Chassis.jsx';
import { defaultRenderIcon } from '../../src/table/index.mjs';

export default {
	title: 'SettingsShell/SettingsNav',
	component: SettingsNav,
	parameters: { layout: 'padded' },
};

const TREE = [
	{
		id: 'general',
		label: 'General',
		icon: defaultRenderIcon( 'sliders' ),
		children: [
			{ id: 'business', label: 'Business' },
			{ id: 'localization', label: 'Localization' },
		],
	},
	{
		id: 'booking',
		label: 'Booking',
		icon: defaultRenderIcon( 'list' ),
		children: [
			{ id: 'policy', label: 'Policy' },
			{ id: 'form', label: 'Form presentation' },
		],
	},
	{
		id: 'notifications',
		label: 'Notifications',
		icon: defaultRenderIcon( 'check' ),
	},
	{ id: 'advanced', label: 'Advanced', icon: defaultRenderIcon( 'search' ) },
];

/* A tree with no glyphs at all — the icon track still reserves its 18px,
   so labels stay aligned whether or not the consumer supplies icons. */
const PLAIN_TREE = TREE.map( ( { icon, ...node } ) => node );

function Matrix( { rows } ) {
	return (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'repeat(3, 240px)',
				gap: 24,
				alignItems: 'start',
			} }
		>
			{ rows.map( ( row ) => (
				<div key={ row.caption }>
					<p
						style={ {
							margin: '0 0 8px',
							color: 'var(--pmdk-color-text-soft)',
							fontSize: 'var(--pmdk-font-size-caption)',
						} }
					>
						{ row.caption }
					</p>
					<SettingsNav
						tree={ row.tree || TREE }
						activeParent={ row.activeParent }
						activeChild={ row.activeChild }
						ariaLabel={ row.caption }
						idPrefix={ row.caption.replace( /\W+/g, '-' ) }
						onSelect={ () => {} }
					/>
				</div>
			) ) }
		</div>
	);
}

const ROWS = [
	{
		caption: 'Branch open, first child active',
		activeParent: 'general',
		activeChild: 'business',
	},
	{
		caption: 'Branch open, second child active',
		activeParent: 'booking',
		activeChild: 'form',
	},
	{
		caption: 'Leaf active, every branch collapsed',
		activeParent: 'advanced',
		activeChild: '',
	},
	{
		caption: 'Nothing active (pre-resolution)',
		activeParent: '',
		activeChild: '',
	},
	{
		caption: 'No consumer glyphs',
		tree: PLAIN_TREE,
		activeParent: 'general',
		activeChild: 'localization',
	},
];

export const States = {
	render: () => (
		<Chassis>
			<Matrix rows={ ROWS } />
		</Chassis>
	),
};

export const ThemeApp = {
	name: 'States — theme-app',
	render: () => (
		<Chassis theme>
			<Matrix rows={ ROWS } />
		</Chassis>
	),
};

export const ThemeAppDark = {
	name: 'States — theme-app dark',
	render: () => (
		<Chassis theme scheme="dark">
			<Matrix rows={ ROWS } />
		</Chassis>
	),
};
