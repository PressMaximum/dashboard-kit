/**
 * EntityPreviewFrame — Tier-2 iframe wrapper that renders a full-page
 * preview at a desktop-realistic viewport, then CSS-scales the result
 * to fit whatever card / cell the consumer drops it into. SPEC §5.6.
 *
 * Why scale instead of just resize?
 * The page being previewed (a CPT singular template, a pattern preview
 * route, etc.) runs the full `wp_head()` enqueue chain server-side, so
 * theme + plugin CSS arrives with its native breakpoints. Resizing the
 * iframe to a 200px card would trigger the mobile breakpoint and ship a
 * thumbnail that doesn't match the actual published page. The Patterns
 * + Templates browser in WP core uses the same scale-down trick.
 *
 * The transform uses container query units (`100cqw`) so the scale ratio
 * is derived from the card's own width — no JS measurement or
 * `ResizeObserver` needed. SPEC §11 hack #3 / #4 are about the OUTER
 * flex chain feeding DataViews; this component sits *inside* a DataViews
 * cell and only cares about its own container width.
 *
 * Ported from the Surfaces spike `tabs/Surfaces/index.js:121-142` +
 * `editor.css:121-145`. The spike hardcoded `viewportWidth = 1200`; the
 * kit exposes it as a prop so consumers can match their template's
 * design viewport (e.g. 1440 for a header-heavy template).
 *
 * Two sizing modes (since drift finding 6.2):
 *
 *   `aspectMode='fixed'` (default) — wrapper has `aspect-ratio: 4/3`,
 *      iframe gets explicit `viewportHeight` on its element. Card height
 *      stays uniform across a grid; great for "thumbnail catalogue" UX
 *      where the user is browsing many items at once.
 *
 *   `aspectMode='content'` — wrapper drops `aspect-ratio`, iframe height
 *      is measured from the rendered document and applied inline. Pair
 *      with `onContentHeight(itemId, heightPx)` if the parent wants to
 *      compute a max across a list and distribute it back as
 *      `viewportHeight` for visually consistent cards.
 *
 * Locked classes (SPEC §16.2):
 *   `.pmdk-entity-preview`
 *   `.pmdk-entity-preview__frame`
 *   `.pmdk-entity-preview.is-empty`
 *
 * @param {Object}                                  props
 * @param {string}                                  [props.src]             Full URL the iframe loads. When
 *                                                                          empty AND `previewDoc` is also
 *                                                                          empty, renders the empty
 *                                                                          placeholder.
 * @param {string}                                  [props.previewDoc]      Full HTML document string. When
 *                                                                          set, the iframe loads a
 *                                                                          `blob:` URL built from this
 *                                                                          doc. Preferred over `src` when
 *                                                                          the consumer already has the
 *                                                                          doc in memory (avoids an HTTP
 *                                                                          round-trip + works offline /
 *                                                                          inside admin-only contexts).
 *                                                                          Cleaned up on unmount and on
 *                                                                          prop change via
 *                                                                          `URL.revokeObjectURL`.
 *                                                                          Precedence: when both `src`
 *                                                                          and `previewDoc` are set,
 *                                                                          `previewDoc` wins. The string
 *                                                                          is rendered as-is; any inline
 *                                                                          styles or CSS vars the preview
 *                                                                          needs (e.g.
 *                                                                          `--wp--style--global--content-size`)
 *                                                                          must already be embedded.
 * @param {string}                                  [props.title]           Accessible iframe title; also
 *                                                                          used as the empty-state aria
 *                                                                          label fallback.
 * @param {number}                                  [props.viewportWidth]   Desktop viewport the iframe
 *                                                                          renders at, in px. Default 1200.
 * @param {number}                                  [props.viewportHeight]  Iframe element height in px.
 *                                                                          Default 900 (4:3 of 1200).
 *                                                                          Ignored when
 *                                                                          `aspectMode='content'` (height
 *                                                                          comes from measurement).
 * @param {('fixed'|'content')}                     [props.aspectMode]
 *                                                                          Sizing strategy. `'fixed'`
 *                                                                          (default) keeps the wrapper at
 *                                                                          4:3 + uses `viewportHeight`.
 *                                                                          `'content'` drops the
 *                                                                          aspect-ratio + measures the
 *                                                                          rendered document's first child
 *                                                                          to size the iframe. Requires
 *                                                                          same-origin content (a blob URL
 *                                                                          or a same-origin src) so the
 *                                                                          kit can read `contentDocument`.
 * @param {string|number}                           [props.itemId]          Identifier passed back as the
 *                                                                          first arg of `onContentHeight`.
 *                                                                          Required for the parent's
 *                                                                          state-lift case (when several
 *                                                                          frames feed a max-height
 *                                                                          reducer); optional otherwise.
 * @param {(itemId: any, heightPx: number) => void} [props.onContentHeight]
 *                                                                          Fired with the measured height
 *                                                                          on every successful measure
 *                                                                          (initial load + each
 *                                                                          `ResizeObserver` tick). Only
 *                                                                          invoked when
 *                                                                          `aspectMode='content'`. The
 *                                                                          callback is not deduped — the
 *                                                                          parent should `useState`-skip
 *                                                                          identical values if it cares.
 * @param {string}                                  [props.emptyLabel]      Text shown when both `src` and
 *                                                                          `previewDoc` are empty. Default
 *                                                                          `'No preview'`.
 * @param {string}                                  [props.className]       Extra class names appended to
 *                                                                          the outer wrapper.
 */

import { useEffect, useRef } from '@wordpress/element';
import './EntityPreviewFrame.css';

const DEFAULT_VIEWPORT_WIDTH = 1200;
const DEFAULT_VIEWPORT_HEIGHT = 900;
const DEFAULT_EMPTY_LABEL = 'No preview';

