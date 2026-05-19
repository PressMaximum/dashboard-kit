/**
 * ReleaseBlock — one release card. SPEC §5.3b + §5.10b. Tier-2 page
 * component.
 *
 * Header: `v{version}` + optional `Current` pill + date. Body: list
 * of items; each item shows its CategoryBadge + text. SPEC §16.2
 * locked class: `.pmdk-release-block`.
 *
 * Release shape:
 *
 *   {
 *     version: string,                  // '1.2.0'
 *     date?: string,                    // already-formatted by consumer
 *     current?: boolean,                // shows the Current pill
 *     items: { category?: string, text: string }[],
 *   }
 *
 * Labels (English fallbacks shipped):
 *   currentBadge   'Current'
 *
 * Consumer passes `categoryLabels` (and optional `toneOverrides`)
 * through to each CategoryBadge — see the badge's docstring.
 */

import CategoryBadge from './CategoryBadge.jsx';

import { createI18nBag } from '../core/createI18nBag.js';

import './ReleaseBlock.css';

const DEFAULT_LABELS = {
	currentBadge: 'Current',
};

export default function ReleaseBlock( {
	release,
	labels: callerLabels,
	categoryLabels,
	categoryToneOverrides,
} ) {
	if ( ! release ) {
		return null;
	}
	const labels = createI18nBag( DEFAULT_LABELS, callerLabels );
	const items = Array.isArray( release.items ) ? release.items : [];

	return (
		<article className="pmdk-release-block">
			<header className="pmdk-release-block__head">
				<h3 className="pmdk-release-block__version">
					{ 'v' + release.version }
					{ release.current && (
						<span className="pmdk-release-block__current">
							{ labels.currentBadge }
						</span>
					) }
				</h3>
				{ release.date && (
					<p className="pmdk-release-block__date">
						{ release.date }
					</p>
				) }
			</header>
			{ items.length > 0 && (
				<ul className="pmdk-release-block__items">
					{ items.map( ( item, idx ) => (
						<li key={ idx } className="pmdk-release-block__item">
							<CategoryBadge
								category={ item.category }
								labels={ categoryLabels }
								toneOverrides={ categoryToneOverrides }
							/>
							<span className="pmdk-release-block__item-text">
								{ item.text }
							</span>
						</li>
					) ) }
				</ul>
			) }
		</article>
	);
}
