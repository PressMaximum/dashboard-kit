/**
 * Default chrome icon set for <PMDKDataTable> (KIT-P3 slice 2).
 *
 * The table renders its own chrome glyphs (sort caret, pagination arrows, drag
 * handle, search, filter, columns, close, check…) so the component is zero-
 * config. Consumers may override any/all via the `renderIcon` prop — DOMAIN cell
 * glyphs (status icons etc.) live in the product's cell renderers, never here.
 *
 * Every glyph is a 1em stroke icon using `currentColor`, wrapped by the caller
 * in `.pmdk-react-icon` (base.css) for one shared optical center.
 */

const stroke = {
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 2,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
};

/* eslint-disable react/no-unknown-property */
const GLYPHS = {
	search: (
		<svg viewBox="0 0 24 24" { ...stroke }>
			<circle cx="11" cy="11" r="7" />
			<path d="m21 21-4.3-4.3" />
		</svg>
	),
	// filter / sliders
	sliders: (
		<svg viewBox="0 0 24 24" { ...stroke }>
			<path d="M4 6h16M4 12h16M4 18h16" />
			<circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
			<circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
			<circle cx="8" cy="18" r="2" fill="currentColor" stroke="none" />
		</svg>
	),
	// columns / list
	list: (
		<svg viewBox="0 0 24 24" { ...stroke }>
			<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
		</svg>
	),
	check: (
		<svg viewBox="0 0 24 24" { ...stroke }>
			<path d="m5 12 5 5L20 7" />
		</svg>
	),
	close: (
		<svg viewBox="0 0 24 24" { ...stroke }>
			<path d="M6 6l12 12M18 6 6 18" />
		</svg>
	),
	plus: (
		<svg viewBox="0 0 24 24" { ...stroke }>
			<path d="M12 5v14M5 12h14" />
		</svg>
	),
	chevronDown: (
		<svg viewBox="0 0 24 24" { ...stroke }>
			<path d="m6 9 6 6 6-6" />
		</svg>
	),
	chevron: (
		<svg viewBox="0 0 24 24" { ...stroke }>
			<path d="m9 6 6 6-6 6" />
		</svg>
	),
	chevronLeft: (
		<svg viewBox="0 0 24 24" { ...stroke }>
			<path d="m15 6-6 6 6 6" />
		</svg>
	),
	// row-action kebab + column drag handle
	moreVertical: (
		<svg viewBox="0 0 24 24" { ...stroke }>
			<circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none" />
			<circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
			<circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
		</svg>
	),
	csv: (
		<svg viewBox="0 0 24 24" { ...stroke }>
			<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
			<path d="M14 3v5h5" />
		</svg>
	),
	import: (
		<svg viewBox="0 0 24 24" { ...stroke }>
			<path d="M12 3v12m0 0 4-4m-4 4-4-4" />
			<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
		</svg>
	),
	arrowRight: (
		<svg viewBox="0 0 24 24" { ...stroke }>
			<path d="M5 12h14m-6-6 6 6-6 6" />
		</svg>
	),
};
/* eslint-enable react/no-unknown-property */

/**
 * Default `renderIcon` — returns the chrome glyph wrapped in `.pmdk-react-icon`,
 * or `null` for an unknown name (domain glyphs come from the consumer).
 *
 * @param {string} name Chrome glyph name.
 * @return {import('react').ReactElement|null} Wrapped icon element.
 */
export function defaultRenderIcon( name ) {
	const glyph = GLYPHS[ name ];
	if ( ! glyph ) {
		return null;
	}
	return (
		<span className="pmdk-react-icon" aria-hidden="true">
			{ glyph }
		</span>
	);
}
