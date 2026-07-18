/**
 * KIT-P4 — the CORE components wearing the opt-in app theme.
 *
 * These stories are the founder-gate evidence set for the theme-app
 * variant: DashboardShell chassis (header/brand/tabs/version/help),
 * ListPageHeader, EditorPageHeader, SubNav, SchemaForm and SaveBar under
 * `.pmdk-theme-app` (light + same-element dark preset), next to one
 * unthemed shell as the WP-native default reference.
 *
 * Wiring matches the consumer docs (src/themes/app.css header): the
 * theme class wraps the dashboard root so the accent seed declared on
 * `.pmdk-dashboard` stays inside the themed subtree.
 */

import DashboardShell from '../src/core/DashboardShell.jsx';
import ListPageHeader from '../src/layouts/ListPageHeader/index.jsx';
import EditorPageHeader from '../src/layouts/EditorPageHeader/index.jsx';
import SubNav from '../src/layouts/SubNav/index.jsx';
import SaveBar from '../src/settings/SaveBar.jsx';
import '../src/themes/app.css';

export default {
	title: 'Core/ThemeAppCore',
	parameters: { layout: 'fullscreen' },
};

/* ------------------------------------------------------------------ */

// `brand.icon` is an HTML string (DashboardShell injects it via
// dangerouslySetInnerHTML — consumer-controlled boot data).
const BRAND = {
	name: 'Aponto',
	// Mono glyph on currentColor so the same mark reads in light AND the
	// theme's dark preset (which lifts the brand icon to the text seed).
	icon: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 3 3.5 20h3.4l1.7-3.6h6.8l1.7 3.6h3.4L12 3Zm0 6.7 2.1 4.5H9.9L12 9.7Z" fill="currentColor"/></svg>',
};

