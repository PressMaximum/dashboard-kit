import PageWrapper from '../src/layouts/PageWrapper/index.jsx';

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
					PageWrapper provides the DataViews-friendly flex chain
					(`flex: 1 1 auto` + `min-width: 0` + `min-height: 0` +
					`width: 100%` + `height: 100%`) so child grid layouts
					compute a non-zero `containerWidth` on first mount.
					See <code>Validation/PageWrapper × DataViews</code>{ ' ' }
					for the SPEC §11 hack #3 fixture.
				</p>
			</>
		),
	},
};
