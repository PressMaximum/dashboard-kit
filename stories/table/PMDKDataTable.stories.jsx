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
import { PMDKDataTable, defaultRenderIcon } from '../../src/table/index.mjs';
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

/*
 * K-024 — an open row-action menu vs the sticky action column.
 *
 * `.pmdk-col-action` is `position: sticky; z-index: 3`, which makes every action
 * cell a stacking context. Before the fix the menu inside one was trapped at
 * the CELL's level, so the opaque sticky cells of the rows BELOW painted over
 * its trailing edge and clipped the labels ("Duplicate a…"). The menu opens on
 * row 1 of several on purpose — with only one row there is nothing to paint
 * over it and the bug is invisible.
 *
 * Interaction-only, so deliberately NOT in the VR matrix: the shots capture
 * closed triggers, and asserting paint order needs a live browser (the unit
 * test pins the z-index contract instead).
 */
function StackingRowActions( { record, openRowId } ) {
	const open = String( record.id ) === String( openRowId );
	return (
		<div
			className={ `pmdk-row-actions${ open ? ' is-open' : '' }` }
			data-menu
		>
			<button
				className="pmdk-row-action pmdk-row-action-icon"
				data-menu-trigger
				type="button"
				aria-haspopup="menu"
				aria-expanded={ open }
				aria-label={ `Actions for ${ record.title }` }
			>
				{ defaultRenderIcon( 'moreVertical' ) }
			</button>
			<div
				className="pmdk-row-action-menu"
				role="menu"
				aria-label={ `Actions for ${ record.title }` }
				hidden={ ! open }
			>
				<button type="button" role="menuitem">
					{ defaultRenderIcon( 'list' ) }
					<span>View details</span>
				</button>
				<button type="button" role="menuitem">
					{ defaultRenderIcon( 'csv' ) }
					<span>Duplicate a record</span>
				</button>
				<div
					className="pmdk-row-action-separator"
					role="separator"
				/>
				<button className="is-danger" type="button" role="menuitem">
					{ defaultRenderIcon( 'close' ) }
					<span>Delete record</span>
				</button>
			</div>
		</div>
	);
}

export const StickyActionMenuStacking = {
	render: () => {
		const openRowId = records[ 0 ].id;
		return (
			<Chassis>
				<PMDKDataTable
					{ ...baseProps }
					data={ records.slice( 0, 6 ) }
					columns={ [
						...columns,
						{
							id: 'action',
							header: '',
							size: 60,
							enableHiding: false,
							enableSorting: false,
							meta: { label: 'Actions', sticky: 'end' },
							cell: ( info ) => (
								<StackingRowActions
									record={ info.row.original }
									openRowId={ openRowId }
								/>
							),
						},
					] }
				/>
			</Chassis>
		);
	},
};
