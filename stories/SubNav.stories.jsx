import SubNav from '../src/layouts/SubNav/index.jsx';

export default {
	title: 'Layouts/SubNav',
	component: SubNav,
	parameters: {
		layout: 'padded',
	},
	tags: [ 'autodocs' ],
};

const settingsPanels = [
	{ id: 'general', label: 'General', hash: '#settings/general' },
	{ id: 'performance', label: 'Performance', hash: '#settings/performance' },
	{ id: 'compat', label: 'Compatibility', hash: '#settings/compat' },
	{ id: 'advanced', label: 'Advanced', hash: '#settings/advanced' },
];

const changelogSources = [
	{ id: 'free', label: 'Free', hash: '#changelog/free' },
	{ id: 'pro', label: 'Pro', hash: '#changelog/pro' },
];

export const SettingsPanels = {
	args: {
		items: settingsPanels,
		activeId: 'general',
		ariaLabel: 'Settings panels',
	},
};

export const SettingsPanelsActiveMid = {
	args: {
		items: settingsPanels,
		activeId: 'performance',
		ariaLabel: 'Settings panels',
	},
};

export const ChangelogSources = {
	args: {
		items: changelogSources,
		activeId: 'free',
		ariaLabel: 'Changelog sources',
	},
};

/**
 * Renders nothing — the kit hides SubNav when fewer than 2 items
 * are registered (matches the SPEC §5.3 multi-source degrade rule).
 */
export const HiddenAtSingleItem = {
	args: {
		items: [ { id: 'free', label: 'Free', hash: '#changelog/free' } ],
		activeId: 'free',
		ariaLabel: 'Changelog sources',
	},
};
