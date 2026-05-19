/**
 * PageWrapper × DataViews — validates SPEC §11 hack #3.
 *
 * Mounts a minimal `<DataViews>` inside the kit's wide-mode dashboard
 * flex chain (`.pmdk-dashboard[data-container-width="wide"]` →
 * `.pmdk-dashboard__main` → `.pmdk-page-wrapper`) and verifies that
 * grid view renders MULTI-COLUMN. In the Surfaces spike this was the
 * symptom of the broken chain: every record stacked one-card-per-row
 * because DataViews's `useResizeObserver` read `containerWidth: 0`.
 *
 * The narrow-mode story is included as a contrast — same data, capped
 * reading column, fewer grid columns.
 *
 * No real WP REST behind this — hardcoded data, hardcoded fields,
 * `filterSortAndPaginate` from `@wordpress/dataviews` shapes the page
 * info. Adding `@wordpress/dataviews` to devDeps so this story compiles
 * without dragging it into the kit's actual peer-dep tree.
 */

import { useMemo, useState } from '@wordpress/element';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';

// Imported via the public-API entry so this fixture doubles as a
// regression check on the export tree (any rename / drop of these
// names from src/index.mjs would break the story build).
import { PageWrapper, ListPageHeader } from '../src/index.mjs';

// DashboardShell.css is internal — it's pulled in transitively by
// `src/index.mjs`'s `import './styles/tokens.css'`, but the chassis
// class definitions sit alongside `DashboardShell.jsx`. The fixture
// fakes the dashboard chassis (no full mount), so we explicitly load
// the chassis stylesheet to exercise the same `.pmdk-dashboard__main`
// flex chain a real mount would apply.
import '../src/core/DashboardShell.css';

// `@wordpress/dataviews` ships its own stylesheet — it owns the
// `.dataviews-view-grid { display: grid; grid-template-columns: repeat(
// auto-fill, minmax(var(--dataviews-grid-min-card-width), 1fr) ) }` rule
// that turns the rendered grid into a multi-column layout. In a real WP
// admin this CSS auto-enqueues via wp-scripts; in Storybook (and in
// consumer builds that don't run wp-scripts) you have to import it
// explicitly. Without it the grid template falls back to `none` and
// every record stacks one card per row — looks exactly like the spike's
// failed `containerWidth: 0` symptom and would falsely fail this
// validation fixture.
import '@wordpress/dataviews/build-style/style.css';

const ITEMS = Array.from( { length: 18 }, ( _, i ) => ( {
	id: i + 1,
	title: `Surface ${ i + 1 }`,
	status: i % 3 === 0 ? 'draft' : 'publish',
	modified: new Date( Date.now() - i * 86400000 ).toISOString(),
} ) );

const FIELDS = [
	{
		id: 'preview',
		label: 'Preview',
		enableHiding: false,
		enableSorting: false,
		render: ( { item } ) => (
			<div
				style={ {
					aspectRatio: '4 / 3',
					background: '#f0f6ff',
					border: '1px solid #c7d2fe',
					borderRadius: 4,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: '#3b4cca',
					fontWeight: 600,
				} }
			>
				#{ item.id }
			</div>
		),
	},
	{
		id: 'title',
		label: 'Title',
		type: 'text',
		enableGlobalSearch: true,
		getValue: ( { item } ) => item.title,
	},
	{
		id: 'status',
		label: 'Status',
		elements: [
			{ value: 'publish', label: 'Published' },
			{ value: 'draft', label: 'Draft' },
		],
		getValue: ( { item } ) => item.status,
	},
	{
		id: 'modified',
		label: 'Modified',
		type: 'datetime',
		enableSorting: true,
		getValue: ( { item } ) => item.modified,
	},
];

const DEFAULT_VIEW = {
	type: 'grid',
	search: '',
	page: 1,
	perPage: 12,
	titleField: 'title',
	mediaField: 'preview',
	fields: [ 'status', 'modified' ],
	filters: [],
	sort: { field: 'modified', direction: 'desc' },
	layout: { previewSize: 220 },
};

function DataViewsHarness() {
	const [ view, setView ] = useState( DEFAULT_VIEW );
	const fields = useMemo( () => FIELDS, [] );

	const { data: shown, paginationInfo } = useMemo(
		() => filterSortAndPaginate( ITEMS, view, fields ),
		[ view, fields ]
	);

	return (
		<DataViews
			data={ shown }
			fields={ fields }
			view={ view }
			onChangeView={ setView }
			actions={ [] }
			paginationInfo={ paginationInfo }
			defaultLayouts={ { grid: { previewSize: 220 }, table: {} } }
			getItemId={ ( item ) => String( item.id ) }
		/>
	);
}

/**
 * Faked dashboard chassis — the real one lives in DashboardShell. The
 * point of the story is to exercise the same flex chain (`__main` flex
 * column + min-height:0 + container-width attribute) that the real
 * shell uses, so the test fixture is representative without dragging in
 * the full TabStrip / HelpPanel / SnackbarSlot surface.
 */
function FakeDashboard( { containerWidth = 'wide', children } ) {
	return (
		<div
			className="pmdk-dashboard"
			data-container-width={ containerWidth }
			style={ {
				height: 720,
				border: '1px dashed #c7d2fe',
				background: '#fff',
			} }
		>
			<header
				className="pmdk-dashboard__header"
				style={ { padding: '12px 24px' } }
			>
				<h1
					className="pmdk-dashboard__brand"
					style={ {
						gridColumn: '1 / -1',
						justifySelf: 'start',
						padding: '8px 0',
					} }
				>
					DataViews chain harness ({ containerWidth })
				</h1>
			</header>
			<main className="pmdk-dashboard__main">{ children }</main>
		</div>
	);
}

export default {
	title: 'Validation/PageWrapper × DataViews',
	parameters: { layout: 'fullscreen' },
};

export const WideMode = {
	name: 'Wide mode — DataViews grid renders multi-column',
	render: () => (
		<FakeDashboard containerWidth="wide">
			<PageWrapper>
				<ListPageHeader
					title="Surfaces"
					description="SPEC §11 hack #3 validation — grid should render multiple columns."
				/>
				<DataViewsHarness />
			</PageWrapper>
		</FakeDashboard>
	),
};

export const NarrowMode = {
	name: 'Narrow mode — DataViews grid in reading-column width',
	render: () => (
		<FakeDashboard containerWidth="narrow">
			<PageWrapper>
				<ListPageHeader
					title="Surfaces"
					description="Capped at 1100px so the same data renders with fewer grid columns."
				/>
				<DataViewsHarness />
			</PageWrapper>
		</FakeDashboard>
	),
};
