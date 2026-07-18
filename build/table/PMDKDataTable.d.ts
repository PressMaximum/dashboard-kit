/**
 * Pin `select` first and the sticky-end column last; keep the user's stored
 * order for the rest, dropping ids that no longer exist and appending new ones.
 *
 * @param {string[]} preferredOrder Stored/preferred column id order.
 * @param {string[]} allIds         Every current leaf column id.
 * @param {string}   endId          Column id pinned to the end ('' for none).
 * @return {string[]} Normalised column order.
 */
export function normalizeColumnOrder(preferredOrder: string[], allIds: string[], endId?: string): string[];
export function PMDKDataTable({ columns, data, getRowId, status, states, enableRowSelection, bulkActions, getRowSelectionLabel, onRowSelectionChange, enableSearch, globalFilterFn, getColumnCanGlobalFilter, toolbarControls, filterBuilder, activeFilters, filterCount, initialColumnFilters, columnFilters: controlledColumnFilters, onColumnFiltersChange, filtersOpen: controlledFiltersOpen, onFiltersOpenChange, primaryAction, menuItems, enableColumnManager, defaultSorting, defaultColumnVisibility, defaultColumnOrder, pageSizeOptions, defaultPageSize, serverMode, totalCount, pageIndex: controlledPageIndex, onQueryChange, persistenceKey, initialPreferences, onPreferencesChange, onRowActivate, getRowAriaLabel, renderIcon, renderMobileItem, itemsLabel, labels: labelOverrides, className, }: {
    columns: any;
    data: any;
    getRowId: any;
    status?: string;
    states?: {};
    enableRowSelection?: boolean;
    bulkActions: any;
    getRowSelectionLabel: any;
    onRowSelectionChange: any;
    enableSearch?: boolean;
    globalFilterFn: any;
    getColumnCanGlobalFilter: any;
    toolbarControls: any;
    filterBuilder: any;
    activeFilters: any;
    filterCount?: number;
    initialColumnFilters?: any[];
    columnFilters: any;
    onColumnFiltersChange: any;
    filtersOpen: any;
    onFiltersOpenChange: any;
    primaryAction: any;
    menuItems: any;
    enableColumnManager?: boolean;
    defaultSorting?: any[];
    defaultColumnVisibility?: {};
    defaultColumnOrder: any;
    pageSizeOptions?: number[];
    defaultPageSize?: number;
    serverMode?: boolean;
    totalCount: any;
    pageIndex?: number;
    onQueryChange: any;
    persistenceKey?: string;
    initialPreferences: any;
    onPreferencesChange: any;
    onRowActivate: any;
    getRowAriaLabel: any;
    renderIcon?: typeof defaultRenderIcon;
    renderMobileItem: any;
    itemsLabel?: string;
    labels: any;
    className?: string;
}): import("react").JSX.Element;
import { defaultRenderIcon } from './icons.jsx';
