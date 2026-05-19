import EditorViewLayout from '../src/layouts/EditorViewLayout/index.jsx';

export default {
	title: 'Layouts/EditorViewLayout',
	component: EditorViewLayout,
	parameters: {
		layout: 'fullscreen',
	},
	tags: [ 'autodocs' ],
};

const sampleSubNav = (
	<ul style={ { listStyle: 'none', margin: 0, padding: 0 } }>
		<li style={ { padding: '4px 0' } }>General</li>
		<li style={ { padding: '4px 0', fontWeight: 600 } }>Conditions</li>
		<li style={ { padding: '4px 0' } }>Styles</li>
	</ul>
);

const sampleMain = (
	<div>
		<h3>Conditions</h3>
		<p>
			This main column receives the bulk of the editor surface. The
			subNav rail (left) and the actions/help rail (right) sit
			sticky alongside it on wide viewports.
		</p>
	</div>
);

const sampleRail = (
	<div>
		<p style={ { fontWeight: 600 } }>Actions</p>
		<p>Save, duplicate, delete. Help links. Status.</p>
	</div>
);

export const ThreeColumn = {
	args: {
		subNav: sampleSubNav,
		main: sampleMain,
		rail: sampleRail,
	},
};

export const NoRail = {
	args: {
		subNav: sampleSubNav,
		main: sampleMain,
	},
};

export const MainOnly = {
	args: {
		main: sampleMain,
	},
};
