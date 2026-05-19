/**
 * CompareTable — Free vs Pro matrix display component. SPEC §5.3b +
 * §5.13 Tier-2.
 *
 * CSS-grid (not `<table>`) so the dashboard chassis doesn't inherit
 * wp-admin's table baseline styles. Columns: feature label (2fr) +
 * Free / Pro check cells (1fr each).
 *
 * Cell dispatch on shape:
 *
 *   true            → green-circle check badge
 *   false / null    → gray-circle em-dash badge
 *   string          → literal text
 *   { value, muted } → muted-variant text
 *
 * SPEC §16.2 locked classes: `.pmdk-compare`, `.pmdk-compare__row`,
 * `.pmdk-compare__check-yes`, `.pmdk-compare__check-no`.
 *
 * Optional `footer` renders an in-card CTA banner so the upgrade prompt
 * sits attached to the matrix it summarizes.
 *
 * Labels (English fallbacks shipped):
 *   headFeature  'Feature'
 *   headFree     'Free'                (SPEC §5.10b: headColumnFree)
 *   headPro      'Pro'                 (SPEC §5.10b: headColumnPro)
 *   cellYes      'Included'            (sr-only)
 *   cellNo       'Not included'        (sr-only)
 */

import { Button, Icon } from '@wordpress/components';
import { check as checkIcon } from '@wordpress/icons';

import { createI18nBag } from '../core/createI18nBag.js';

import './CompareTable.css';

const DEFAULT_LABELS = {
	headFeature: 'Feature',
	headFree: 'Free',
	headPro: 'Pro',
	cellYes: 'Included',
	cellNo: 'Not included',
};

function Cell( { value, labels } ) {
	if ( value === true ) {
		return (
			<span
				className="pmdk-compare__check-yes"
				aria-label={ labels.cellYes }
			>
				<Icon icon={ checkIcon } size={ 16 } />
			</span>
		);
	}
	if ( value === false || value === null || value === undefined ) {
		return (
			<span
				className="pmdk-compare__check-no"
				aria-label={ labels.cellNo }
			>
				−
			</span>
		);
	}
	if ( typeof value === 'string' ) {
		return <span className="pmdk-compare__text">{ value }</span>;
	}
	if ( value && typeof value === 'object' && 'value' in value ) {
		const className =
			'pmdk-compare__text' + ( value.muted ? ' is-muted' : '' );
		return <span className={ className }>{ value.value }</span>;
	}
	return null;
}

export default function CompareTable( {
	sections,
	footer,
	labels: callerLabels,
} ) {
	if ( ! Array.isArray( sections ) || sections.length === 0 ) {
		return null;
	}
	const labels = createI18nBag( DEFAULT_LABELS, callerLabels );

	return (
		<div className="pmdk-compare">
			<div className="pmdk-compare__head">
				<div className="pmdk-compare__head-cell">
					{ labels.headFeature }
				</div>
				<div className="pmdk-compare__head-cell pmdk-compare__head-cell--center">
					{ labels.headFree }
				</div>
				<div className="pmdk-compare__head-cell pmdk-compare__head-cell--center pmdk-compare__head-cell--pro">
					{ labels.headPro }
				</div>
			</div>

			{ sections.map( ( section ) => (
				<section
					key={ section.id }
					className="pmdk-compare__section"
				>
					<h3 className="pmdk-compare__section-title">
						{ section.label }
					</h3>
					<div className="pmdk-compare__rows">
						{ section.rows.map( ( row ) => (
							<div
								key={ `${ section.id }-${ row.id }` }
								className="pmdk-compare__row"
							>
								<div className="pmdk-compare__feature">
									{ row.label }
								</div>
								<div className="pmdk-compare__cell-wrap">
									<Cell value={ row.free } labels={ labels } />
								</div>
								<div className="pmdk-compare__cell-wrap">
									<Cell value={ row.pro } labels={ labels } />
								</div>
							</div>
						) ) }
					</div>
				</section>
			) ) }

			{ footer && (
				<div className="pmdk-compare__cta">
					<div className="pmdk-compare__cta-text">
						<h4 className="pmdk-compare__cta-title">
							{ footer.title }
						</h4>
						{ footer.description && (
							<p className="pmdk-compare__cta-description">
								{ footer.description }
							</p>
						) }
					</div>
					{ footer.ctaHref && footer.ctaLabel && (
						<Button
							variant="primary"
							href={ footer.ctaHref }
							target="_blank"
							rel="noopener noreferrer"
						>
							{ footer.ctaLabel }
						</Button>
					) }
				</div>
			) }
		</div>
	);
}
