/**
 * K-018 — CONSUMER EXAMPLE: a Modules page, the PressListing/Aponto way.
 *
 * Everything OUTSIDE <PMDKModuleCard> here is product-side by design (K-018 +
 * SPEC §5.12 recipe): the category tabs (`createTablist` + `.pmdk-section-tabs`
 * chrome), the counts strip, the grid (`.pmdk-module-grid`), module DATA
 * (names, categories, tiers, phases, descriptions), toggle handlers, deep
 * links. The kit contributes the card behavior + chrome + slots. If this
 * story renders and behaves, the K-018 boundary holds.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import '../../src/primitives/style.css';
import { PMDKModuleCard } from '../../src/module-card/index.mjs';
import { createTablist } from '../../src/primitives/index.mjs';
import { Chassis } from '../helpers/Chassis.jsx';
import { defaultRenderIcon } from '../../src/table/index.mjs';

/* Product-side state/label helpers (keep the JSX ternary-free). */
function moduleState( module, enabled ) {
	if ( module.planned ) {
		return 'planned';
	}
	return enabled[ module.id ] ? 'enabled' : 'disabled';
}
function moduleActionLabel( module, enabled ) {
	if ( module.planned ) {
		return 'View roadmap';
	}
	if ( module.locked && ! enabled[ module.id ] ) {
		return 'Upgrade';
	}
	return 'Configure';
}

export default {
	title: 'ModuleCard/ModulesPage',
	parameters: { layout: 'padded' },
};

/* Product-side module registry (data + copy). */
const MODULES = [
	{
		id: 'notifications',
		category: 'Communication',
		kind: 'Module',
		title: 'Notifications',
		description: 'Email confirmations and reminders.',
		tier: { label: 'Free' },
		defaultEnabled: true,
	},
	{
		id: 'reports',
		category: 'Insights',
		kind: 'Module',
		title: 'Advanced reports',
		description: 'Cohorts, exports and scheduled summaries.',
		tier: { label: 'Premium', isPremium: true },
		locked: true,
	},
	{
		id: 'stripe',
		category: 'Payments',
		kind: 'Integration',
		title: 'Stripe',
		description: 'Charge deposits at booking time.',
		tier: { label: 'Premium', isPremium: true },
		integration: { connected: true, line: 'Connected as ops@example.com' },
		defaultEnabled: true,
	},
	{
		id: 'gcal',
		category: 'Calendars',
		kind: 'Integration',
		title: 'Google Calendar',
		description: 'Two-way sync with staff calendars.',
		tier: { label: 'Free' },
		integration: { connected: false, line: 'Not connected' },
	},
	{
		id: 'sms',
		category: 'Communication',
		kind: 'Module',
		title: 'SMS reminders',
		description: 'Planned — text reminders before each visit.',
		tier: { label: 'Premium', isPremium: true },
		phase: 'P4',
		planned: true,
	},
];

const CATEGORIES = [ 'All', 'Communication', 'Insights', 'Payments', 'Calendars' ];

function ModulesPage() {
	const [ enabled, setEnabled ] = useState( () => {
		const initial = {};
		MODULES.forEach( ( module ) => {
			initial[ module.id ] = Boolean( module.defaultEnabled );
		} );
		return initial;
	} );
	const [ category, setCategory ] = useState( 'All' );
	const tabsRef = useRef( null );

	useEffect( () => {
		const rootEl = tabsRef.current;
		if ( ! rootEl ) {
			return undefined;
		}
		const tablist = createTablist( rootEl, {
			onChange: ( tab ) => setCategory( tab.dataset.category ),
		} );
		return () => tablist.destroy();
	}, [] );

	const visible = useMemo(
		() =>
			MODULES.filter(
				( module ) =>
					category === 'All' || module.category === category,
			),
		[ category ],
	);
	const enabledCount = MODULES.filter(
		( module ) => enabled[ module.id ],
	).length;

	return (
		<div>
			{ /* product-side counts strip */ }
			<div className="pmdk-mini-stats" style={ { maxWidth: 460 } }>
				<div>
					<strong>{ MODULES.length }</strong>
					<span>Available</span>
				</div>
				<div>
					<strong>{ enabledCount }</strong>
					<span>Enabled</span>
				</div>
				<div>
					<strong>
						{ MODULES.filter( ( m ) => m.planned ).length }
					</strong>
					<span>Planned</span>
				</div>
			</div>
			{ /* product-side category tabs on the kit tab chrome */ }
			<div className="pmdk-section-tabs" ref={ tabsRef }>
				{ CATEGORIES.map( ( name, index ) => (
					<button
						key={ name }
						role="tab"
						type="button"
						data-category={ name }
						aria-selected={ index === 0 ? 'true' : 'false' }
					>
						{ name }
					</button>
				) ) }
			</div>
			{ /* the kit card, composed per module */ }
			<div className="pmdk-module-grid">
				{ visible.map( ( module ) => (
					<PMDKModuleCard
						key={ module.id }
						icon={ defaultRenderIcon( 'sliders' ) }
						meta={ `${ module.category } · ${ module.kind }` }
						title={ module.title }
						description={ module.description }
						tier={ module.tier }
						badges={
							module.phase ? (
								<span className="pmdk-module-phase">
									{ module.phase }
								</span>
							) : null
						}
						state={ moduleState( module, enabled ) }
						plannedLabel="Planned"
						toggleDisabled={
							module.locked && ! enabled[ module.id ]
						}
						integrationState={ module.integration?.line }
						connected={ module.integration?.connected }
						onToggle={ ( next ) =>
							setEnabled( ( current ) => ( {
								...current,
								[ module.id ]: next,
							} ) )
						}
						action={
							<button
								className="pmdk-button text"
								type="button"
							>
								{ moduleActionLabel( module, enabled ) }
							</button>
						}
					/>
				) ) }
			</div>
		</div>
	);
}

export const PressListingLikeModules = {
	render: () => (
		<Chassis>
			<ModulesPage />
		</Chassis>
	),
};
