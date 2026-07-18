/**
 * KIT-P3 slice 2 — CONSUMER EXAMPLE (the Q13 split, demonstrated).
 *
 * This story is written the way Aponto (or PressListing) will consume
 * <PMDKDataTable>. Everything defined HERE is product-side:
 *
 *   - column defs + domain cell renderers (status pill, money cell)
 *   - a row-action kebab column with its own menu + handlers
 *   - facet data + the filter-builder UI (kit only provides the slot,
 *     the collapse behavior and the chrome classes)
 *   - active-filter chips row content
 *   - bulk delete with the product's own two-stage confirm
 *   - overflow menu items (Export / Import)
 *   - toast/data-layer side effects (console.log stand-ins)
 *
 * The kit contributes: table chrome + sorting + search wiring + selection +
 * bulk-bar shell + column manager (visibility + drag order) + pagination +
 * persistence + the five states. If this story renders and behaves, the
 * boundary holds.
 */

import { useMemo, useState } from 'react';
import '../../src/primitives/style.css';
import { PMDKDataTable, defaultRenderIcon } from '../../src/table/index.mjs';
import { Chassis } from '../helpers/Chassis.jsx';
import {
	makeRecords,
	STATUS_LABELS,
	arrayFilter,
} from '../helpers/recordsFixture.jsx';

export default {
	title: 'Table/ConsumerExample',
	parameters: { layout: 'fullscreen' },
};

const FACETS = [
	{ columnId: 'owner', label: 'Owner' },
	{ columnId: 'status', label: 'Status' },
];

/*
 * Product-side facet: checkbox list over unique column values.
 */
function Facet( { table, data, columnId, label } ) {
	const column = table.getColumn( columnId );
	const selected = Array.isArray( column?.getFilterValue() )
		? column.getFilterValue()
		: [];
	const options = useMemo(
		() => [ ...new Set( data.map( ( row ) => row[ columnId ] ) ) ].sort(),
		[ data, columnId ],
	);
	if ( ! column ) {
		return null;
	}
	return (
		<fieldset
			style={ {
				border: '1px solid var(--pmdk-color-border)',
				borderRadius: 6,
				padding: '8px 10px',
				minWidth: 170,
			} }
		>
			<legend
				style={ {
					fontSize: 'var(--pmdk-font-size-caption)',
					color: 'var(--pmdk-color-text-muted)',
					padding: '0 4px',
				} }
			>
				{ label }
			</legend>
			{ options.map( ( option ) => (
				<label
					className="pmdk-filter-option"
					key={ option }
					style={ { display: 'flex' } }
				>
					<input
						type="checkbox"
						checked={ selected.includes( option ) }
						onChange={ () => {
							const next = selected.includes( option )
								? selected.filter( ( v ) => v !== option )
								: [ ...selected, option ];
							column.setFilterValue(
								next.length ? next : undefined,
							);
						} }
					/>
					<span className="pmdk-filter-checkbox">
						{ defaultRenderIcon( 'check' ) }
					</span>
					<span>
						{ columnId === 'status'
							? STATUS_LABELS[ option ]
							: option }
					</span>
				</label>
			) ) }
		</fieldset>
	);
}

/*
 * Product-side row actions: kebab menu with domain commands.
 */
function RowActions( { record, onAction } ) {
	const [ open, setOpen ] = useState( false );
	return (
		<div
			className={ `pmdk-row-actions${ open ? ' is-open' : '' }` }
			data-row-actions
		>
			<button
				className="pmdk-row-action pmdk-row-action-icon"
				type="button"
				aria-haspopup="menu"
				aria-expanded={ open }
				aria-label={ `Actions for ${ record.title }` }
				onClick={ ( event ) => {
					event.stopPropagation();
					setOpen( ( value ) => ! value );
				} }
			>
				{ defaultRenderIcon( 'moreVertical' ) }
			</button>
			{ open ? (
				<div
					className="pmdk-row-action-menu"
					role="menu"
					aria-label={ `Actions for ${ record.title }` }
				>
					<button
						type="button"
						role="menuitem"
						onClick={ ( event ) => {
							event.stopPropagation();
							setOpen( false );
							onAction( record, 'view' );
						} }
					>
						{ defaultRenderIcon( 'list' ) }
						<span>View details</span>
					</button>
					<div
						className="pmdk-row-action-separator"
						role="separator"
					/>
					<button
						className="is-danger"
						type="button"
						role="menuitem"
						onClick={ ( event ) => {
							event.stopPropagation();
							setOpen( false );
							onAction( record, 'delete' );
						} }
					>
						{ defaultRenderIcon( 'close' ) }
						<span>Delete record</span>
					</button>
				</div>
			) : null }
		</div>
	);
}

