/**
 * <PMDKDataTable> — the kit's shared data-table component (KIT-P3 slice 2, Q13).
 *
 * Refactored from Aponto's `BookingsTable.jsx` with the domain removed. The
 * split (founder decision Q13, 2026-07-18):
 *
 *   KIT SHIPS   sorting, global search + column-filter wiring, pagination
 *               (client or server), row selection + bulk bar chrome, column
 *               visibility + drag re-ordering (dnd-kit), toolbar slots, the
 *               five production page states, server-mode query callbacks and
 *               localStorage view persistence — all on the `.pmdk-*` chrome
 *               from `primitives/style.css`.
 *
 *   PRODUCT     column definitions + cell renderers (TanStack `ColumnDef`s),
 *   KEEPS       the data layer (REST client / query state), row-action menus
 *               and handlers, facet/filter data and builder UI, bulk-action
 *               buttons + confirm flows, domain icons and copy.
 *
 * The kit's legacy EntityListPage/DataViews stack is untouched — this is a
 * separate opt-in entry (`@pressmaximum/dashboard-kit/table`) so existing
 * consumers (Blocksify) see zero change.
 *
 * Column conventions:
 *   - When `enableRowSelection` is on the kit injects the `select` column.
 *   - A product column with id `action` (or `meta.sticky: 'end'`) is pinned
 *     last and gets the sticky `.pmdk-col-action` treatment; `select` is pinned
 *     first with `.pmdk-col-select`.
 *   - `meta.label` names the column in the column manager; `meta.filterOnly`
 *     hides it from the manager; `enableHiding: false` marks it Required.
 *   - Cells receive `data-column={column.id}`; products style domain cells
 *     with `.pmdk-cell-value`, `.pmdk-cell-muted`, `.pmdk-cell-strong`,
 *     `.pmdk-cell-numeric` helper classes from the primitives sheet.
 */

