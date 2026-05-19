/**
 * EditorViewLayout — Tier-1 3-col shell for pure-meta CPT editors.
 * Composition: SubNav (left) + Main (center) + Rail (right).
 *
 * Slot shape:
 *   - `subNav` — 240px nav column (rule groups / panel switcher)
 *   - `main`   — 1fr center column (form body / repeater)
 *   - `rail`   — 280px right column (actions / help / status)
 *
 * Responsive collapse: at narrow widths the right rail moves below
 * `main`; subNav stays visible (typical config-editor UX).
 *
 * Zero translatable strings — all visible text arrives inside the
 * slot children.
 */

import './editor.css';

export default function EditorViewLayout( { subNav, main, rail } ) {
	return (
		<div className="pmdk-editor-view-layout">
			{ subNav && (
				<aside className="pmdk-editor-view-layout__subnav">
					{ subNav }
				</aside>
			) }
			<section className="pmdk-editor-view-layout__main">
				{ main }
			</section>
			{ rail && (
				<aside className="pmdk-editor-view-layout__rail">
					{ rail }
				</aside>
			) }
		</div>
	);
}
