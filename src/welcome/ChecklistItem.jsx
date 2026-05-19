/**
 * ChecklistItem — single row in the Welcome onboarding checklist.
 * SPEC §5.5 + §5.10b. Tier-2 page component.
 *
 * Status resolution: each item ships an optional `check()` callable
 * that returns `boolean | Promise<boolean>`. The kit runs it on mount;
 * a session-scoped module cache keeps subsequent mounts flash-free
 * (the spike's pattern — stale-while-revalidate). When the consumer's
 * onboarding store flips the manual-completion flag, the consumer
 * threads that into `item.manualCompleted`; the check re-runs.
 *
 * The kit doesn't read the consumer's onboarding store directly —
 * `item.manualCompleted` is the contract. Keeps the kit unaware of
 * which store the consumer registered. Consumer typically wires:
 *
 *   const completedIds = useSelect((s) => s(ONBOARDING_STORE).getCompleted());
 *   const items = baseItems.map((i) => ({
 *       ...i,
 *       manualCompleted: completedIds.includes(i.id),
 *   }));
 *
 * Item shape:
 *
 *   {
 *     id: string,
 *     label: string,                  // already-translated
 *     description?: string,
 *     check?: () => boolean | Promise<boolean>,
 *     manualCompleted?: boolean,      // from consumer's onboarding store
 *     ctaLabel?: string,
 *     ctaHref?: string,               // '#tab' OR external URL
 *     icon?: ComponentType,
 *   }
 *
 * Labels (English fallbacks shipped):
 *
 *   checking  'Checking…'
 *   completed 'Completed'   (sr-only)
 *   pending   'Pending'     (sr-only)
 */

import { useEffect, useState } from '@wordpress/element';
import { Button, Icon, Spinner } from '@wordpress/components';
import { check as checkIcon } from '@wordpress/icons';

import { useNavigate } from '../core/HashRouter';
import { createI18nBag } from '../core/createI18nBag.js';

const DEFAULT_LABELS = {
	checking: 'Checking…',
	completed: 'Completed',
	pending: 'Pending',
};

// Session-scoped cache for auto-detect check results. Survives Welcome
// remounts so subsequent visits render the last-known state instantly
// (no spinner flash). The check still runs in the background and
// updates the cache + visible state when the answer changes —
// stale-while-revalidate.
//
// `undefined` = never checked → first-ever mount shows the spinner;
// every mount after reads a `boolean` directly.
const CHECK_CACHE = new Map();

function isHashHref( href ) {
	return typeof href === 'string' && href.startsWith( '#' );
}

export default function ChecklistItem( { item, labels: callerLabels } ) {
	const labels = createI18nBag( DEFAULT_LABELS, callerLabels );
	const cached = CHECK_CACHE.get( item.id );
	const hasCached = cached !== undefined;

	const [ completed, setCompleted ] = useState(
		hasCached ? cached : false,
	);
	const [ checking, setChecking ] = useState( ! hasCached );

	useEffect( () => {
		let cancelled = false;
		try {
			const result = item.check ? item.check() : false;
			Promise.resolve( result )
				.then( ( value ) => {
					if ( cancelled ) {
						return;
					}
					const boolValue = Boolean( value );
					CHECK_CACHE.set( item.id, boolValue );
					setCompleted( boolValue );
					setChecking( false );
				} )
				.catch( () => {
					if ( cancelled ) {
						return;
					}
					setChecking( false );
				} );
		} catch ( _ ) {
			setChecking( false );
		}
		return () => {
			cancelled = true;
		};
		// `manualCompleted` is the consumer-supplied signal that
		// re-checks (e.g. the user marked the task done in another tab
		// — the consumer's onboarding store flips this flag).
	}, [ item, item.manualCompleted ] );

	const onNavigate = useNavigate();
	const isHash = isHashHref( item.ctaHref );

	const className =
		'pmdk-checklist__item' +
		( completed ? ' is-complete' : '' ) +
		( checking ? ' is-checking' : '' );

	let statusLabel = labels.pending;
	if ( checking ) {
		statusLabel = labels.checking;
	} else if ( completed ) {
		statusLabel = labels.completed;
	}

	let statusIndicator = (
		<span className="pmdk-checklist__bullet" />
	);
	if ( checking ) {
		statusIndicator = <Spinner />;
	} else if ( completed ) {
		statusIndicator = <Icon icon={ checkIcon } />;
	}

	return (
		<li className={ className }>
			<span
				className="pmdk-checklist__status"
				aria-hidden="true"
				role="presentation"
			>
				{ statusIndicator }
			</span>
			<span className="screen-reader-text">{ statusLabel }</span>
			<div className="pmdk-checklist__body">
				<h3 className="pmdk-checklist__label">{ item.label }</h3>
				{ item.description && (
					<p className="pmdk-checklist__description">
						{ item.description }
					</p>
				) }
			</div>
			{ item.ctaHref && item.ctaLabel && (
				<div className="pmdk-checklist__cta">
					<Button
						variant={ completed ? 'tertiary' : 'secondary' }
						href={ item.ctaHref }
						onClick={
							isHash ? onNavigate( item.ctaHref ) : undefined
						}
					>
						{ item.ctaLabel }
					</Button>
				</div>
			) }
		</li>
	);
}
