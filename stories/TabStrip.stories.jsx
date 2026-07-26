import TabStrip from '../src/core/TabStrip.jsx';
import DashboardShell from '../src/core/DashboardShell.jsx';

export default {
	title: 'Core/TabStrip',
	component: TabStrip,
	parameters: {
		layout: 'padded',
	},
	tags: [ 'autodocs' ],
};

const sampleTabs = [
	{ id: 'welcome', label: 'Dashboard', hash: '#welcome' },
	{ id: 'settings', label: 'Settings', hash: '#settings' },
	{ id: 'templates', label: 'Starter Templates', hash: '#templates' },
	{ id: 'free-vs-pro', label: 'Free vs Pro', hash: '#free-vs-pro' },
];

export const Default = {
	args: {
		items: sampleTabs,
		activeId: 'welcome',
		ariaLabel: 'Dashboard sections',
	},
};

export const ActiveMidStrip = {
	args: {
		items: sampleTabs,
		activeId: 'settings',
		ariaLabel: 'Dashboard sections',
	},
};

export const SingleTab = {
	args: {
		items: [ { id: 'welcome', label: 'Dashboard', hash: '#welcome' } ],
		activeId: 'welcome',
		ariaLabel: 'Dashboard sections',
	},
};

/* ---------------------------------------------------------------------
 * K-042 — split nav + dropdown tabs.
 *
 * Both stories mount the real `<DashboardShell>` rather than a bare
 * `<TabStrip>`: the end-aligned run needs the shell's `data-utility-tabs`
 * marker (the header grid template swap lives there), so rendering the
 * strip alone would not show what a consumer gets.
 * ------------------------------------------------------------------- */

// `brand.icon` is an HTML string — DashboardShell injects it via
// dangerouslySetInnerHTML (consumer-controlled boot data).
const BRAND = {
	name: 'Aponto',
	icon: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 3 3.5 20h3.4l1.7-3.6h6.8l1.7 3.6h3.4L12 3Zm0 6.7 2.1 4.5H9.9L12 9.7Z" fill="currentColor"/></svg>',
};

// The kit inherits the host font (wp-admin ships the system stack); the
// plain Storybook iframe would otherwise fall back to the browser serif.
const HOST_FONT = {
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

function RoutePanel() {
	return (
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
			Route content plane.
		</div>
	);
}

/* Primary destinations left, utility surfaces right — Aponto's header IA,
   expressed entirely through `TabDefinition.align`. */
const SPLIT_TABS = [
	{ id: 'welcome', label: 'Dashboard', hash: '#welcome' },
	{ id: 'bookings', label: 'Bookings', hash: '#bookings' },
	{ id: 'customers', label: 'Customers', hash: '#customers' },
	{ id: 'modules', label: 'Modules', hash: '#modules', align: 'end' },
	{ id: 'settings', label: 'Settings', hash: '#settings', align: 'end' },
];

/* Same header, with the utility Settings tab disclosing its sections.
   The trigger keeps its own href, so it stays a real link to the default
   section AND opens the menu on hover / focus. */
const DROPDOWN_TABS = [
	{ id: 'welcome', label: 'Dashboard', hash: '#welcome' },
	{ id: 'bookings', label: 'Bookings', hash: '#bookings' },
	{
		id: 'offerings',
		label: 'Offerings',
		// No `hash` ⇒ the trigger is a click-toggle button, and the menu
		// is the only way into these routes.
		hash: '',
		children: [
			{
				id: 'services',
				label: 'Services',
				description: 'Bookable services & categories',
				href: '#services',
			},
			{
				id: 'events',
				label: 'Events',
				description: 'Fixed sessions & attendance',
				href: '#events',
			},
		],
	},
	{ id: 'modules', label: 'Modules', hash: '#modules', align: 'end' },
	{
		id: 'settings',
		label: 'Settings',
		hash: '#settings/general',
		align: 'end',
		children: [
			{
				id: 'settings-general',
				label: 'General',
				description: 'Business · Localization',
				href: '#settings/general',
			},
			{
				id: 'settings-booking',
				label: 'Booking',
				description: 'Policy · Form presentation',
				href: '#settings/booking',
			},
			{
				id: 'settings-advanced',
				label: 'Advanced',
				description: 'Diagnostics, logs and uninstall',
				href: '#settings/advanced',
			},
		],
	},
];

const ROUTES = {
	'#welcome': { component: RoutePanel },
	'#bookings': { component: RoutePanel },
	'#customers': { component: RoutePanel },
	'#services': { component: RoutePanel },
	'#events': { component: RoutePanel },
	'#modules': { component: RoutePanel },
	'#settings': { component: RoutePanel },
	'#settings/general': { component: RoutePanel },
	'#settings/booking': { component: RoutePanel },
	'#settings/advanced': { component: RoutePanel },
};

export const SplitNav = {
	name: 'Split nav — primary + utility run',
	parameters: { layout: 'fullscreen' },
	render: () => (
		<div style={ HOST_FONT }>
			<DashboardShell
				brand={ BRAND }
				tabs={ SPLIT_TABS }
				tabsAriaLabel="Dashboard sections"
				routes={ ROUTES }
				initialRoute="#welcome"
				containerWidth="wide"
				versionLabel="v1.4.2"
				versionHref="#changelog"
			/>
		</div>
	),
};

export const UtilityDropdown = {
	name: 'Dropdown tabs — link trigger + button trigger',
	parameters: { layout: 'fullscreen' },
	render: () => (
		<div style={ HOST_FONT }>
			<DashboardShell
				brand={ BRAND }
				tabs={ DROPDOWN_TABS }
				tabsAriaLabel="Dashboard sections"
				routes={ ROUTES }
				initialRoute="#welcome"
				containerWidth="wide"
				versionLabel="v1.4.2"
				versionHref="#changelog"
			/>
		</div>
	),
};