// The kit inherits the host's font (wp-admin ships the system stack);
// the plain Storybook iframe would fall back to the browser serif and
// misrepresent both looks, so every story pins the wp-admin stack.
const HOST_FONT = {
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

const TABS = [
	{ id: 'welcome', label: 'Dashboard', hash: '#welcome' },
	{ id: 'bookings', label: 'Bookings', hash: '#bookings' },
	{ id: 'customers', label: 'Customers', hash: '#customers' },
	{ id: 'settings', label: 'Settings', hash: '#settings' },
];

const HELP_ITEMS = [
	{ id: 'docs', label: 'Documentation', href: 'https://example.com/docs' },
	{ id: 'support', label: 'Contact support', href: 'https://example.com' },
];

function WelcomePanel() {
	return (
		<div>
			<ListPageHeader
				title="Bookings"
				description="Every appointment across services, staff and locations."
				actions={
					<a className="page-title-action" href="#new">
						New booking
					</a>
				}
			/>
			<div
				style={ {
					border: '1px solid var(--pmdk-color-border)',
					borderRadius: 'var(--pmdk-radius-card)',
					background: 'var(--pmdk-color-surface)',
					padding: 24,
					color: 'var(--pmdk-color-text-muted)',
					fontSize: 'var(--pmdk-font-size-meta)',
				} }
			>
				Route content plane — operational surfaces render here.
			</div>
		</div>
	);
}

const ROUTES = {
	'#welcome': { component: WelcomePanel },
	'#bookings': { component: WelcomePanel },
	'#customers': { component: WelcomePanel },
	'#settings': { component: WelcomePanel },
};

function Shell() {
	return (
		<DashboardShell
			brand={ BRAND }
			tabs={ TABS }
			tabsAriaLabel="Dashboard sections"
			routes={ ROUTES }
			initialRoute="#welcome"
			containerWidth="wide"
			versionLabel="v1.4.2"
			versionHref="#changelog"
			helpItems={ HELP_ITEMS }
		/>
	);
}

export const ShellDefault = {
	name: 'Shell — WP-native default (reference)',
	render: () => (
		<div style={ HOST_FONT }>
			<Shell />
		</div>
	),
};

export const ShellThemeApp = {
	name: 'Shell — theme-app',
	render: () => (
		<div className="pmdk-theme-app" style={ HOST_FONT }>
			<Shell />
		</div>
	),
};

export const ShellThemeAppDark = {
	name: 'Shell — theme-app dark',
	render: () => (
		<div
			className="pmdk-theme-app"
			data-pmdk-color-scheme="dark"
			style={ HOST_FONT }
		>
			<Shell />
		</div>
	),
};

/* ------------------------------------------------------------------ */

const PANELS = [
	{ id: 'general', label: 'General', hash: '#settings/general' },
	{ id: 'booking', label: 'Booking rules', hash: '#settings/booking' },
	{ id: 'payments', label: 'Payments', hash: '#settings/payments' },
	{ id: 'notifications', label: 'Notifications', hash: '#settings/notifications' },
];

function SettingsComposition() {
	return (
		<div
			className="pmdk-dashboard"
			style={ {
				minHeight: 480,
				padding: 28,
				background: 'var(--pmdk-dashboard-bg, #ececec)',
			} }
		>
			<div
				style={ {
					display: 'grid',
					gridTemplateColumns: '208px minmax(0, 1fr)',
					gap: 28,
					alignItems: 'start',
				} }
			>
				<SubNav
					items={ PANELS }
					activeId="booking"
					ariaLabel="Settings panels"
				/>
				<div>
					<div className="pmdk-schema-form">
						<div className="components-base-control">
							<label
								className="components-base-control__label"
								htmlFor="ta-lead"
							>
								Minimum lead time
							</label>
							<input
								id="ta-lead"
								type="text"
								defaultValue="4 hours"
								style={ {
									display: 'block',
									marginTop: 4,
									padding: '8px 12px',
									border: '1px solid var(--pmdk-control-border-default, #8c8f94)',
									borderRadius: 'var(--pmdk-radius-control, 4px)',
									background: 'var(--pmdk-color-surface, #fff)',
									color: 'var(--pmdk-color-text)',
									font: 'inherit',
									fontSize: 'var(--pmdk-font-size-control)',
								} }
							/>
							<p className="components-base-control__help">
								Bookings must be placed at least this far in
								advance.
							</p>
						</div>
					</div>
					<div style={ { marginTop: 40 } }>
						<SaveBar
							isDirty
							isSaving={ false }
							onSave={ () => {} }
							onReset={ () => {} }
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

export const SettingsThemeApp = {
	name: 'Settings (SubNav + SchemaForm + SaveBar) — theme-app',
	render: () => (
		<div className="pmdk-theme-app" style={ HOST_FONT }>
			<SettingsComposition />
		</div>
	),
};

export const SettingsThemeAppDark = {
	name: 'Settings — theme-app dark',
	render: () => (
		<div
			className="pmdk-theme-app"
			data-pmdk-color-scheme="dark"
			style={ HOST_FONT }
		>
			<SettingsComposition />
		</div>
	),
};

/* ------------------------------------------------------------------ */

function EditorHeaderComposition() {
	return (
		<div
			className="pmdk-dashboard"
			style={ {
				padding: 28,
				background: 'var(--pmdk-dashboard-bg, #ececec)',
			} }
		>
			<EditorPageHeader
				title="Deep-tissue massage"
				backHref="#services"
				backLabel="Services"
				status="Draft"
				actions={
					<a className="page-title-action" href="#save">
						Save service
					</a>
				}
			/>
		</div>
	);
}

export const EditorHeaderThemeApp = {
	name: 'EditorPageHeader — theme-app',
	render: () => (
		<div className="pmdk-theme-app" style={ HOST_FONT }>
			<EditorHeaderComposition />
		</div>
	),
};

export const EditorHeaderThemeAppDark = {
	name: 'EditorPageHeader — theme-app dark',
	render: () => (
		<div
			className="pmdk-theme-app"
			data-pmdk-color-scheme="dark"
			style={ HOST_FONT }
		>
			<EditorHeaderComposition />
		</div>
	),
};
