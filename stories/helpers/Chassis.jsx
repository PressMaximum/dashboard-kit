/**
 * Shared story chassis for KIT-P3 primitives.
 *
 * Primitives are scoped under `.pmdk-dashboard` (the DashboardShell root), so
 * every story mounts inside one. Theme stories wrap that root in
 * `.pmdk-theme-app` (opt-in app look) and the dark stories add the
 * same-element `data-pmdk-color-scheme="dark"` switch — exactly the consumer
 * wiring documented in `src/themes/app.css`.
 *
 * Not a story file (no `.stories.` suffix) — Storybook ignores it.
 */

export function Chassis( { theme = false, scheme = '', children } ) {
	const dashboard = (
		<div
			className="pmdk-dashboard"
			style={ {
				padding: 24,
				background: 'var(--pmdk-color-canvas, #fff)',
				color: 'var(--pmdk-color-text)',
				fontSize: 'var(--pmdk-font-size-body)',
				lineHeight: 'var(--pmdk-line-height-body)',
				fontFamily:
					'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
			} }
		>
			{ children }
		</div>
	);
	if ( ! theme ) {
		return dashboard;
	}
	return (
		<div
			className="pmdk-theme-app"
			{ ...( scheme ? { 'data-pmdk-color-scheme': scheme } : {} ) }
		>
			{ dashboard }
		</div>
	);
}
