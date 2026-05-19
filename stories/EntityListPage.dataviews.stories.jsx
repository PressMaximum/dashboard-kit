/**
 * EntityListPage × DataViews — Validates SPEC §11 hacks #3 + #4 close
 * end-to-end through the real Tier-2 page component (not just the bare
 * PageWrapper fixture from P2).
 *
 * Imports through the public `/datasets` sub-entry so this story also
 * regresses on the export tree (any rename / drop of `EntityListPage`
 * from `src/datasets/index.mjs` would break the story build).
 *
 * Mounts a real `@wordpress/dataviews` instance inside the kit's
 * wide-mode dashboard flex chain. The grid view should render
 * MULTI-COLUMN — in the Surfaces spike this was the symptom of the
 * broken chain (every record stacked one-card-per-row because
 * `useResizeObserver` read `containerWidth: 0`). If you see a
 * one-column stack on the wide-mode story, the chain regressed.
 *
 * No real WP REST — hardcoded items, hardcoded fields,
 * `filterSortAndPaginate` from `@wordpress/dataviews` shapes the page
 * info. `@wordpress/dataviews` lives in devDependencies for this story.
 */

import { useMemo, useState } from '@wordpress/element';
import { filterSortAndPaginate } from '@wordpress/dataviews';

import { EntityListPage } from '../src/datasets/index.mjs';

import '../src/core/DashboardShell.css';

// See note in `PageWrapper.dataviews.stories.jsx`: DataViews owns its
// own grid stylesheet and the validation fixture must import it
// explicitly. Without this line the grid template falls back to
// `none`, every card stacks one-per-row, and the story falsely
// reproduces the spike's `containerWidth: 0` failure mode.
import '@wordpress/dataviews/build-style/style.css';

const ITEMS = Array.from( { length: 24 }, ( _, i ) => ( {
	id: i + 1,
	title: `Template ${ i + 1 }`,
	status: i % 4 === 0 ? 'draft' : 'publish',
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
	layout: { previewSize: 240 },
};

function FakeDashboard( { containerWidth = 'wide', children } ) {
	return (
		<div
			className="pmdk-dashboard"
			data-container-width={ containerWidth }
			style={ {
				height: 760,
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
					EntityListPage harness ({ containerWidth })
				</h1>
			</header>
			<main className="pmdk-dashboard__main">{ children }</main>
		</div>
	);
}

function Harness( { items, isLoading, containerWidth } ) {
	const [ view, setView ] = useState( DEFAULT_VIEW );

	const { data: shown, paginationInfo } = useMemo(
		() => filterSortAndPaginate( items, view, FIELDS ),
		[ items, view ]
	);

	return (
		<FakeDashboard containerWidth={ containerWidth }>
			<EntityListPage
				items={ shown }
				isLoading={ isLoading }
				fields={ FIELDS }
				view={ view }
				onChangeView={ setView }
				paginationInfo={ paginationInfo }
				defaultLayouts={ {
					grid: { previewSize: 240 },
					table: {},
				} }
				getItemId={ ( item ) => String( item.id ) }
				title="Templates"
				description="SPEC §11 hack #3 validation — grid should render multiple columns."
				primaryAction={ {
					label: 'Add Template',
					href: '#new-template',
				} }
			/>
		</FakeDashboard>
	);
}

export default {
	title: 'Validation/EntityListPage × DataViews',
	parameters: { layout: 'fullscreen' },
};

export const WideModePopulated = {
	name: 'Wide mode — grid renders multi-column (hacks #3 + #4 closed)',
	render: () => (
		<Harness items={ ITEMS } isLoading={ false } containerWidth="wide" />
	),
};

export const NarrowModePopulated = {
	name: 'Narrow mode — grid renders inside 1100px reading column',
	render: () => (
		<Harness items={ ITEMS } isLoading={ false } containerWidth="narrow" />
	),
};

export const LoadingState = {
	name: 'Loading state — Spinner + sr-only label',
	render: () => (
		<Harness items={ [] } isLoading={ true } containerWidth="wide" />
	),
};

export const EmptyState = {
	name: 'Empty state — no results message',
	render: () => (
		<Harness items={ [] } isLoading={ false } containerWidth="wide" />
	),
};
