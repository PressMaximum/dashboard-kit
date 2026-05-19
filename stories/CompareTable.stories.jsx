import CompareTable from '../src/compare/CompareTable.jsx';

export default {
	title: 'Compare/CompareTable',
	component: CompareTable,
	parameters: { layout: 'padded' },
	tags: [ 'autodocs' ],
};

const SECTIONS = [
	{
		id: 'design',
		label: 'Design tools',
		rows: [
			{ id: 'patterns', label: 'Block patterns', free: true, pro: true },
			{
				id: 'global-css',
				label: 'Global CSS editor',
				free: false,
				pro: true,
			},
			{
				id: 'theme-json',
				label: 'theme.json overrides',
				free: 'Read-only',
				pro: 'Editable',
			},
		],
	},
	{
		id: 'performance',
		label: 'Performance',
		rows: [
			{ id: 'lazy', label: 'Lazy-load images', free: true, pro: true },
			{
				id: 'critical-css',
				label: 'Critical CSS generator',
				free: false,
				pro: true,
			},
			{
				id: 'cdn',
				label: 'Built-in CDN',
				free: false,
				pro: { value: 'Coming soon', muted: true },
			},
		],
	},
];

export const Default = {
	args: {
		sections: SECTIONS,
	},
};

export const WithFooterCta = {
	args: {
		sections: SECTIONS,
		footer: {
			title: 'Ready to unlock Pro?',
			description:
				'30-day money-back guarantee. Lifetime updates included.',
			ctaLabel: 'Upgrade to Pro',
			ctaHref: 'https://example.com/pro',
		},
	},
};

export const LocalizedLabels = {
	args: {
		sections: SECTIONS,
		labels: {
			headFeature: 'Tính năng',
			headFree: 'Miễn phí',
			headPro: 'Pro',
		},
	},
};
