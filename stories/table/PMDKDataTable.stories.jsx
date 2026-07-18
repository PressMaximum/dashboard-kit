/**
 * KIT-P3 slice 2 — <PMDKDataTable> behaviors + five states.
 *
 * Imports from `src/table/index.mjs` (source equivalent of the public
 * `@pressmaximum/dashboard-kit/table` entry) so a renamed export breaks the
 * story build — same regression trick as the DataViews validation stories.
 */

import { useState } from 'react';
import '../../src/primitives/style.css';
import '../../src/themes/app.css';
import { PMDKDataTable } from '../../src/table/index.mjs';
import { Chassis } from '../helpers/Chassis.jsx';
import { makeRecords, makeColumns } from '../helpers/recordsFixture.jsx';

export default {
	title: 'Table/PMDKDataTable',
	parameters: { layout: 'fullscreen' },
};

const records = makeRecords();
const columns = makeColumns();

const baseProps = {
	columns,
	data: records,
	getRowId: ( row ) => String( row.id ),
	itemsLabel: 'records',
	labels: { searchPlaceholder: 'Search records…' },
};

export const Ready = {
	render: () => (
		<Chassis>
			<PMDKDataTable { ...baseProps } />
		</Chassis>
	),
};

export const Loading = {
	render: () => (
		<Chassis>
			<PMDKDataTable { ...baseProps } data={ [] } status="loading" />
		</Chassis>
	),
};

export const Empty = {
	render: () => (
		<Chassis>
			<PMDKDataTable
				{ ...baseProps }
				data={ [] }
				status="empty"
				states={ {
					empty: {
						title: 'No records yet',
						description:
							'Create your first record to start tracking work here.',
						action: (
							<button
								className="pmdk-button primary"
								type="button"
							>
								New record
							</button>
						),
					},
				} }
			/>
		</Chassis>
	),
};

export const ErrorState = {
	render: () => (
		<Chassis>
			<PMDKDataTable
				{ ...baseProps }
				data={ [] }
				status="error"
				states={ {
					error: {
						title: 'Records failed to load',
						description:
							'Your filters are kept. Retry to request the same view again.',
						action: (
							<button className="pmdk-button" type="button">
								Retry
							</button>
						),
					},
				} }
			/>
		</Chassis>
	),
};

export const Permission = {
	render: () => (
		<Chassis>
			<PMDKDataTable
				{ ...baseProps }
				data={ [] }
				status="permission"
				states={ {
					permission: {
						title: 'You need access to records',
						description:
							'Ask an administrator for the manage-records capability.',
					},
				} }
			/>
		</Chassis>
	),
};

export const SelectionAndBulk = {
	render: () => (
		<Chassis>
			<PMDKDataTable
				{ ...baseProps }
				bulkActions={ ( { selectedRows, clearSelection } ) => (
					<button
						className="is-danger"
						type="button"
						onClick={ () => {
							// Product-side handler: delete then clear.
							// eslint-disable-next-line no-console
							console.log(
								'delete',
								selectedRows.map( ( row ) => row.original.id ),
							);
							clearSelection();
						} }
					>
						Delete records
					</button>
				) }
			/>
		</Chassis>
	),
};

function ServerModeExample() {
	const pageSize = 25;
	const [ query, setQuery ] = useState( {
		sorting: [],
		columnFilters: [],
		globalFilter: '',
		pageIndex: 0,
		pageSize,
	} );
	// Fake server: sort + slice on the client to demonstrate the callback loop.
	const sorted = [ ...records ].sort( ( a, b ) => {
		const sort = query.sorting[ 0 ];
		if ( ! sort ) {
			return 0;
		}
		const dir = sort.desc ? -1 : 1;
		return String( a[ sort.id ] ).localeCompare(
			String( b[ sort.id ] ),
			undefined,
			{ numeric: true },
		) * dir;
	} );
	const start = query.pageIndex * query.pageSize;
	const page = sorted.slice( start, start + query.pageSize );

	return (
		<>
			<PMDKDataTable
				{ ...baseProps }
				data={ page }
				serverMode
				totalCount={ records.length }
				pageIndex={ query.pageIndex }
				defaultPageSize={ pageSize }
				onQueryChange={ setQuery }
			/>
			<pre
				style={ {
					margin: 16,
					fontSize: 11,
					color: 'var(--pmdk-color-text-muted)',
				} }
			>
				last query: { JSON.stringify( query ) }
			</pre>
		</>
	);
}

export const ServerMode = {
	render: () => (
		<Chassis>
			<ServerModeExample />
		</Chassis>
	),
};

export const PersistedPreferences = {
	render: () => (
		<Chassis>
			<div
				style={ {
					padding: '12px 16px 0',
					fontSize: 12,
					color: 'var(--pmdk-color-text-muted)',
				} }
			>
				Sort, column visibility/order and page size persist under the
				localStorage key
				<code> pmdk-story.records.table.v1</code> — reload the story to
				see them restored. Selection and page number are deliberately
				not persisted.
			</div>
			<PMDKDataTable
				{ ...baseProps }
				persistenceKey="pmdk-story.records.table.v1"
			/>
		</Chassis>
	),
};

export const ThemeApp = {
	render: () => (
		<Chassis theme>
			<PMDKDataTable { ...baseProps } />
		</Chassis>
	),
};

export const ThemeAppDark = {
	render: () => (
		<Chassis theme scheme="dark">
			<PMDKDataTable { ...baseProps } />
		</Chassis>
	),
};
