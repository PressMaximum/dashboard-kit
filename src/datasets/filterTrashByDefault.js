/**
 * filterTrashByDefault — pre-filter items so trashed records hide unless
 * the user has explicitly opted in via a `status` filter. SPEC §5.6.
 *
 * Mirrors the UX of `WP_List_Table`'s subsubsub navigation: the default
 * "All" view excludes trash, you click the "Trash" link to see it. Site
 * Editor's DataViews-backed pages follow the same convention.
 *
 * Pass through `view.filters` to decide:
 * - No `status` filter present → trash hidden.
 * - `status` filter with `value === 'trash'` (single) or array
 *   containing `'trash'` (isAny) → trash visible.
 *
 * Consumer wiring (typical):
 *
 *     const visibleItems = useMemo(
 *         () => filterTrashByDefault( items, view ),
 *         [ items, view ]
 *     );
 *     const { data: shown, paginationInfo } = useMemo(
 *         () => filterSortAndPaginate( visibleItems, view, fields ),
 *         [ visibleItems, view, fields ]
 *     );
 *
 * Ported from the Surfaces spike (`tabs/Surfaces/index.js:297-307`)
 * which inlined the same predicate. Extracting to a helper means
 * Pattern-A consumers (Templates, Surfaces, anything CPT-list-style)
 * share one implementation.
 *
 * @param {Array<{ status?: string }>}                             items Records to filter.
 * @param {{ filters?: Array<{ field: string, value: unknown }> }} view
 *                                                                       DataViews view config.
 * @return {Array} Items with trash filtered out unless explicitly opted-in.
 */
export function filterTrashByDefault( items, view ) {
	if ( ! Array.isArray( items ) ) {
		return [];
	}
	const filters = view && Array.isArray( view.filters ) ? view.filters : [];
	const statusFilter = filters.find( ( f ) => f && f.field === 'status' );
	const wantsTrash = wantsTrashFromFilter( statusFilter );
	return wantsTrash
		? items
		: items.filter( ( item ) => item && item.status !== 'trash' );
}

function wantsTrashFromFilter( statusFilter ) {
	if ( ! statusFilter ) {
		return false;
	}
	if ( Array.isArray( statusFilter.value ) ) {
		return statusFilter.value.includes( 'trash' );
	}
	return statusFilter.value === 'trash';
}

export default filterTrashByDefault;
