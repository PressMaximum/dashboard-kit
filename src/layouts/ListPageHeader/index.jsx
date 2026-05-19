/**
 * ListPageHeader — Tier-1 layout primitive (SPEC §5.13). Renders the
 * page title + optional description + right-aligned action slot for
 * CPT list views.
 *
 * Slot shape:
 *   - `title` (string | node) — required, already-translated
 *   - `description` (node) — optional sub-title
 *   - `actions` (node) — right-aligned buttons (typically `[ + Add X ]`)
 *
 * Zero translatable strings — visible text arrives via props.
 */

import './editor.css';

export default function ListPageHeader( { title, description, actions } ) {
	return (
		<header className="pmdk-list-page-header">
			<div className="pmdk-list-page-header__text">
				<h2 className="pmdk-list-page-header__title">{ title }</h2>
				{ description && (
					<p className="pmdk-list-page-header__description">
						{ description }
					</p>
				) }
			</div>
			{ actions && (
				<div className="pmdk-list-page-header__actions">
					{ actions }
				</div>
			) }
		</header>
	);
}
