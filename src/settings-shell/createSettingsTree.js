/**
 * createSettingsTree — the pure routing brain behind `<SettingsShell>`
 * (K-043).
 *
 * Promoted from Aponto's `assets/src/admin/settings/ia.js`, which owns the
 * same parent → child hierarchy and the `#<route>/<parent>/<child>`
 * deep-link contract. Everything Aponto-specific was left behind: no tree
 * literal (the tree is the consumer's), no legacy hash aliases (theirs
 * describe their own retired sections), and no `panels` / `extras` /
 * `component` fields — a section hands back its SOURCE node so a consumer
 * reads whatever it attached there.
 *
 * The value of a factory over loose helpers is that the rail, a header
 * dropdown, the route and the tests all resolve through ONE instance, so a
 * section can never exist in one place and not another.
 *
 * Node shape (only `id` + `label` are the kit's business):
 *
 *   {
 *     id: string,            // hash segment
 *     label: string,         // already-translated visible copy
 *     description?: string,  // sub-line for a LEAF (parents list children)
 *     icon?: node,           // rendered by <SettingsNav>
 *     children?: Node[],     // a parent renders no content of its own
 *     …anything else the consumer needs (panels, component, capability…)
 *   }
 *
 * Every resolver is total: an unknown parent, an unknown child or a
 * garbage segment list lands on a REAL section rather than an empty
 * screen. That totality is what lets a consumer point a bookmark, a
 * dropdown row and a Back button at the same function.
 */

const DEFAULTS = {
	// Hash root segment. `resolve()` accepts segment lists with or without
	// it, so the same function serves `#settings/general/business` and a
	// menu that passes `[ 'general', 'business' ]`.
	route: 'settings',
	// Joins parent + child in `section().label`, and the child labels in
	// `subline()`.
	separator: ' · ',
};

/**
 * Build the resolver bundle for a settings tree.
 *
 * @param {Array<Object>} tree                Parent nodes, in display order.
 * @param {Object}        [options]           Options.
 * @param {string}        [options.route]     Hash root segment (default `settings`).
 * @param {string}        [options.separator] Label joiner (default ` · `).
 * @return {Object} Resolver bundle — see the module docblock.
 */
export function createSettingsTree( tree, options ) {
	const nodes = Array.isArray( tree ) ? tree : [];
	const { route, separator } = { ...DEFAULTS, ...( options || {} ) };

	const defaultParent = nodes[ 0 ]?.id || '';

	/**
	 * Look up a parent node by id.
	 *
	 * @param {string} parentId Parent id.
	 * @return {Object|null} The node, or `null` for an unknown id.
	 */
	function node( parentId ) {
		return nodes.find( ( item ) => item.id === parentId ) || null;
	}

	/**
	 * Children of a parent id.
	 *
	 * @param {string} parentId Parent id.
	 * @return {Array<Object>} Children, or `[]` for a leaf / unknown id.
	 */
	function children( parentId ) {
		const found = node( parentId );
		return found && Array.isArray( found.children ) ? found.children : [];
	}

	/**
	 * First child id of a parent — where a click on the parent lands.
	 *
	 * @param {string} parentId Parent id.
	 * @return {string} Child id, or `''` when the node is a leaf.
	 */
	function defaultChild( parentId ) {
		return children( parentId )[ 0 ]?.id || '';
	}

	/**
	 * Canonical hash path (no leading `#`) for a section.
	 *
	 * @param {string} parentId  Parent id.
	 * @param {string} [childId] Child id; ignored when the parent is a leaf.
	 * @return {string} e.g. `settings/general/business`.
	 */
	function path( parentId, childId = '' ) {
		return childId
			? `${ route }/${ parentId }/${ childId }`
			: `${ route }/${ parentId }`;
	}

	/**
	 * Resolve raw hash segments to a valid parent/child pair.
	 *
	 * Total by design: every unknown or legacy shape falls back to a real
	 * section, which is what keeps old bookmarks working after a tree
	 * reshuffle instead of rendering nothing.
	 *
	 * @param {Array<string>} segments Hash segments, with or without the route root.
	 * @return {{parent: string, child: string}} Resolved ids.
	 */
	function resolve( segments ) {
		const list = Array.isArray( segments ) ? segments : [];
		const rooted = list[ 0 ] === route;
		const requestedParent = rooted ? list[ 1 ] : list[ 0 ];
		const parent = node( requestedParent )
			? requestedParent
			: defaultParent;
		const kids = children( parent );
		if ( ! kids.length ) {
			return { parent, child: '' };
		}
		const requestedChild = rooted ? list[ 2 ] : list[ 1 ];
		const child = kids.some( ( item ) => item.id === requestedChild )
			? requestedChild
			: kids[ 0 ].id;
		return { parent, child };
	}

	/**
	 * Resolve a hash (`#settings/general/business`, with or without the
	 * `#`) straight to a parent/child pair — the shape a router hands over.
	 *
	 * @param {string} hash Location hash.
	 * @return {{parent: string, child: string}} Resolved ids.
	 */
	function resolveHash( hash ) {
		return resolve(
			String( hash || '' )
				.replace( /^#/, '' )
				.split( '/' )
				.filter( Boolean ),
		);
	}

	/**
	 * The rendering descriptor for a resolved section.
	 *
	 * `source` is the node that owns the content — the child when there is
	 * one, else the parent. Consumer fields (`panels`, `component`, …) live
	 * on it, so the kit never has to know their names.
	 *
	 * @param {string} parentId  Parent id.
	 * @param {string} [childId] Child id (`''` for a leaf).
	 * @return {{parent: Object, child: (Object|null), source: Object, label: string}}
	 *         Section descriptor.
	 */
	function section( parentId, childId = '' ) {
		const parent = node( parentId ) || nodes[ 0 ] || null;
		if ( ! parent ) {
			return { parent: null, child: null, source: null, label: '' };
		}
		const child =
			children( parent.id ).find( ( item ) => item.id === childId ) ||
			null;
		return {
			parent,
			child,
			source: child || parent,
			label: child
				? `${ parent.label }${ separator }${ child.label }`
				: parent.label,
		};
	}

	/**
	 * Sub-line for a tree node: a parent advertises its children, a leaf
	 * its own description. Feeds a header dropdown row or a rail tooltip.
	 *
	 * @param {Object} treeNode Tree node.
	 * @return {string} Sub-line copy.
	 */
	function subline( treeNode ) {
		const kids = children( treeNode?.id );
		if ( kids.length ) {
			return kids.map( ( child ) => child.label ).join( separator );
		}
		return treeNode?.description || '';
	}

	return {
		tree: nodes,
		route,
		defaultParent,
		node,
		children,
		defaultChild,
		path,
		resolve,
		resolveHash,
		section,
		subline,
	};
}

export default createSettingsTree;
