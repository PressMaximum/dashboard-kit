/**
 * Checklist — Welcome page onboarding-tasks list. SPEC §5.5.
 *
 * Tier-2 page component: renders an `<ol>` with status indicators per
 * item. The Card chrome around it lives in the consumer's tab page
 * (the spike wrapped this in `<Card>` but the locked CSS class is on
 * the kit's container, so the kit owns the semantic + a11y wrapper).
 *
 * SPEC §16.2 locked classes: `.pmdk-checklist`, `.pmdk-checklist__item`,
 * `.pmdk-checklist__status`, `.pmdk-checklist__cta`.
 *
 * Consumer hooks the onboarding store into each item via
 * `item.manualCompleted` (see ChecklistItem docstring) so the kit
 * never directly reads the consumer's store name.
 *
 * Slot shape:
 *
 *   <Checklist
 *     items={ ChecklistItem[] }
 *     ariaLabel={ string }                  // already-translated
 *     itemLabels={ { checking?, completed?, pending? } }
 *   />
 *
 * Returns `null` when `items` is empty — Welcome pages with the
 * checklist dismissed render nothing here, no zero-row stub.
 */

import ChecklistItem from './ChecklistItem.jsx';

import './Checklist.css';

export default function Checklist( { items, ariaLabel, itemLabels } ) {
	if ( ! Array.isArray( items ) || items.length === 0 ) {
		return null;
	}

	return (
		<section className="pmdk-checklist" aria-label={ ariaLabel }>
			<ul className="pmdk-checklist__list">
				{ items.map( ( item ) => (
					<ChecklistItem
						key={ item.id }
						item={ item }
						labels={ itemLabels }
					/>
				) ) }
			</ul>
		</section>
	);
}
