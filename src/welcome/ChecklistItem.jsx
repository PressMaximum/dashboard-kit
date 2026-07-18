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
	// Destructure so the effect's dep array reads PRIMITIVE / FUNCTION
	// references instead of the surrounding `item` object — the parent
	// (Welcome page) typically rebuilds the items array on every render
	// to inject `manualCompleted`, so depending on `item` directly would
	// re-run the check on every parent render. With these three deps,
	// the check runs only when (a) the user navigated to a different
	// task, (b) the consumer's store flipped manualCompleted, or
	// (c) the consumer provided a new check function (rare).
	const { id, check, manualCompleted } = item;
	const cached = CHECK_CACHE.get( id );
	const hasCached = cached !== undefined;

	// Auto-detect result only — `manualCompleted` is OR-ed in below at
	// render time rather than folded into this state/cache, so flipping
	// the consumer's store flag reflects instantly in both directions and
	// a manual completion can never poison the cached `check()` answer.
	const [ autoCompleted, setAutoCompleted ] = useState(
		hasCached ? cached : false,
	);
	const [ checking, setChecking ] = useState( ! hasCached );

	// The item is complete when the consumer's onboarding store says so OR
	// the auto-detect check passes. Earlier revisions only re-RAN the check
	// when `manualCompleted` flipped but never used the flag in the
	// completion value, so store-driven completions (the documented
	// `manualCompleted` contract — see the docstring wiring example) never
	// rendered as complete unless their `check()` also happened to pass.
	const completed = Boolean( manualCompleted ) || autoCompleted;

	useEffect( () => {
		let cancelled = false;
		try {
			const result = check ? check() : false;
			Promise.resolve( result )
				.then( ( value ) => {
					if ( cancelled ) {
						return;
					}
					const boolValue = Boolean( value );
					CHECK_CACHE.set( id, boolValue );
					setAutoCompleted( boolValue );
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
	}, [ id, check, manualCompleted ] );

	const onNavigate = useNavigate();
	const isHash = isHashHref( item.ctaHref );

	const className =
		'pmdk-checklist__item' +
		( completed ? ' is-complete' : '' ) +
		( checking ? ' is-checking' : '' );

	// Completed wins over checking: a manually-completed (or cached-
	// complete) item reads as done even while a background re-check is in
	// flight — the spinner is only meaningful when the answer is unknown.
	let statusLabel = labels.pending;
	if ( completed ) {
		statusLabel = labels.completed;
	} else if ( checking ) {
		statusLabel = labels.checking;
	}

	let statusIndicator = (
		<span className="pmdk-checklist__bullet" />
	);
	if ( completed ) {
		statusIndicator = <Icon icon={ checkIcon } />;
	} else if ( checking ) {
		statusIndicator = <Spinner />;
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
