import TabStrip from '../src/core/TabStrip.jsx';

export default {
	title: 'Core/TabStrip',
	component: TabStrip,
	parameters: {
		layout: 'padded',
	},
	tags: [ 'autodocs' ],
};

const sampleTabs = [
	{ id: 'welcome', label: 'Dashboard', hash: '#welcome' },
	{ id: 'settings', label: 'Settings', hash: '#settings' },
	{ id: 'templates', label: 'Starter Templates', hash: '#templates' },
	{ id: 'free-vs-pro', label: 'Free vs Pro', hash: '#free-vs-pro' },
];

export const Default = {
	args: {
		items: sampleTabs,
		activeId: 'welcome',
		ariaLabel: 'Dashboard sections',
	},
};

export const ActiveMidStrip = {
	args: {
		items: sampleTabs,
		activeId: 'settings',
		ariaLabel: 'Dashboard sections',
	},
};

export const SingleTab = {
	args: {
		items: [ { id: 'welcome', label: 'Dashboard', hash: '#welcome' } ],
		activeId: 'welcome',
		ariaLabel: 'Dashboard sections',
	},
};
