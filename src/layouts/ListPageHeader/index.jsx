/**
 * ListPageHeader — Tier-1 layout primitive (SPEC §5.13). Renders the
 * page title with an inline action slot beside it (the WP-native
 * "Posts [ Add New ]" pattern) plus an optional description on the row
 * below, full-width.
 *
 * Slot shape:
 *   - `title` (string | node) — required, already-translated
 *   - `actions` (node) — inline beside the title (typically `[ Add X ]`;
 *                        EntityListPage passes a `.page-title-action` anchor)
 *   - `description` (node) — optional sub-title; sits on the row below the title
 *
 * Zero translatable strings — visible text arrives via props.
 */

import './editor.css';

export default function ListPageHeader( { title, description, actions } ) {
	return (
		<header className="pmdk-list-page-header">
			<div className="pmdk-list-page-header__bar">
				<h2 className="pmdk-list-page-header__title">{ title }</h2>
				{ actions && (
					<div className="pmdk-list-page-header__actions">
						{ actions }
					</div>
				) }
			</div>
			{ description && (
				<p className="pmdk-list-page-header__description">
					{ description }
				</p>
			) }
		</header>
	);
}
