/**
 * createI18nBag — merge a component's English defaults with consumer
 * overrides. Tier-2 components call this once in their render bodies so
 * the labels prop becomes optional: consumers translate the strings they
 * care about and inherit kit defaults for the rest.
 *
 * Companion to the per-component string templates in `templates/strings/`
 * (kit-generated; see SPEC §5.13 + §6.2). The template files give the
 * consumer something concrete to copy into their own `_kit-strings.js`;
 * this helper is the runtime side.
 *
 * @example
 *   const DEFAULTS = { loading: 'Loading…', noResults: 'No items.' };
 *   function EntityListPage( { labels } ) {
 *       const L = createI18nBag( DEFAULTS, labels );
 *       return <p>{ L.loading }</p>;
 *   }
 *
 * @template {Record<string, string>} T
 * @param {T}          defaults    Kit's English fallback strings.
 * @param {Partial<T>} [overrides] Consumer-supplied translated strings.
 * @return {T} Merged labels.
 */
export function createI18nBag( defaults, overrides ) {
	if ( ! overrides || typeof overrides !== 'object' ) {
		return { ...defaults };
	}
	return { ...defaults, ...overrides };
}

export default createI18nBag;
