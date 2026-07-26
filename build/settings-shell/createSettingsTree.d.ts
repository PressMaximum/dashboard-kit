/**
 * Build the resolver bundle for a settings tree.
 *
 * @param {Array<Object>} tree                Parent nodes, in display order.
 * @param {Object}        [options]           Options.
 * @param {string}        [options.route]     Hash root segment (default `settings`).
 * @param {string}        [options.separator] Label joiner (default ` · `).
 * @return {Object} Resolver bundle — see the module docblock.
 */
export function createSettingsTree(tree: Array<any>, options?: {
    route?: string;
    separator?: string;
}): any;
export default createSettingsTree;
