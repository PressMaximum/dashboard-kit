import PageWrapper from '../src/layouts/PageWrapper/index.js';

export default {
	title: 'Layouts/PageWrapper',
	component: PageWrapper,
	parameters: {
		layout: 'padded',
	},
	tags: [ 'autodocs' ],
};

export const Default = {
	args: {
		children: (
			<>
				<h2>Inside the wrapper</h2>
				<p>
					PageWrapper provides a flex column that lets direct
					children fill the available width via `flex: 1`. P2
					adds the DataViews-friendly width sensor.
				</p>
			</>
		),
	},
};
