/**
 * EditorPageHeader — Tier-1 layout primitive (SPEC §5.13). Back link +
 * entity title + save/status cluster for pure-meta CPT editors.
 *
 * Slot shape:
 *   - `backHref` — optional anchor target for the breadcrumb
 *   - `backLabel` — visible text for the back link (already-translated;
 *                    English fallback `Back` when omitted, but consumers
 *                    SHOULD pass a translated string in production)
 *   - `title` — entity name (Pro may wire inline-edit)
 *   - `status` (node) — saved-state badge ("Saved" / "Unsaved")
 *   - `actions` (node) — save / duplicate / delete cluster
 *
 * `backLabel` is the kit's single allowable English fallback in this
 * Tier-1 component — accessibility outweighs strict tier purity (an
 * untranslated arrow without a label leaks straight to a screen reader).
 * SPEC §5.13 edge-case clause covers this pattern.
 */

import './editor.css';

export default function EditorPageHeader( {
	backHref,
	backLabel = 'Back',
	title,
	status,
	actions,
} ) {
	return (
		<header className="pmdk-editor-page-header">
			<div className="pmdk-editor-page-header__left">
				{ backHref && (
					<a
						className="pmdk-editor-page-header__back"
						href={ backHref }
					>
						{ '← ' }
						{ backLabel }
					</a>
				) }
				<h2 className="pmdk-editor-page-header__title">
					{ title }
				</h2>
				{ status && (
					<span className="pmdk-editor-page-header__status">
						{ status }
					</span>
				) }
			</div>
			{ actions && (
				<div className="pmdk-editor-page-header__actions">
					{ actions }
				</div>
			) }
		</header>
	);
}
