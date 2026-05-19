import SaveBar from '../src/settings/SaveBar.jsx';

export default {
	title: 'Settings/SaveBar',
	component: SaveBar,
	parameters: { layout: 'padded' },
	tags: [ 'autodocs' ],
	args: {
		onSave: () => Promise.resolve(),
		onReset: () => Promise.resolve(),
	},
};

export const Clean = {
	args: {
		isDirty: false,
		isSaving: false,
	},
};

export const Dirty = {
	args: {
		isDirty: true,
		isSaving: false,
	},
};

export const Saving = {
	args: {
		isDirty: true,
		isSaving: true,
	},
};

export const CustomLabels = {
	args: {
		isDirty: true,
		isSaving: false,
		labels: {
			saveLabel: 'Lưu thay đổi',
			resetLabel: 'Khôi phục mặc định',
			statusDirty: 'Có thay đổi chưa lưu',
		},
	},
};
