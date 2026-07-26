/**
 * SettingsShell — Tier-2 settings layout (K-043).
 *
 * The founder-look Settings screen: a grouped/collapsible rail flush
 * against the content edge, a padded reading column beside it, and a
 * sticky SaveBar the consumer composes in unchanged. Promoted from
 * Aponto's `.ap-settings-layout` (routes/SettingsRoute.jsx +
 * styles/admin-extra.css §"Settings route") onto the kit token API.
 *
 * The kit owns the CHASSIS — grid, rail behaviour, region semantics,
 * collapse — and nothing else. Section content, the schema form, the save
 * bar, the page header and every string are the product's, composed as
 * children:
 *
 *   <SettingsShell tree={ TREE } activeParent={ p } activeChild={ c }
 *                  onSelect={ go } regionLabel={ section.label }
 *                  header={ <ListPageHeader … /> }>
 *     <SchemaForm … />
 *     <SaveBar … />
 *   </SettingsShell>
 *
 * `<SaveBar>` and `<SchemaForm>` are composed AS IS — the sticky DS chrome
 * already ships in `primitives/save-bar.css`, so this shell adds no save
 * dialect of its own. (The `rows: 'horizontal'` SchemaForm variant the
 * K-043 row sketched is deliberately NOT here — see SPEC §5.14.)
 *
 * Height: the shell has no definite height inside a normal page flow, so
 * `min-height: 100%` would collapse to `auto` and strand the rail divider
 * above the fold on a short section. It measures against the viewport
 * minus the host chrome instead — `--pmdk-settings-chrome`, default 96px
 * (WP admin bar 32 + a 64px dashboard header). Set `chromeOffset` when the
 * host chrome differs (e.g. a fullscreen mode that drops the admin bar).
 *
 * Collapse: `.pmdk-settings-shell` establishes the query container and the
 * GRID is its child, so the ≤820px rule has something to match — an
 * element cannot answer its own container query (K-033: the module grid's
 * queries never matched because no ancestor declared `container-type`).
 */

import { createI18nBag } from '../core/createI18nBag';
import SettingsNav from './SettingsNav.jsx';

/**
 * Tier-2 defaults (SPEC §5.13 / §5.10b). Both are ARIA-only; every visible
 * string in this shell comes from the consumer's tree or its children.
 * They ship with English fallbacks so the landmark and the region are
 * NAMED out of the box — an unnamed `role="region"` is worse than no
 * region at all.
 */
const DEFAULT_LABELS = {
	navAriaLabel: 'Settings sections',
	regionLabel: 'Settings',
};

export default function SettingsShell( {
	// Rail
	tree,
	activeParent,
	activeChild,
	onSelect,
	// Naming — the ergonomic path; `labels` is the i18n fallback bag.
	navAriaLabel,
	regionLabel,
	labels,
	// Content
	header,
	children,
	// Geometry knobs, all published as CSS custom properties so a consumer
	// can also set them from a stylesheet.
	chromeOffset,
	railWidth,
	contentMaxWidth,
	idPrefix,
	className,
} ) {
	const L = createI18nBag( DEFAULT_LABELS, labels );

	const style = {};
	if ( chromeOffset ) {
		style[ '--pmdk-settings-chrome' ] = chromeOffset;
	}
	if ( railWidth ) {
		style[ '--pmdk-settings-rail-width' ] = railWidth;
	}
	if ( contentMaxWidth ) {
		style[ '--pmdk-settings-content-max' ] = contentMaxWidth;
	}

	const classes =
		'pmdk-settings-shell' + ( className ? ' ' + className : '' );

	return (
		<div className={ classes } style={ style }>
			<div className="pmdk-settings-shell__grid">
				<SettingsNav
					tree={ tree }
					activeParent={ activeParent }
					activeChild={ activeChild }
					onSelect={ onSelect }
					ariaLabel={ navAriaLabel || L.navAriaLabel }
					idPrefix={ idPrefix }
				/>
				<div
					className="pmdk-settings-shell__content"
					role="region"
					aria-label={ regionLabel || L.regionLabel }
				>
					{ header }
					{ children }
				</div>
			</div>
		</div>
	);
}
