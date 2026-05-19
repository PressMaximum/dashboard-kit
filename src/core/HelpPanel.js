/**
 * HelpPanel — Tier-2 page component (SPEC §5.13). Compact help popover
 * anchored to a `?` button. Consumers pass `items` (resource links) and
 * optionally `labels` (English fallbacks shipped); the panel handles
 * hash-vs-external link detection + SPA navigation for hash hrefs.
 *
 * Built on `<Dropdown>` from `@wordpress/components` (NOT `<Modal>`):
 * a small anchored popover is right-sized for 4-6 resource links;
 * Dropdown handles open / close + focus management + click-outside +
 * Esc dismissal for free.
 *
 * SPEC §16.2 wraps the popover content in `.pmdk-help-panel`. The
 * `<Dropdown>` toggle is not part of the locked class surface — the
 * trigger lives inside `.pmdk-dashboard__help-trigger` for theme-level
 * targeting consistent with `.pmdk-dashboard__brand` / `__tabs`.
 *
 * Items:
 *
 *   {
 *     id: string,            // unique key for React
 *     label: string,         // already-translated visible text
 *     href: string,          // '#hash' OR 'https://…'
 *     external?: boolean,    // override auto-detect (default: !href.startsWith('#'))
 *   }
 *
 * Hash items navigate via the kit router (honors `NavigationGuardProvider`).
 * External items open in a new tab with `rel="noopener noreferrer"`.
 */

import { Button, Dropdown, Icon } from '@wordpress/components';
import {
	help as helpIconAsset,
	external as externalIconAsset,
	chevronRight,
	page as pageIconAsset,
} from '@wordpress/icons';

import { useNavigate } from './HashRouter';
import { createI18nBag } from './createI18nBag';

import './HelpPanel.css';

const DEFAULT_LABELS = {
	triggerLabel: 'Open help panel',
	heading: 'Help',
};

function isHashHref( href ) {
	return typeof href === 'string' && href.startsWith( '#' );
}

export default function HelpPanel( {
	items,
	labels,
	icon = helpIconAsset,
	itemIcon = pageIconAsset,
} ) {
	const onNavigate = useNavigate();

	if ( ! Array.isArray( items ) || items.length === 0 ) {
		return null;
	}

	const L = createI18nBag( DEFAULT_LABELS, labels );

	return (
		<Dropdown
			className="pmdk-dashboard__help-trigger"
			contentClassName="pmdk-help-panel"
			popoverProps={ { placement: 'bottom-end', offset: 8 } }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					className="pmdk-dashboard__help-trigger-button"
					icon={ icon }
					label={ L.triggerLabel }
					onClick={ onToggle }
					aria-expanded={ isOpen }
				/>
			) }
			renderContent={ ( { onClose } ) => (
				<div className="pmdk-help-panel__panel">
					<h2 className="pmdk-help-panel__heading">
						{ L.heading }
					</h2>
					<ul className="pmdk-help-panel__list">
						{ items.map( ( item ) => {
							const isHash = isHashHref( item.href );
							const isExternal =
								typeof item.external === 'boolean'
									? item.external
									: ! isHash;
							return (
								<li
									key={ item.id }
									className="pmdk-help-panel__item"
								>
									<a
										className="pmdk-help-panel__link"
										href={ item.href }
										target={
											isExternal ? '_blank' : undefined
										}
										rel={
											isExternal
												? 'noopener noreferrer'
												: undefined
										}
										onClick={ ( event ) => {
											if ( isHash ) {
												onNavigate( item.href )(
													event,
												);
											}
											onClose();
										} }
									>
										<Icon
											className="pmdk-help-panel__icon"
											icon={ item.icon || itemIcon }
											size={ 18 }
										/>
										<span className="pmdk-help-panel__label">
											{ item.label }
										</span>
										<Icon
											className="pmdk-help-panel__chevron"
											icon={
												isHash
													? chevronRight
													: externalIconAsset
											}
											size={ 16 }
										/>
									</a>
								</li>
							);
						} ) }
					</ul>
				</div>
			) }
		/>
	);
}
