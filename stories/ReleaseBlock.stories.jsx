import ReleaseBlock from '../src/changelog/ReleaseBlock.jsx';

export default {
	title: 'Changelog/ReleaseBlock',
	component: ReleaseBlock,
	parameters: { layout: 'padded' },
	tags: [ 'autodocs' ],
};

const RELEASE_CURRENT = {
	version: '1.4.0',
	date: 'May 12, 2026',
	current: true,
	items: [
		{ category: 'added', text: 'Welcome dashboard with onboarding checklist.' },
		{ category: 'improved', text: 'Settings save flow now retries on transient failures.' },
		{ category: 'fixed', text: 'Tab strip underline no longer flashes on first paint.' },
		{ category: 'security', text: 'Tightened nonce validation on settings POST.' },
		{ category: 'deprecated', text: 'Legacy `bsy-*` CSS classes — use `pmdk-*` instead.' },
	],
};

const RELEASE_PRIOR = {
	version: '1.3.2',
	date: 'April 28, 2026',
	items: [
		{ category: 'fixed', text: 'Help panel chevron now points right for hash links.' },
		{ category: 'updated', text: 'Bumped DataViews peer to ≥14.0.' },
		{ category: 'unknown-thing', text: 'Drift-tolerant category renders with neutral tone.' },
	],
};

export const Current = {
	args: {
		release: RELEASE_CURRENT,
	},
};

export const Prior = {
	args: {
		release: RELEASE_PRIOR,
	},
};

export const LocalizedCategoryLabels = {
	args: {
		release: RELEASE_CURRENT,
		labels: { currentBadge: 'Hiện hành' },
		categoryLabels: {
			added: 'Mới',
			improved: 'Cải tiến',
			fixed: 'Đã sửa',
			security: 'Bảo mật',
			deprecated: 'Đã ngừng',
		},
	},
};
