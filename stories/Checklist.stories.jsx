import Checklist from '../src/welcome/Checklist.jsx';

export default {
	title: 'Welcome/Checklist',
	component: Checklist,
	parameters: { layout: 'padded' },
	tags: [ 'autodocs' ],
};

const BASE_ITEMS = [
	{
		id: 'install',
		label: 'Install the plugin',
		description: 'Detected automatically — no action needed.',
		check: () => true,
	},
	{
		id: 'configure',
		label: 'Configure performance settings',
		description: 'Choose lazy-load + critical CSS defaults.',
		check: () => false,
		ctaLabel: 'Open Settings',
		ctaHref: '#settings',
	},
	{
		id: 'site-editor',
		label: 'Visit the Site Editor',
		description: 'Confirm the theme renders with Blocksify enabled.',
		check: () => Promise.resolve( false ),
		ctaLabel: 'Open Site Editor',
		ctaHref: 'https://example.com/wp-admin/site-editor.php',
	},
];

export const Default = {
	args: {
		items: BASE_ITEMS,
		ariaLabel: 'Onboarding checklist',
	},
};

export const AllCompleted = {
	args: {
		items: BASE_ITEMS.map( ( item ) => ( {
			...item,
			check: () => true,
		} ) ),
		ariaLabel: 'Onboarding checklist',
	},
};

export const Empty = {
	args: {
		items: [],
	},
};
