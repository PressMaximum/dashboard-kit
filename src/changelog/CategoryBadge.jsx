/**
 * CategoryBadge — small uppercase pill rendered next to each changelog
 * item. SPEC §5.3b. Tier-2 page component.
 *
 * Maps a lowercase `category` string (typically from a PHP changelog
 * parser) to:
 *   - a display label via the kit's English fallback table + consumer's
 *     `labels` override
 *   - a tone modifier class via the kit's category→tone map + optional
 *     `toneOverrides`
 *
 * The CSS file (`ReleaseBlock.css`) owns the color palette per tone.
 * Tones: `new` / `improved` / `fixed` / `updated` / `removed` /
 * `security` / `deprecated` / `neutral`.
 *
 * Unknown categories render with the raw category text (uppercased)
 * and the `neutral` tone — drift-tolerant display.
 */

const DEFAULT_LABELS = {
	added: 'New',
	new: 'New',
	changed: 'Improved',
	improved: 'Improved',
	enhancement: 'Improved',
	enhanced: 'Improved',
	fixed: 'Fixed',
	fix: 'Fixed',
	updated: 'Updated',
	update: 'Updated',
	removed: 'Removed',
	deprecated: 'Deprecated',
	security: 'Security',
};

const BASE_TONE = {
	added: 'new',
	new: 'new',
	changed: 'improved',
	improved: 'improved',
	enhancement: 'improved',
	enhanced: 'improved',
	fixed: 'fixed',
	fix: 'fixed',
	updated: 'updated',
	update: 'updated',
	removed: 'removed',
	deprecated: 'deprecated',
	security: 'security',
};

export default function CategoryBadge( {
	category,
	labels: callerLabels,
	toneOverrides,
} ) {
	if ( ! category ) {
		return null;
	}
	const labels = { ...DEFAULT_LABELS, ...( callerLabels || {} ) };
	const tones = { ...BASE_TONE, ...( toneOverrides || {} ) };
	const key = String( category ).toLowerCase();
	const tone = tones[ key ] || 'neutral';
	const label = labels[ key ] || key.toUpperCase();
	return (
		<span
			className={
				'pmdk-category-badge pmdk-category-badge--' + tone
			}
		>
			{ label }
		</span>
	);
}
