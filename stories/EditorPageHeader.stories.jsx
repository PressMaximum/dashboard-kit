import { Button } from '@wordpress/components';

import EditorPageHeader from '../src/layouts/EditorPageHeader/index.jsx';

export default {
	title: 'Layouts/EditorPageHeader',
	component: EditorPageHeader,
	parameters: {
		layout: 'padded',
	},
	tags: [ 'autodocs' ],
};

export const Default = {
	args: {
		title: 'Untitled surface',
		backHref: '#surfaces',
		backLabel: 'Back to Surfaces',
	},
};

export const WithStatusAndActions = {
	args: {
		title: 'Footer surface',
		backHref: '#surfaces',
		backLabel: 'Back to Surfaces',
		status: <>Saved</>,
		actions: (
			<>
				<Button variant="tertiary">Duplicate</Button>
				<Button variant="primary">Save changes</Button>
			</>
		),
	},
};

export const LongTitleEllipsis = {
	args: {
		title: 'A really long entity title that should ellipsize once the inline-flex container reaches its limit and keep the status badge and actions on the same row',
		backHref: '#surfaces',
		backLabel: 'Back',
	},
};
