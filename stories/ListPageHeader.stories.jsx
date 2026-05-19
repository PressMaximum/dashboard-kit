import { Button } from '@wordpress/components';

import ListPageHeader from '../src/layouts/ListPageHeader/index.jsx';

export default {
	title: 'Layouts/ListPageHeader',
	component: ListPageHeader,
	parameters: {
		layout: 'padded',
	},
	tags: [ 'autodocs' ],
};

export const TitleOnly = {
	args: {
		title: 'Surfaces',
	},
};

export const WithDescription = {
	args: {
		title: 'Surfaces',
		description:
			'Reusable design surfaces that consumers can drop into theme.json palettes or block patterns.',
	},
};

export const WithActions = {
	args: {
		title: 'Surfaces',
		description: 'Reusable design surfaces.',
		actions: (
			<>
				<Button variant="secondary">Import</Button>
				<Button variant="primary">Add new</Button>
			</>
		),
	},
};