import {
	Children,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

/**
 * Resolve a consumer slot (raw node, array of nodes, or a render function)
 * and auto-key array results via `Children.toArray`. Consumers routinely
 * pass element ARRAYS to the toolbar slots (`toolbarControls`,
 * `activeFilters`, `bulkActions`, `filterBuilder` returns) — rendering a
 * raw array inline made React's DEV "unique key" warning fire with the
 * component stack pointing at the KIT's toolbar subtree, even though the
 * keyless elements were consumer-authored (observed by the Blocksify P4
 * bump). `Children.toArray` assigns stable positional keys, which is the
 * right semantic for slot clusters (order = identity).
 *
 * @param {unknown}                 slot Slot prop value.
 * @param {Record<string, unknown>} ctx  Render-prop context (when function).
 * @return {import('react').ReactNode} Keyed, render-ready node.
 */
function renderSlot( slot, ctx ) {
	const resolved = typeof slot === 'function' ? slot( ctx ) : slot;
	return Array.isArray( resolved ) ? Children.toArray( resolved ) : resolved;
}
import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	sortableKeyboardCoordinates,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { defaultRenderIcon } from './icons.jsx';
import { useTablePersistence } from './useTablePersistence.js';

const DEFAULT_LABELS = {
	searchPlaceholder: 'Search…',
	searchAria: 'Search records',
	filtersShow: 'Show filters',
	filtersHide: 'Hide filters',
	filtersTitle: 'Filters',
	actionsMenu: 'More list actions',
	columns: 'Columns',
	columnsBack: 'Back to list actions',
	columnsReset: 'Reset',
	columnsRequired: 'Required',
	columnsDialog: 'List columns',
	columnDrag: ( label ) => `Drag to reorder ${ label } column`,
	selectAll: 'Select all visible rows',
	unselectAll: 'Unselect all visible rows',
	selectRow: ( id ) => `Select row ${ id }`,
	selected: ( count ) => `${ count } selected`,
	bulkAria: 'Bulk actions',
	clearSelection: 'Clear selection',
	showing: ( first, last, total, items ) =>
		`Showing ${ first }–${ last } of ${ total } ${ items }`,
	rowsPerPage: 'Rows per page',
	rowsPerPageAria: 'Rows per page',
	previousPage: 'Previous page',
	nextPage: 'Next page',
	noResultsTitle: 'No results found',
	noResultsBody: 'Try a different search or filter.',
	loadingAria: 'Loading',
};

/**
 * Roving focus for role="menu" containers (Arrow Up/Down, Home, End).
 *
 * @param {KeyboardEvent} event Keydown event from the menu container.
 */
function menuRovingKeydown( event ) {
	const items = [
		...event.currentTarget.querySelectorAll(
			'[role="menuitem"],[role="menuitemradio"]',
		),
	].filter( ( item ) => ! item.disabled );
	if (
		! items.length ||
		! [ 'ArrowDown', 'ArrowUp', 'Home', 'End' ].includes( event.key )
	) {
		return;
	}
	event.preventDefault();
	const index = items.indexOf(
		event.currentTarget.ownerDocument.activeElement,
	);
	let target;
	if ( event.key === 'Home' ) {
		target = items[ 0 ];
	} else if ( event.key === 'End' ) {
		target = items[ items.length - 1 ];
	} else if ( event.key === 'ArrowDown' ) {
		target =
			items[ Math.min( index + 1, items.length - 1 ) ] || items[ 0 ];
	} else {
		target = items[ Math.max( index, 0 ) - 1 ] || items[ 0 ];
	}
	target?.focus();
}

/**
 * Pin `select` first and the sticky-end column last; keep the user's stored
 * order for the rest, dropping ids that no longer exist and appending new ones.
 *
 * @param {string[]} preferredOrder Stored/preferred column id order.
 * @param {string[]} allIds         Every current leaf column id.
 * @param {string}   endId          Column id pinned to the end ('' for none).
 * @return {string[]} Normalised column order.
 */
export function normalizeColumnOrder( preferredOrder, allIds, endId = '' ) {
	const allowed = new Set( allIds );
	const requested = Array.isArray( preferredOrder ) ? preferredOrder : [];
	const ordered = [ ...requested, ...allIds ].filter(
		( id, index, ids ) => allowed.has( id ) && ids.indexOf( id ) === index,
	);
	const middle = ordered.filter(
		( id ) => id !== 'select' && id !== endId,
	);
	const out = [];
	if ( allowed.has( 'select' ) ) {
		out.push( 'select' );
	}
	out.push( ...middle );
	if ( endId && allowed.has( endId ) ) {
		out.push( endId );
	}
	return out;
}

/*
 * Cell/header class by column role: the two structural columns get their
 * sticky classes; numeric product columns (meta.numeric) get the amount tier.
 */
function columnClassName( columnId, endColumnId, meta ) {
	if ( columnId === 'select' ) {
		return 'pmdk-col-select';
	}
	if ( endColumnId && columnId === endColumnId ) {
		return 'pmdk-col-action';
	}
	if ( meta?.numeric ) {
		return 'pmdk-amount';
	}
	return undefined;
}

function ariaSortValue( sorted ) {
	if ( sorted === 'asc' ) {
		return 'ascending';
	}
	if ( sorted === 'desc' ) {
		return 'descending';
	}
	return undefined;
}

function HeaderContent( { header, renderIcon } ) {
	if ( header.isPlaceholder ) {
		return null;
	}
	const rendered = flexRender(
		header.column.columnDef.header,
		header.getContext(),
	);
	if ( ! header.column.getCanSort() ) {
		return rendered;
	}
	const sorted = header.column.getIsSorted();
	return (
		<button
			className={ `pmdk-sort-button${
				sorted ? ` is-active is-${ sorted }` : ''
			}` }
			type="button"
			onClick={ header.column.getToggleSortingHandler() }
		>
			<span>{ rendered }</span>
			{ renderIcon( 'chevronDown' ) }
		</button>
	);
}

function IndeterminateCheckbox( { indeterminate, ...props } ) {
	const ref = useRef( null );
	useEffect( () => {
		if ( ref.current ) {
			ref.current.indeterminate = Boolean( indeterminate );
		}
	}, [ indeterminate ] );
	return (
		<input
			ref={ ref }
			className="pmdk-table-checkbox"
			type="checkbox"
			{ ...props }
		/>
	);
}

function SortableColumnOption( { column, labels, renderIcon } ) {
	const label = column.columnDef.meta?.label || column.id;
	const canHide = column.getCanHide();
	const {
		attributes,
		isDragging,
		listeners,
		setNodeRef,
		transform,
		transition,
	} = useSortable( { id: column.id } );

	return (
		<div
			className={ `pmdk-column-option${
				isDragging ? ' is-dragging' : ''
			}${ canHide ? '' : ' is-required' }` }
			ref={ setNodeRef }
			style={ {
				transform: CSS.Transform.toString( transform ),
				transition,
			} }
		>
			<button
				className="pmdk-column-drag-handle"
				type="button"
				aria-label={ labels.columnDrag( label ) }
				{ ...attributes }
				{ ...listeners }
			>
				{ renderIcon( 'moreVertical' ) }
			</button>
			<label>
				<input
					type="checkbox"
					checked={ column.getIsVisible() }
					disabled={ ! canHide }
					onChange={ column.getToggleVisibilityHandler() }
				/>
				<span className="pmdk-filter-checkbox">
					{ renderIcon( 'check' ) }
				</span>
				<span className="pmdk-column-option-label">
					<span>{ label }</span>
					{ canHide ? null : (
						<small>{ labels.columnsRequired }</small>
					) }
				</span>
			</label>
		</div>
	);
}

/*
 * Overflow actions menu: built-in Columns manager (visibility + drag order)
 * plus product-supplied menu items.
 */
function TableActionsMenu( {
	table,
	defaults,
	menuItems,
	labels,
	renderIcon,
} ) {
	const [ panel, setPanel ] = useState( null );
	const managerRef = useRef( null );
	const menuRef = useRef( null );
	const openedByKeyboard = useRef( false );
	const isOpen = panel !== null;

	useEffect( () => {
		if ( panel === 'menu' && openedByKeyboard.current ) {
			window.requestAnimationFrame( () =>
				menuRef.current
					?.querySelector( '[role="menuitem"]' )
					?.focus(),
			);
		}
		if ( panel === null ) {
			openedByKeyboard.current = false;
		}
	}, [ panel ] );

	const columns = table
		.getState()
		.columnOrder.filter( ( id ) => id !== 'select' )
		.map( ( id ) => table.getColumn( id ) )
		.filter(
			( column ) =>
				column &&
				! column.columnDef.meta?.filterOnly &&
				column.columnDef.meta?.sticky !== 'end' &&
				column.id !== 'action',
		);
	const sensors = useSensors(
		useSensor( PointerSensor, {
			activationConstraint: { distance: 5 },
		} ),
		useSensor( KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		} ),
	);

	useEffect( () => {
		if ( ! isOpen ) {
			return undefined;
		}
		const close = ( event ) => {
			if ( ! managerRef.current?.contains( event.target ) ) {
				setPanel( null );
			}
		};
		document.addEventListener( 'pointerdown', close );
		return () => document.removeEventListener( 'pointerdown', close );
	}, [ isOpen ] );

	useEffect( () => {
		if ( ! isOpen ) {
			return undefined;
		}
		const closeOnEscape = ( event ) => {
			if ( event.key === 'Escape' ) {
				if ( panel === 'columns' ) {
					setPanel( 'menu' );
				} else {
					setPanel( null );
					managerRef.current
						?.querySelector( '.pmdk-column-trigger' )
						?.focus();
				}
			}
		};
		document.addEventListener( 'keydown', closeOnEscape );
		return () =>
			document.removeEventListener( 'keydown', closeOnEscape );
	}, [ isOpen, panel ] );

	const reorderColumns = ( { active, over } ) => {
		if ( ! over || active.id === over.id ) {
			return;
		}
		const ids = columns.map( ( column ) => column.id );
		const oldIndex = ids.indexOf( String( active.id ) );
		const newIndex = ids.indexOf( String( over.id ) );
		if ( oldIndex < 0 || newIndex < 0 ) {
			return;
		}
		const reordered = arrayMove( ids, oldIndex, newIndex );
		let managedIndex = 0;
		table.setColumnOrder(
			table
				.getState()
				.columnOrder.map( ( id ) =>
					ids.includes( id ) ? reordered[ managedIndex++ ] : id,
				),
		);
	};

	const hasMenuItems = Boolean( menuItems && menuItems.length );

	return (
		<div className="pmdk-column-manager" ref={ managerRef }>
			<button
				className="pmdk-toolbar-export pmdk-column-trigger pmdk-table-options-trigger"
				type="button"
				aria-haspopup="menu"
				aria-expanded={ isOpen }
				aria-label={ labels.actionsMenu }
				title={ labels.actionsMenu }
				onClick={ ( event ) => {
					openedByKeyboard.current = event.detail === 0;
					setPanel( ( current ) => ( current ? null : 'menu' ) );
				} }
			>
				{ renderIcon( 'moreVertical' ) }
			</button>
			{ panel === 'menu' ? (
				<div
					className="pmdk-table-actions-popover"
					role="menu"
					aria-label={ labels.actionsMenu }
					ref={ menuRef }
					tabIndex={ -1 }
					onKeyDown={ menuRovingKeydown }
				>
					<button
						type="button"
						role="menuitem"
						onClick={ () => setPanel( 'columns' ) }
					>
						{ renderIcon( 'list' ) }
						<span>
							<strong>{ labels.columns }</strong>
						</span>
						{ renderIcon( 'chevron' ) }
					</button>
					{ hasMenuItems ? (
						<div
							className="pmdk-table-actions-separator"
							role="separator"
						/>
					) : null }
					{ ( menuItems || [] ).map( ( item, index ) => (
						<button
							type="button"
							role="menuitem"
							key={ item.id ?? `menu-item-${ index }` }
							onClick={ () => {
								item.onSelect?.();
								setPanel( null );
							} }
						>
							{ item.icon || null }
							<span>
								<strong>{ item.label }</strong>
								{ item.hint ? (
									<small>{ item.hint }</small>
								) : null }
							</span>
						</button>
					) ) }
				</div>
			) : null }
			{ panel === 'columns' ? (
				<div
					className="pmdk-column-popover"
					role="dialog"
					aria-label={ labels.columnsDialog }
				>
					<header>
						<button
							className="pmdk-column-back"
							type="button"
							aria-label={ labels.columnsBack }
							onClick={ () => setPanel( 'menu' ) }
						>
							{ renderIcon( 'chevronLeft' ) }
						</button>
						<span>
							<strong>{ labels.columns }</strong>
						</span>
						<button
							type="button"
							onClick={ () => {
								table.setColumnVisibility(
									defaults.columnVisibility,
								);
								table.setColumnOrder( defaults.columnOrder );
							} }
						>
							{ labels.columnsReset }
						</button>
					</header>
					<DndContext
						collisionDetection={ closestCenter }
						sensors={ sensors }
						onDragEnd={ reorderColumns }
					>
						<SortableContext
							items={ columns.map( ( column ) => column.id ) }
							strategy={ verticalListSortingStrategy }
						>
							<div className="pmdk-column-list">
								{ columns.map( ( column ) => (
									<SortableColumnOption
										column={ column }
										key={ column.id }
										labels={ labels }
										renderIcon={ renderIcon }
									/>
								) ) }
							</div>
						</SortableContext>
					</DndContext>
				</div>
			) : null }
		</div>
	);
}