export default function EntityPreviewFrame( {
	src,
	previewDoc,
	title,
	viewportWidth = DEFAULT_VIEWPORT_WIDTH,
	viewportHeight = DEFAULT_VIEWPORT_HEIGHT,
	aspectMode = 'fixed',
	itemId,
	onContentHeight,
	emptyLabel = DEFAULT_EMPTY_LABEL,
	className,
} = {} ) {
	const iframeRef = useRef( null );
	const blobUrlRef = useRef( null );
	// Latest-callback refs so the measure effect doesn't tear down on every
	// parent render that re-creates the inline callback.
	const onContentHeightRef = useRef( onContentHeight );
	const itemIdRef = useRef( itemId );
	onContentHeightRef.current = onContentHeight;
	itemIdRef.current = itemId;

	// 6.1 — blob URL effect. Imperatively assigns `iframe.src` so the
	// JSX-rendered `src=` (the consumer's HTTP fallback) is overridden
	// without forcing a JSX re-render. Cleanup revokes both on prop
	// change AND on unmount; the `=== url` guard makes the cleanup
	// idempotent under React strict mode's double-invoke.
	useEffect( () => {
		if ( ! previewDoc ) {
			if ( blobUrlRef.current ) {
				URL.revokeObjectURL( blobUrlRef.current );
				blobUrlRef.current = null;
			}
			return undefined;
		}
		const blob = new Blob( [ previewDoc ], { type: 'text/html' } );
		const url = URL.createObjectURL( blob );
		if ( blobUrlRef.current ) {
			URL.revokeObjectURL( blobUrlRef.current );
		}
		blobUrlRef.current = url;
		if ( iframeRef.current ) {
			iframeRef.current.src = url;
		}
		return () => {
			URL.revokeObjectURL( url );
			if ( blobUrlRef.current === url ) {
				blobUrlRef.current = null;
			}
		};
	}, [ previewDoc ] );

	// 6.2 / 6.5 — content-aware sizing. Reads body.firstElementChild
	// bounding rect + body padding, NOT body.scrollHeight: with the
	// iframe element's `style.height` set, body inherits the viewport via
	// html's `height: 100%` chain, so `body.scrollHeight` returns the
	// iframe's own height instead of the real content.
	useEffect( () => {
		if ( aspectMode !== 'content' ) {
			return undefined;
		}
		const iframe = iframeRef.current;
		if ( ! iframe ) {
			return undefined;
		}

		let observer = null;

		const measure = () => {
			try {
				const doc = iframe.contentDocument;
				if ( ! doc || ! doc.body ) {
					return;
				}
				const first = doc.body.firstElementChild;
				if ( ! first ) {
					return;
				}
				const rect = first.getBoundingClientRect();
				const style = doc.defaultView?.getComputedStyle( doc.body );
				const padTop = style
					? parseFloat( style.paddingTop ) || 0
					: 0;
				const padBot = style
					? parseFloat( style.paddingBottom ) || 0
					: 0;
				const h = Math.round( rect.height + padTop + padBot );
				if ( h <= 0 ) {
					return;
				}
				iframe.style.height = `${ h }px`;
				if ( onContentHeightRef.current ) {
					onContentHeightRef.current( itemIdRef.current, h );
				}
			} catch ( _ ) {
				// Same-origin blob/about: should never throw, but
				// cross-origin srcs would — swallow silently rather than
				// surfacing it to the consumer's render loop.
			}
		};

		const onLoad = () => {
			measure();
			if ( observer ) {
				observer.disconnect();
				observer = null;
			}
			const doc = iframe.contentDocument;
			const first = doc?.body?.firstElementChild;
			if ( first && typeof ResizeObserver !== 'undefined' ) {
				observer = new ResizeObserver( measure );
				observer.observe( first );
			}
		};

		iframe.addEventListener( 'load', onLoad );
		// Already-loaded case (about:blank, fast-loading blob URLs):
		// fire a measure tick now too. Idempotent against the `load`
		// handler since duplicate observer registration is guarded above.
		onLoad();

		return () => {
			iframe.removeEventListener( 'load', onLoad );
			if ( observer ) {
				observer.disconnect();
			}
		};
	}, [ aspectMode ] );

	const isEmpty = ! src && ! previewDoc;
	const wrapperClass =
		'pmdk-entity-preview' +
		( isEmpty ? ' is-empty' : '' ) +
		( className ? ' ' + className : '' );

	// CSS reads `--pmdk-preview-viewport` to compute the scale ratio so
	// non-default viewports still fit. Height is set on the iframe element
	// directly because container queries can't easily reach element-level
	// box dimensions.
	const wrapperStyle = {
		'--pmdk-preview-viewport': `${ viewportWidth }px`,
	};

	if ( isEmpty ) {
		return (
			<div
				className={ wrapperClass }
				style={ wrapperStyle }
				data-aspect-mode={ aspectMode }
			>
				<span>{ emptyLabel }</span>
			</div>
		);
	}

	const iframeStyle = {
		width: `${ viewportWidth }px`,
		// In content mode, the measurement effect drives height; omit
		// from JSX so React's reconciliation doesn't fight the imperative
		// assignment.
		...( aspectMode === 'content'
			? {}
			: { height: `${ viewportHeight }px` } ),
	};

	return (
		<div
			className={ wrapperClass }
			style={ wrapperStyle }
			data-aspect-mode={ aspectMode }
		>
			<iframe
				ref={ iframeRef }
				src={ previewDoc ? undefined : src }
				title={ title }
				loading="lazy"
				tabIndex={ -1 }
				className="pmdk-entity-preview__frame"
				style={ iframeStyle }
			/>
		</div>
	);
}
