import HelpPanel from '../src/core/HelpPanel.js';

export default {
	title: 'Core/HelpPanel',
	component: HelpPanel,
	parameters: {
		layout: 'centered',
	},
	tags: [ 'autodocs' ],
};

const sampleItems = [
	{
		id: 'documentation',
		label: 'Documentation',
		href: 'https://example.com/docs/',
	},
	{
		id: 'changelog',
		label: 'Changelog & roadmap',
		href: '#changelog',
	},
	{
		id: 'request-feature',
		label: 'Request a feature',
		href: 'https://example.com/feedback/',
	},
	{
		id: 'support',
		label: 'Contact support',
		href: 'https://example.com/support/',
	},
];

export const Default = {
	args: {
		items: sampleItems,
	},
};

export const WithCustomLabels = {
	args: {
		items: sampleItems,
		labels: {
			triggerLabel: 'Aide',
			heading: 'AIDE',
		},
	},
};

export const SingleExternalItem = {
	args: {
		items: [ sampleItems[ 0 ] ],
	},
};
