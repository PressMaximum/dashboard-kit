/**
 * Neutral record fixture + product-side column defs for the PMDKDataTable
 * stories (portability boundary: record / item / owner nouns only).
 *
 * Everything in this file is the CONSUMER side of the Q13 split — column defs,
 * cell renderers, facet data — kept out of the kit component on purpose.
 */

const OWNERS = [ 'Ava Chen', 'Liam Novak', 'Maya Patel', 'Noah Kim', 'Zoe Diaz' ];
const CATEGORIES = [ 'Consultation', 'Treatment', 'Training', 'Review' ];
const STATUSES = [ 'pending', 'confirmed', 'completed', 'cancelled' ];

/**
 * Deterministic pseudo-random (stories + VR need stable fixtures). Classic
 * LCG — quality is irrelevant here, determinism is the point.
 *
 * @param {number} seed Start seed.
 * @return {Function} Generator returning floats in [0, 1).
 */
function makeRand( seed ) {
	let state = seed;
	return () => {
		state = ( ( state * 9301 ) + 49297 ) % 233280;
		return state / 233280;
	};
}

export function makeRecords( count = 57 ) {
	const rand = makeRand( 42 );
	return Array.from( { length: count }, ( _, index ) => {
		const day = 1 + Math.floor( rand() * 28 );
		return {
			id: index + 1,
			title: `Record ${ String( index + 1 ).padStart( 3, '0' ) }`,
			owner: OWNERS[ Math.floor( rand() * OWNERS.length ) ],
			category:
				CATEGORIES[ Math.floor( rand() * CATEGORIES.length ) ],
			status: STATUSES[ Math.floor( rand() * STATUSES.length ) ],
			amount: Math.round( rand() * 18000 ) / 100,
			date: `2026-07-${ String( day ).padStart( 2, '0' ) }`,
		};
	} );
}

export const STATUS_LABELS = {
	pending: 'Pending',
	confirmed: 'Confirmed',
	completed: 'Completed',
	cancelled: 'Cancelled',
};

export function arrayFilter( row, columnId, values ) {
	return (
		! Array.isArray( values ) ||
		! values.length ||
		values.includes( row.getValue( columnId ) )
	);
}

const money = ( value ) => `$${ value.toFixed( 2 ) }`;

/** Product-side column defs (cell renderers included). */
export function makeColumns() {
	return [
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
				<span className="pmdk-cell-value">{ info.getValue() }</span>
			),
		},
		{
			accessorKey: 'category',
			id: 'category',
			header: 'Category',
			size: 140,
			meta: { label: 'Category' },
			filterFn: arrayFilter,
			cell: ( info ) => (
				<span className="pmdk-cell-value pmdk-cell-muted">
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
				<span className={ `pmdk-status ${ info.getValue() }` }>
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
					{ money( info.getValue() ) }
				</span>
			),
		},
		{
			accessorKey: 'date',
			id: 'date',
			header: 'Date',
			size: 110,
			meta: { label: 'Date' },
			cell: ( info ) => (
				<span className="pmdk-cell-value pmdk-cell-muted">
					{ info.getValue() }
				</span>
			),
		},
	];
}
