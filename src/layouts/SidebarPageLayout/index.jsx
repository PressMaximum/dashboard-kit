/**
 * SidebarPageLayout — 2-col page layout (main + aside).
 *
 * Tier-1 layout primitive (SPEC §5.13). Use when a tab page needs
 * supplementary content next to the primary surface — Pro upsell promos,
 * resource links, status panels, related actions. Pairs with a route
 * entry that sets `containerWidth: 'wide'` so the dashboard chrome
 * drops the 1100px narrow reading-column cap and the sidebar has room
 * to breathe.
 *
 * SPEC §16.2 locked classes:
 *   .pmdk-sidebar-page-layout
 *   .pmdk-sidebar-page-layout__main
 *   .pmdk-sidebar-page-layout__sidebar
 *
 * Slot shape:
 *
 *   <SidebarPageLayout
 *     main={ <MainContent /> }
 *     sidebar={ <SidebarContent /> }
 *   />
 *
 * Both slots accept any ReactNode — typically a stack of `<Card>`s for
 * the sidebar and the page's primary composition for main.
 *
 * Collapses to a single column at 960px (token: `--pmdk-sidebar-breakpoint`)
 * so narrow viewports read main first then sidebar below.
 */

import './editor.css';

export default function SidebarPageLayout( { main, sidebar, className } ) {
	const classes =
		'pmdk-sidebar-page-layout' + ( className ? ' ' + className : '' );
	return (
		<div className={ classes }>
			<div className="pmdk-sidebar-page-layout__main">{ main }</div>
			<aside className="pmdk-sidebar-page-layout__sidebar">
				{ sidebar }
			</aside>
		</div>
	);
}