function ConsumerTable() {
	const [ data, setData ] = useState( () => makeRecords( 40 ) );
	const [ bulkConfirm, setBulkConfirm ] = useState( false );
	const [ lastEvent, setLastEvent ] = useState( '' );
	// G1: the product OWNS filter state (controlled mode) — this is how an
	// external "show pending" entry point (e.g. a dashboard card) drives the
	// table: set the state here, the table follows.
	const [ columnFilters, setColumnFilters ] = useState( [] );
	const [ filtersOpen, setFiltersOpen ] = useState( false );

	const onAction = ( record, action ) => {
		if ( action === 'delete' ) {
			setData( ( current ) =>
				current.filter( ( row ) => row.id !== record.id ),
			);
		}
		setLastEvent( `${ action }: ${ record.title }` );
	};

	// Product-side column defs; the action column is pinned via id 'action'.
	const columns = useMemo(
		() => [
			{
				accessorKey: 'title',
				id: 'title',
				header: 'Record',
				size: 150,
				enableHiding: false,
				meta: { label: 'Record' },
				cell: ( info ) => (
					<span className="pmdk-cell-value pmdk-cell-strong">
						{ info.getValue() }
					</span>
				),
			},
			{
				accessorKey: 'owner',
				id: 'owner',
				header: 'Owner',
				size: 140,
				meta: { label: 'Owner' },
				filterFn: arrayFilter,
				cell: ( info ) => (
					<span className="pmdk-cell-value">
						{ info.getValue() }
					</span>
				),
			},
			{
				accessorKey: 'status',
				id: 'status',
				header: 'Status',
				size: 130,
				meta: { label: 'Status' },
				filterFn: arrayFilter,
				cell: ( info ) => (
					<span
						className={ `pmdk-status ${ info.getValue() }` }
					>
						<span className="pmdk-status-label">
							{ STATUS_LABELS[ info.getValue() ] }
						</span>
					</span>
				),
			},
			{
				accessorKey: 'amount',
				id: 'amount',
				header: 'Amount',
				size: 90,
				meta: { label: 'Amount', numeric: true },
				cell: ( info ) => (
					<span className="pmdk-cell-value pmdk-cell-numeric">
						{ `$${ info.getValue().toFixed( 2 ) }` }
					</span>
				),
			},
			{
				id: 'action',
				header: 'Action',
				size: 64,
				enableHiding: false,
				enableSorting: false,
				cell: ( info ) => (
					<RowActions
						record={ info.row.original }
						onAction={ onAction }
					/>
				),
			},
		],
		[],
	);

	// Product derives the badge/chips from ITS OWN filter state.
	const activeFacets = FACETS.filter( ( facet ) =>
		columnFilters.some(
			( filter ) =>
				filter.id === facet.columnId &&
				Array.isArray( filter.value ) &&
				filter.value.length,
		),
	);
	let filterChips = null;
	if ( activeFacets.length ) {
		filterChips = activeFacets.map( ( facet ) => (
			<button
				className="pmdk-filter-chip"
				type="button"
				key={ facet.columnId }
				onClick={ () =>
					setColumnFilters( ( current ) =>
						current.filter(
							( filter ) => filter.id !== facet.columnId,
						),
					)
				}
			>
				<span>{ facet.label }</span>
				<strong>
					{
						columnFilters.find(
							( filter ) => filter.id === facet.columnId,
						).value.length
					}
				</strong>
				{ defaultRenderIcon( 'close' ) }
			</button>
		) );
	}

	return (
		<>
			<div style={ { padding: '12px 16px 0' } }>
				{ /* External entry point (Q13/G1): a dashboard-card-style
				     control that drives the CONTROLLED filter state. */ }
				<button
					className="pmdk-button sm"
					type="button"
					onClick={ () => {
						setColumnFilters( [
							{ id: 'status', value: [ 'pending' ] },
						] );
						setFiltersOpen( true );
						setLastEvent( 'external: show pending' );
					} }
				>
					Show pending (external)
				</button>
			</div>
			<PMDKDataTable
				columns={ columns }
				data={ data }
				getRowId={ ( row ) => String( row.id ) }
				itemsLabel="records"
				persistenceKey="pmdk-story.consumer.table.v1"
				labels={ { searchPlaceholder: 'Search record or owner…' } }
				getColumnCanGlobalFilter={ ( column ) =>
					[ 'title', 'owner' ].includes( column.id )
				}
				onRowActivate={ ( record ) =>
					setLastEvent( `open: ${ record.title }` )
				}
				getRowAriaLabel={ ( record ) =>
					`Open ${ record.title } for ${ record.owner }`
				}
				/* G1: controlled filtering — product state is the source */
				columnFilters={ columnFilters }
				onColumnFiltersChange={ setColumnFilters }
				filtersOpen={ filtersOpen }
				onFiltersOpenChange={ setFiltersOpen }
				/* G3: kit-side clears (bulk X) must reach the product so
				   transient product UI (the confirm step) can't go stale */
				onRowSelectionChange={ ( selection ) => {
					if ( ! Object.keys( selection ).length ) {
						setBulkConfirm( false );
					}
				} }
				/* facet data + builder = product side */
				filterBuilder={ ( { table } ) => (
					<div
						style={ {
							display: 'flex',
							gap: 12,
							flexWrap: 'wrap',
						} }
					>
						{ FACETS.map( ( facet ) => (
							<Facet
								key={ facet.columnId }
								table={ table }
								data={ data }
								columnId={ facet.columnId }
								label={ facet.label }
							/>
						) ) }
					</div>
				) }
				activeFilters={ filterChips }
				filterCount={ activeFacets.length }
				/* bulk delete + confirm = product side */
				bulkActions={ ( { selectedRows, clearSelection } ) =>
					bulkConfirm ? (
						<>
							<button
								type="button"
								onClick={ () => setBulkConfirm( false ) }
							>
								Keep
							</button>
							<button
								className="is-danger"
								type="button"
								onClick={ () => {
									const ids = new Set(
										selectedRows.map(
											( row ) => row.original.id,
										),
									);
									setData( ( current ) =>
										current.filter(
											( row ) => ! ids.has( row.id ),
										),
									);
									setBulkConfirm( false );
									clearSelection();
									setLastEvent(
										`bulk delete: ${ ids.size } records`,
									);
								} }
							>
								Delete records
							</button>
						</>
					) : (
						<button
							className="is-danger"
							type="button"
							onClick={ () => setBulkConfirm( true ) }
						>
							Delete records
						</button>
					)
				}
				/* overflow menu items = product side */
				menuItems={ [
					{
						id: 'export',
						icon: defaultRenderIcon( 'csv' ),
						label: 'Export current view',
						onSelect: () => setLastEvent( 'export' ),
					},
					{
						id: 'import',
						icon: defaultRenderIcon( 'import' ),
						label: 'Import records',
						hint: 'P2+',
						onSelect: () => setLastEvent( 'import' ),
					},
				] }
				primaryAction={
					<button
						className="pmdk-button primary sm"
						type="button"
						onClick={ () => setLastEvent( 'new record' ) }
					>
						{ defaultRenderIcon( 'plus' ) }
						<span>New record</span>
					</button>
				}
			/>
			<p
				style={ {
					margin: 16,
					fontSize: 12,
					color: 'var(--pmdk-color-text-muted)',
				} }
			>
				Last product-side event: <strong>{ lastEvent || '—' }</strong>
			</p>
		</>
	);
}

export const ApontoLikeConsumer = {
	render: () => (
		<Chassis>
			<ConsumerTable />
		</Chassis>
	),
};
