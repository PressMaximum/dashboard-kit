/**
 * PageWrapper — Tier-1 generic flex-chain container.
 *
 * Sits between the dashboard's main column and a page's content tree.
 * P2 will harden the flex chain so `<EntityListPage>` + DataViews get
 * a stable `containerWidth` via `useResizeObserver` — for now this is
 * a thin div that gives the page a flex column without imposing any
 * visible chrome.
 *
 * Slot shape (SPEC §5.3): `<PageWrapper>{ children }</PageWrapper>`.
 */

import './editor.css';

export default function PageWrapper( { children, className } ) {
	const classes =
		'pmdk-page-wrapper' + ( className ? ' ' + className : '' );
	return <div className={ classes }>{ children }</div>;
}
