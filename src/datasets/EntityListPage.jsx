/**
 * EntityListPage — Tier-2 page component for CPT list views built on
 * `@wordpress/dataviews`. SPEC §5.6.
 *
 * Responsibilities:
 * - Wrap content in `<PageWrapper>` so DataViews's `useResizeObserver`
 *   sees a real `containerWidth` (SPEC §11 hack #3 — proper fix landed
 *   in P2).
 * - Render header chrome via the existing `<ListPageHeader>` Tier-1
 *   primitive (title + description + primaryAction).
 * - Switch between loading / empty / populated states.
 * - Hand everything else off to `<DataViews>`; the consumer owns view
 *   state, fields, actions, items.
 *
 * Why no `useEntityRecords`?
 * SPEC §3.3 forbids the kit from importing `@wordpress/core-data` /
 * `@wordpress/api-fetch`. Consumer fetches its records (typically via
 * `useEntityRecords` in their own component) + passes `items` +
 * `isLoading` in. Keeps the kit data-source agnostic — works for
 * post-type lists, taxonomy lists, REST-driven custom resources, etc.
 *
 * Why no DataViews CSS import?
 * `@wordpress/dataviews` ships its CSS via the WP `wp-dataviews` style
 * handle, registered by WP core ≥6.5. When consumer's wp-scripts builds
 * their bundle, `DependencyExtractionWebpackPlugin` traces the kit's
 * `@wordpress/dataviews` JS import + adds `wp-dataviews` to the
 * generated asset.php script-deps; WP then enqueues the matching style
 * handle automatically. The kit avoids vendoring + double-bundling.
 * Spike's `dataviews-vendor.css` (74 KB) is therefore NOT ported —
 * that's how SPEC §11 hack #2 actually disappears.
 *
 * Locked class (SPEC §16.2): `.pmdk-entity-list-page`.
 *
 * @param {Object}                                   props
 * @param {Array<Record<string, unknown>>}           props.items
 *                                                                          Pre-loaded records. Consumer fetches; kit just renders.
 * @param {boolean}                                  [props.isLoading]
 *                                                                          When true and `items` is empty, render the loading state.
 * @param {Array}                                    props.fields
 *                                                                          DataViews `fields` array. Consumer constructs (often via a
 *                                                                          `{ns}.dashboard.<list>.fields` filter so Pro can extend).
 * @param {Object}                                   props.view
 *                                                                          DataViews view config (controlled prop).
 * @param {(next: Object) => void}                   props.onChangeView
 *                                                                          View-change handler; consumer wires + may persist via
 *                                                                          `ViewPersistence`.
 * @param {Object}                                   [props.defaultLayouts]
 *                                                                          DataViews `defaultLayouts` config.
 * @param {Array}                                    [props.actions]
 *                                                                          DataViews row-actions array.
 * @param {Object}                                   props.paginationInfo
 *                                                                          Output of `filterSortAndPaginate` (or equivalent).
 * @param {(item: Object) => string}                 props.getItemId
 *                                                                          Stable id extractor.
 * @param {string}                                   props.title
 *                                                                          Page heading.
 * @param {string}                                   [props.description]
 *                                                                          Sub-heading text.
 * @param {{ label: string, href: string }}          [props.primaryAction]
 *                                                                          Top-right CTA. When set, renders as a primary Button.
 * @param {{ loading?: string, noResults?: string }} [props.labels]
 *                                                                          English fallbacks shipped — see SPEC §5.10b.
 * @param {string}                                   [props.className]
 *                                                                          Extra class names appended to the page wrapper.
 */

import { Button, Spinner } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';

import PageWrapper from '../layouts/PageWrapper';
import ListPageHeader from '../layouts/ListPageHeader';
import { createI18nBag } from '../core/createI18nBag';

import './EntityListPage.css';

const DEFAULT_LABELS = {
	loading: 'Loading items…',
	noResults: 'No items match your filters.',
};

export default function EntityListPage( {
	items = [],
	isLoading = false,
	fields,
	view,
	onChangeView,
	defaultLayouts,
	actions,
	paginationInfo,
	getItemId,
	title,
	description,
	primaryAction,
	labels,
	className,
} = {} ) {
	const L = createI18nBag( DEFAULT_LABELS, labels );

	const wrapperClass =
		'pmdk-entity-list-page' + ( className ? ' ' + className : '' );

	const isInitialLoad = isLoading && items.length === 0;
	const isEmpty = ! isLoading && items.length === 0;

	const headerActions = primaryAction ? (
		<Button variant="primary" href={ primaryAction.href }>
			{ primaryAction.label }
		</Button>
	) : null;

	return (
		<PageWrapper className={ wrapperClass }>
			<ListPageHeader
				title={ title }
				description={ description }
				actions={ headerActions }
			/>

			<div className="pmdk-entity-list-page__body">
				{ isInitialLoad && (
					<div
						className="pmdk-entity-list-page__loading"
						role="status"
						aria-live="polite"
					>
						<Spinner />
						<span className="screen-reader-text">
							{ L.loading }
						</span>
					</div>
				) }

				{ isEmpty && (
					<div className="pmdk-entity-list-page__empty">
						<p>{ L.noResults }</p>
					</div>
				) }

				{ ! isInitialLoad && ! isEmpty && (
					<DataViews
						data={ items }
						fields={ fields }
						view={ view }
						onChangeView={ onChangeView }
						actions={ actions }
						paginationInfo={ paginationInfo }
						defaultLayouts={ defaultLayouts }
						getItemId={ getItemId }
					/>
				) }
			</div>
		</PageWrapper>
	);
}
