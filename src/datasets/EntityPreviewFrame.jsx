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
 * Locked classes (SPEC §16.2):
 *   `.pmdk-entity-preview`
 *   `.pmdk-entity-preview__frame`
 *   `.pmdk-entity-preview.is-empty`
 *
 * @param {Object} props
 * @param {string} [props.src]            Full URL the iframe loads. When
 *                                        empty / undefined, renders the
 *                                        empty placeholder.
 * @param {string} [props.title]          Accessible iframe title; also
 *                                        used as the empty-state aria
 *                                        label fallback.
 * @param {number} [props.viewportWidth]  Desktop viewport the iframe
 *                                        renders at, in px. Default 1200.
 * @param {number} [props.viewportHeight] Iframe element height in px.
 *                                        Default 900 (4:3 of 1200).
 * @param {string} [props.emptyLabel]     Text shown when `src` is empty.
 *                                        Default `'No preview'`.
 * @param {string} [props.className]      Extra class names appended to
 *                                        the outer wrapper.
 */

import './EntityPreviewFrame.css';

const DEFAULT_VIEWPORT_WIDTH = 1200;
const DEFAULT_VIEWPORT_HEIGHT = 900;
const DEFAULT_EMPTY_LABEL = 'No preview';

export default function EntityPreviewFrame( {
	src,
	title,
	viewportWidth = DEFAULT_VIEWPORT_WIDTH,
	viewportHeight = DEFAULT_VIEWPORT_HEIGHT,
	emptyLabel = DEFAULT_EMPTY_LABEL,
	className,
} = {} ) {
	const isEmpty = ! src;
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
			<div className={ wrapperClass } style={ wrapperStyle }>
				<span>{ emptyLabel }</span>
			</div>
		);
	}

	return (
		<div className={ wrapperClass } style={ wrapperStyle }>
			<iframe
				src={ src }
				title={ title }
				loading="lazy"
				tabIndex={ -1 }
				className="pmdk-entity-preview__frame"
				style={ {
					width: `${ viewportWidth }px`,
					height: `${ viewportHeight }px`,
				} }
			/>
		</div>
	);
}