function StatePanel( { config, fallbackIcon, renderIcon, variant = '' } ) {
	return (
		<div className={ `pmdk-state-panel${ variant }` }>
			<span
				className={ `pmdk-state-icon${
					config.tone === 'error' ? ' is-error' : ''
				}` }
			>
				{ config.icon || renderIcon( fallbackIcon ) }
			</span>
			{ config.title ? <h2>{ config.title }</h2> : null }
			{ config.description ? <p>{ config.description }</p> : null }
			{ config.action || null }
		</div>
	);
}

function LoadingPanel( { labels } ) {
	return (
		<div
			className="pmdk-state-panel pmdk-state-loading"
			role="status"
			aria-label={ labels.loadingAria }
		>
			<div className="pmdk-state-skeleton-head">
				<i />
				<i />
			</div>
			<div className="pmdk-state-skeleton-grid">
				{ Array.from( { length: 9 }, ( _, index ) => (
					<span className="pmdk-skeleton" key={ index } />
				) ) }
			</div>
		</div>
	);
}

export function PMDKDataTable( {
	/* data (product-owned) */
	columns,
	data,
	getRowId,
	/* five states */
	status = 'ready',
	states = {},
	/* selection + bulk */
	enableRowSelection = true,
	bulkActions,
	getRowSelectionLabel,
	onRowSelectionChange,
	/* search + filters */
	enableSearch = true,
	globalFilterFn,
	getColumnCanGlobalFilter,
	toolbarControls,
	filterBuilder,
	activeFilters,
	filterCount = 0,
	initialColumnFilters = [],
	/* controlled filtering (uncontrolled fallback when undefined) */
	columnFilters: controlledColumnFilters,
	onColumnFiltersChange,
	filtersOpen: controlledFiltersOpen,
	onFiltersOpenChange,
	/* toolbar actions */
	primaryAction,
	menuItems,
	enableColumnManager = true,
	/* view defaults */
	defaultSorting = [],
	defaultColumnVisibility = {},
	defaultColumnOrder,
	/* pagination */
	pageSizeOptions = [ 25, 50, 100 ],
	defaultPageSize = 25,
	/* server mode */
	serverMode = false,
	totalCount,
	pageIndex: controlledPageIndex = 0,
	onQueryChange,
	/* persistence — storage key AND/OR pluggable product store */
	persistenceKey = '',
	initialPreferences,
	onPreferencesChange,
	/* interaction */
	onRowActivate,
	getRowAriaLabel,
	renderIcon = defaultRenderIcon,
	renderMobileItem,
	itemsLabel = 'items',
	labels: labelOverrides,
	className = '',
} ) {
	const labels = useMemo(
		() => ( { ...DEFAULT_LABELS, ...labelOverrides } ),
		[ labelOverrides ],
	);

	/* --- column scaffolding --------------------------------------------- */
	const endColumnId = useMemo( () => {
		const end = columns.find(
			( column ) =>
				column.id === 'action' || column.meta?.sticky === 'end',
		);
		return end ? end.id || 'action' : '';
	}, [ columns ] );

	const allColumns = useMemo( () => {
		if ( ! enableRowSelection ) {
			return columns;
		}
		const selectColumn = {
			id: 'select',
			size: 36,
			enableHiding: false,
			enableSorting: false,
			header: ( { table } ) => (
				<IndeterminateCheckbox
					aria-label={ labels.selectAll }
					checked={ table.getIsAllPageRowsSelected() }
					indeterminate={ table.getIsSomePageRowsSelected() }
					onChange={ table.getToggleAllPageRowsSelectedHandler() }
				/>
			),
			cell: ( { row } ) => (
				<IndeterminateCheckbox
					aria-label={
						getRowSelectionLabel
							? getRowSelectionLabel( row.original )
							: labels.selectRow( row.id )
					}
					checked={ row.getIsSelected() }
					disabled={ ! row.getCanSelect() }
					indeterminate={ row.getIsSomeSelected() }
					onClick={ ( event ) => event.stopPropagation() }
					onChange={ row.getToggleSelectedHandler() }
				/>
			),
		};
		return [ selectColumn, ...columns ];
	}, [ columns, enableRowSelection, getRowSelectionLabel, labels ] );

	const allLeafIds = useMemo(
		() =>
			allColumns.map(
				( column ) =>
					column.id ||
					( typeof column.accessorKey === 'string'
						? column.accessorKey
						: '' ),
			),
		[ allColumns ],
	);

	const baseOrder = useMemo(
		() =>
			normalizeColumnOrder(
				defaultColumnOrder || allLeafIds,
				allLeafIds,
				endColumnId,
			),
		[ defaultColumnOrder, allLeafIds, endColumnId ],
	);

	/* --- persisted view state ---------------------------------------------
	 * Two pluggable layers (G2): the localStorage key AND/OR a product store.
	 * Seed order: defaults < localStorage blob < `initialPreferences` (the
	 * product's own store — e.g. WP user-meta — wins when both exist).
	 * Every preference change reports through `onPreferencesChange` AND (when
	 * a key is set) writes localStorage. */
	const { initial, persist } = useTablePersistence( persistenceKey, {
		sorting: defaultSorting,
		columnVisibility: defaultColumnVisibility,
		columnOrder: baseOrder,
		pageSize: defaultPageSize,
	} );
	const [ seeded ] = useState( () => ( {
		...initial,
		...( initialPreferences || {} ),
	} ) );

	const [ sorting, setSorting ] = useState( seeded.sorting );
	const [ columnVisibility, setColumnVisibility ] = useState(
		seeded.columnVisibility,
	);
	const [ columnOrder, setColumnOrder ] = useState( () =>
		normalizeColumnOrder( seeded.columnOrder, allLeafIds, endColumnId ),
	);
	const [ globalFilter, setGlobalFilter ] = useState( '' );
	const [ rowSelection, setRowSelection ] = useState( {} );
	const [ pageSize, setPageSize ] = useState( seeded.pageSize );
	const [ internalPageIndex, setInternalPageIndex ] = useState( 0 );
	const rootRef = useRef( null );
	const filterButtonRef = useRef( null );
	const filterBuilderId = useRef(
		`pmdk-filter-builder-${ Math.random().toString( 36 ).slice( 2, 8 ) }`,
	);

	/* --- controlled/uncontrolled column filters (G1) ---------------------- */
	const [ internalColumnFilters, setInternalColumnFilters ] = useState(
		initialColumnFilters,
	);
	const isFiltersControlled = controlledColumnFilters !== undefined;
	const columnFilters = isFiltersControlled
		? controlledColumnFilters
		: internalColumnFilters;
	const columnFiltersRef = useRef( columnFilters );
	columnFiltersRef.current = columnFilters;
	const handleColumnFiltersChange = useCallback(
		( updater ) => {
			const next =
				typeof updater === 'function'
					? updater( columnFiltersRef.current )
					: updater;
			if ( ! isFiltersControlled ) {
				setInternalColumnFilters( next );
			}
			onColumnFiltersChange?.( next );
		},
		[ isFiltersControlled, onColumnFiltersChange ],
	);

	/* --- controlled/uncontrolled filter-builder visibility (G1) ----------- */
	const [ internalFiltersOpen, setInternalFiltersOpen ] = useState( false );
	const isFiltersOpenControlled = controlledFiltersOpen !== undefined;
	const filtersOpen = isFiltersOpenControlled
		? controlledFiltersOpen
		: internalFiltersOpen;
	const filtersOpenRef = useRef( filtersOpen );
	filtersOpenRef.current = filtersOpen;
	const setFiltersOpenState = useCallback(
		( next ) => {
			const resolved =
				typeof next === 'function'
					? next( filtersOpenRef.current )
					: next;
			if ( ! isFiltersOpenControlled ) {
				setInternalFiltersOpen( resolved );
			}
			onFiltersOpenChange?.( resolved );
		},
		[ isFiltersOpenControlled, onFiltersOpenChange ],
	);

	/* --- row-selection change reporting (G3) ------------------------------ */
	const rowSelectionRef = useRef( rowSelection );
	rowSelectionRef.current = rowSelection;
	const handleRowSelectionChange = useCallback(
		( updater ) => {
			const next =
				typeof updater === 'function'
					? updater( rowSelectionRef.current )
					: updater;
			setRowSelection( next );
			onRowSelectionChange?.( next );
		},
		[ onRowSelectionChange ],
	);

	const pageIndex = serverMode ? controlledPageIndex : internalPageIndex;

	useEffect( () => {
		persist( { sorting, columnVisibility, columnOrder, pageSize } );
		onPreferencesChange?.( {
			sorting,
			columnVisibility,
			columnOrder,
			pageSize,
		} );
	}, [
		sorting,
		columnVisibility,
		columnOrder,
		pageSize,
		persist,
		onPreferencesChange,
	] );

	/* --- server-mode query callback -------------------------------------- */
	const lastQueryRef = useRef( null );
	useEffect( () => {
		if ( ! serverMode || ! onQueryChange ) {
			return;
		}
		const queryPart = { sorting, columnFilters, globalFilter, pageSize };
		const serialized = JSON.stringify( queryPart );
		if ( lastQueryRef.current === null ) {
			// Mount: report the initial (possibly persisted) view once.
			lastQueryRef.current = serialized;
			onQueryChange( { ...queryPart, pageIndex } );
			return;
		}
		if ( lastQueryRef.current !== serialized ) {
			lastQueryRef.current = serialized;
			// A sort/filter/size change invalidates the page — signal page 0.
			onQueryChange( { ...queryPart, pageIndex: 0 } );
		}
		// pageIndex-only changes are requested through onQueryChange directly
		// from the pagination controls below.
	}, [
		serverMode,
		onQueryChange,
		sorting,
		columnFilters,
		globalFilter,
		pageSize,
		pageIndex,
	] );

	const requestPage = useCallback(
		( nextIndex ) => {
			if ( serverMode ) {
				onQueryChange?.( {
					sorting,
					columnFilters,
					globalFilter,
					pageSize,
					pageIndex: nextIndex,
				} );
			} else {
				setInternalPageIndex( nextIndex );
			}
		},
		[
			serverMode,
			onQueryChange,
			sorting,
			columnFilters,
			globalFilter,
			pageSize,
		],
	);

	/* --- table instance --------------------------------------------------- */
	const table = useReactTable( {
		data,
		columns: allColumns,
		state: {
			sorting,
			columnVisibility,
			columnOrder,
			globalFilter,
			columnFilters,
			rowSelection,
			pagination: { pageIndex, pageSize },
		},
		onSortingChange: setSorting,
		onColumnVisibilityChange: setColumnVisibility,
		onColumnOrderChange: setColumnOrder,
		onGlobalFilterChange: setGlobalFilter,
		onColumnFiltersChange: handleColumnFiltersChange,
		onRowSelectionChange: handleRowSelectionChange,
		...( globalFilterFn ? { globalFilterFn } : {} ),
		...( getColumnCanGlobalFilter ? { getColumnCanGlobalFilter } : {} ),
		...( getRowId ? { getRowId } : {} ),
		enableRowSelection,
		getCoreRowModel: getCoreRowModel(),
		...( serverMode
			? {
				manualSorting: true,
				manualFiltering: true,
				manualPagination: true,
				rowCount: totalCount ?? data.length,
			}
			: {
				getFilteredRowModel: getFilteredRowModel(),
				getSortedRowModel: getSortedRowModel(),
				getPaginationRowModel: getPaginationRowModel(),
				autoResetPageIndex: false,
				onPaginationChange: ( updater ) => {
					const next =
							typeof updater === 'function'
								? updater( { pageIndex, pageSize } )
								: updater;
					setInternalPageIndex( next.pageIndex );
					setPageSize( next.pageSize );
				},
			} ),
	} );

	const rows = table.getRowModel().rows;
	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const visibleColumns = table.getVisibleLeafColumns();
	const resolvedTotal = serverMode
		? totalCount ?? data.length
		: table.getFilteredRowModel().rows.length;
	const firstVisible = ( pageIndex * pageSize ) + ( rows.length ? 1 : 0 );
	const lastVisible = ( pageIndex * pageSize ) + rows.length;

	// Client mode: clamp the page if filters shrank the row set beneath it.
	useEffect( () => {
		if ( serverMode ) {
			return;
		}
		const pageCount = table.getPageCount();
		if ( pageCount > 0 && internalPageIndex > pageCount - 1 ) {
			setInternalPageIndex( pageCount - 1 );
		}
	}, [ serverMode, table, internalPageIndex, resolvedTotal ] );

	const clearSelection = useCallback( () => {
		handleRowSelectionChange( {} );
	}, [ handleRowSelectionChange ] );

	/*
	 * Bulk-row select-all: on uncheck the bulk row unmounts (normal thead
	 * returns) and focus would be dropped on <body> — restore it to the new
	 * thead checkbox on the next frame (ports BookingsTable behavior).
	 */
	const toggleBulkSelection = ( event ) => {
		const selectAll = event.target.checked;
		table.toggleAllPageRowsSelected( selectAll );
		if ( ! selectAll ) {
			const rootEl = rootRef.current;
			window.requestAnimationFrame( () =>
				rootEl
					?.querySelector( 'thead .pmdk-table-checkbox' )
					?.focus( { preventScroll: true } ),
			);
		}
	};

	/* --- filter-builder escape handling ---------------------------------- */
	useEffect( () => {
		if ( ! filtersOpen ) {
			return undefined;
		}
		const closeOnEscape = ( event ) => {
			if (
				event.key !== 'Escape' ||
				filterButtonRef.current?.ownerDocument.activeElement?.closest(
					'.pmdk-facet-popover',
				)
			) {
				return;
			}
			event.preventDefault();
			setFiltersOpenState( false );
			filterButtonRef.current?.focus();
		};
		document.addEventListener( 'keydown', closeOnEscape );
		return () =>
			document.removeEventListener( 'keydown', closeOnEscape );
	}, [ filtersOpen, setFiltersOpenState ] );

	/* --- render ----------------------------------------------------------- */
	const showToolbar = status !== 'empty' && status !== 'permission';
	const hasFilterArea = Boolean( filterBuilder );
	// `filterCount` may be a plain number or a function of the table (products
	// usually derive the badge from live column-filter state).
	const resolvedFilterCount =
		typeof filterCount === 'function'
			? filterCount( { table } )
			: filterCount;
	const activeChips = renderSlot( activeFilters, { table } );

	const toolbar = showToolbar ? (
		<div className="pmdk-toolbar">
			<div className="pmdk-toolbar-main">
				<div className="pmdk-toolbar-query">
					{ enableSearch ? (
						<label className="pmdk-search">
							{ renderIcon( 'search' ) }
							<input
								type="search"
								value={ globalFilter ?? '' }
								placeholder={ labels.searchPlaceholder }
								aria-label={ labels.searchAria }
								onChange={ ( event ) =>
									setGlobalFilter( event.target.value )
								}
							/>
						</label>
					) : null }
					<div className="pmdk-toolbar-filter-controls">
						{ renderSlot( toolbarControls, { table } ) }
						{ hasFilterArea ? (
							<button
								className="pmdk-toolbar-export pmdk-toolbar-filter-button"
								ref={ filterButtonRef }
								type="button"
								aria-label={
									filtersOpen
										? labels.filtersHide
										: labels.filtersShow
								}
								title={ labels.filtersTitle }
								aria-controls={ filterBuilderId.current }
								aria-expanded={ filtersOpen }
								onClick={ () =>
									setFiltersOpenState( ( open ) => ! open )
								}
							>
								{ renderIcon( 'sliders' ) }
								{ resolvedFilterCount ? (
									<span className="pmdk-filter-count">
										{ resolvedFilterCount }
									</span>
								) : null }
							</button>
						) : null }
					</div>
				</div>
				<div className="pmdk-toolbar-actions">
					{ enableColumnManager ? (
						<TableActionsMenu
							table={ table }
							defaults={ {
								columnVisibility: defaultColumnVisibility,
								columnOrder: baseOrder,
							} }
							menuItems={ menuItems }
							labels={ labels }
							renderIcon={ renderIcon }
						/>
					) : null }
					{ ( Array.isArray( primaryAction )
						? Children.toArray( primaryAction )
						: primaryAction ) || null }
				</div>
			</div>
			{ activeChips && ! filtersOpen ? (
				<div
					className="pmdk-active-filters"
					aria-label={ labels.filtersTitle }
				>
					{ activeChips }
				</div>
			) : null }
			{ hasFilterArea && filtersOpen ? (
				<div
					className="pmdk-filter-builder"
					id={ filterBuilderId.current }
					aria-label={ labels.filtersTitle }
				>
					{ renderSlot( filterBuilder, {
						table,
						close: () => setFiltersOpenState( false ),
					} ) }
				</div>
			) : null }
		</div>
	) : null;

	let body = null;
	if ( status === 'loading' ) {
		body = <LoadingPanel labels={ labels } />;
	} else if ( status === 'empty' ) {
		body = (
			<StatePanel
				config={ states.empty || {} }
				fallbackIcon="plus"
				renderIcon={ renderIcon }
			/>
		);
	} else if ( status === 'error' ) {
		body = (
			<StatePanel
				config={ { tone: 'error', ...( states.error || {} ) } }
				fallbackIcon="close"
				renderIcon={ renderIcon }
			/>
		);
	} else if ( status === 'permission' ) {
		body = (
			<StatePanel
				config={ states.permission || {} }
				fallbackIcon="close"
				renderIcon={ renderIcon }
			/>
		);
	} else if ( ! rows.length ) {
		body = (
			<div className="pmdk-empty">
				{ renderIcon( 'search' ) }
				<h2>{ labels.noResultsTitle }</h2>
				<p>{ labels.noResultsBody }</p>
			</div>
		);
	} else {
		body = (
			<>
				<div className="pmdk-table-wrap">
					<table
						className="pmdk-table"
						style={ { minWidth: table.getTotalSize() } }
					>
						<colgroup>
							{ visibleColumns.map( ( column ) => (
								<col
									key={ column.id }
									style={ { width: column.getSize() } }
								/>
							) ) }
						</colgroup>
						<thead>
							{ selectedRows.length ? (
								<tr className="pmdk-bulk-row">
									<th
										className="pmdk-col-select"
										scope="col"
										data-column="select"
									>
										<IndeterminateCheckbox
											aria-label={
												table.getIsAllPageRowsSelected()
													? labels.unselectAll
													: labels.selectAll
											}
											checked={ table.getIsAllPageRowsSelected() }
											indeterminate={ table.getIsSomePageRowsSelected() }
											onChange={ toggleBulkSelection }
										/>
									</th>
									<th
										className="pmdk-bulk-bar-cell"
										colSpan={ Math.max(
											1,
											visibleColumns.length - 1,
										) }
									>
										<div
											className="pmdk-bulk-bar"
											role="toolbar"
											aria-label={ labels.bulkAria }
										>
											<strong>
												{ labels.selected(
													selectedRows.length,
												) }
											</strong>
											<div className="pmdk-bulk-actions">
												{ renderSlot(
													bulkActions,
													{
														selectedRows,
														clearSelection,
													},
												) ?? null }
											</div>
											<button
												className="pmdk-bulk-clear"
												type="button"
												aria-label={
													labels.clearSelection
												}
												onClick={ clearSelection }
											>
												{ renderIcon( 'close' ) }
											</button>
										</div>
									</th>
								</tr>
							) : (
								table
									.getHeaderGroups()
									.map( ( headerGroup ) => (
										<tr key={ headerGroup.id }>
											{ headerGroup.headers.map(
												( header ) => (
													<th
														className={ columnClassName(
															header.column.id,
															endColumnId,
														) }
														scope="col"
														data-column={
															header.column.id
														}
														aria-sort={ ariaSortValue(
															header.column.getIsSorted(),
														) }
														key={ header.id }
													>
														<HeaderContent
															header={ header }
															renderIcon={
																renderIcon
															}
														/>
													</th>
												),
											) }
										</tr>
									) )
							) }
						</thead>
						<tbody>
							{ rows.map( ( row ) => {
								const activateFromClick = ( event ) => {
									if (
										event.target.closest(
											'button,input,a,select,textarea,[role="menu"]',
										)
									) {
										return;
									}
									onRowActivate( row.original, row );
								};
								const activateFromKey = ( event ) => {
									if (
										event.target ===
											event.currentTarget &&
										( event.key === 'Enter' ||
											event.key === ' ' )
									) {
										event.preventDefault();
										onRowActivate( row.original, row );
									}
								};
								return (
									<tr
										className={
											row.getIsSelected()
												? 'is-selected'
												: undefined
										}
										data-row-id={ row.id }
										tabIndex={
											onRowActivate ? 0 : undefined
										}
										aria-label={
											getRowAriaLabel
												? getRowAriaLabel( row.original )
												: undefined
										}
										aria-selected={
											enableRowSelection
												? row.getIsSelected()
												: undefined
										}
										key={ row.id }
										onClick={
											onRowActivate
												? activateFromClick
												: undefined
										}
										onKeyDown={
											onRowActivate
												? activateFromKey
												: undefined
										}
									>
										{ row
											.getVisibleCells()
											.map( ( cell ) => (
												<td
													className={ columnClassName(
														cell.column.id,
														endColumnId,
														cell.column
															.columnDef.meta,
													) }
													data-column={
														cell.column.id
													}
													key={ cell.id }
												>
													{ flexRender(
														cell.column
															.columnDef.cell,
														cell.getContext(),
													) }
												</td>
											) ) }
									</tr>
								);
							} ) }
						</tbody>
					</table>
				</div>
				{ renderMobileItem ? (
					<div className="pmdk-mobile-list">
						{ rows.map( ( row ) =>
							renderMobileItem( row.original, row ),
						) }
					</div>
				) : null }
			</>
		);
	}

	const showPagination = status === 'ready';

	return (
		<div
			className={ `pmdk-data-table pmdk-data-list${
				className ? ` ${ className }` : ''
			}` }
			ref={ rootRef }
		>
			{ toolbar }
			{ body }
			{ showPagination ? (
				<footer className="pmdk-pagination">
					<span>
						{ labels.showing(
							firstVisible,
							lastVisible,
							resolvedTotal,
							itemsLabel,
						) }
					</span>
					<div className="pmdk-pagination-tools">
						<label className="pmdk-pagination-size">
							{ labels.rowsPerPage }{ ' ' }
							<select
								value={ pageSize }
								aria-label={ labels.rowsPerPageAria }
								onChange={ ( event ) => {
									const nextPageSize = Number(
										event.target.value,
									);
									setPageSize( nextPageSize );
									if ( ! serverMode ) {
										setInternalPageIndex( 0 );
									}
								} }
							>
								{ pageSizeOptions.map( ( option ) => (
									<option key={ option } value={ option }>
										{ option }
									</option>
								) ) }
							</select>
						</label>
						<div className="pmdk-page-controls">
							<button
								type="button"
								disabled={ pageIndex === 0 }
								aria-label={ labels.previousPage }
								onClick={ () =>
									requestPage( pageIndex - 1 )
								}
							>
								{ renderIcon( 'chevronLeft' ) }
							</button>
							<button
								type="button"
								disabled={
									lastVisible >= resolvedTotal
								}
								aria-label={ labels.nextPage }
								onClick={ () =>
									requestPage( pageIndex + 1 )
								}
							>
								{ renderIcon( 'chevron' ) }
							</button>
						</div>
					</div>
				</footer>
			) : null }
		</div>
	);
}
