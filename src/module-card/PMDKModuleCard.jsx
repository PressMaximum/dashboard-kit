/**
 * <PMDKModuleCard> — the shared module/integration card (KIT-P3, K-018).
 *
 * PressListing consumer request: its Modules page is the SECOND product
 * instantiating the Aponto module-card anatomy, so the card is promoted to
 * the kit following the PMDKDataTable split — KIT ships behavior + chrome +
 * slots on the `module-card.css` primitives; PRODUCT keeps data + copy
 * (icons, category nouns, badge labels, descriptions, actions, i18n).
 *
 * Anatomy (K-018 / DESIGN-SYSTEM "Cards and modules"):
 *   icon slot · meta line ("{Category} · {Module|Integration}") · title ·
 *   badge slots (tier via chrome, phase/extras via node slot) · description ·
 *   optional integration-state line ("Connected as …") · footer with an
 *   action slot (Configure / deep link / View roadmap) + the on/off toggle.
 *
 * States: `enabled` / `disabled` / `planned` — stamped as `is-enabled` /
 * `is-disabled` / `is-planned`. A planned module renders NO toggle: the
 * product injects a static label (`plannedLabel`) instead.
 *
 * A11y contract: the toggle is the canonical activation control (never make
 * the whole card clickable — the kit renders no card-level handlers); the
 * tier badge is an entitlement signal, visually distinct from runtime status;
 * every toggle carries an accessible name.
 *
 * The grid, category tabs and counts strip stay PRODUCT-side (SPEC §5.12
 * recipe + the ModulesPage story show the composition).
 */

const DEFAULT_LABELS = {
	/*
	 * K-047: `On` / `Off`, not `Enabled` / `Disabled`. The chrome always
	 * encoded this — `.pmdk-module-toggle-label` reserves `min-width: 20px`,
	 * which is a two-to-three character gutter, and the mockup this card was
	 * extracted from renders On/Off. The long words blew that cluster out to
	 * 56px, stealing width from the footer action beside them. Consumers who
	 * want the verbose form pass `labels={ { toggleOn, toggleOff } }`.
	 */
	toggleOn: 'On',
	toggleOff: 'Off',
	/*
	 * `name` is the resolved accessible name (K-024): `titleText` when given,
	 * else `title` if it is already a string. A node title with no `titleText`
	 * yields '' rather than "[object Object]", so the name degrades to the bare
	 * verb instead of announcing garbage.
	 */
	toggleAria: ( name, enabled ) =>
		`${ enabled ? 'Disable' : 'Enable' }${ name ? ` ${ name }` : '' }`,
};

/**
 * Tier-badge variant class (K-025).
 *
 * `.pmdk-module-license.is-free` shipped in the chrome but nothing could reach
 * it, because only `is-premium` was ever emitted. It is now reachable through
 * an explicit `tier.variant`, NOT by treating "not premium" as "free":
 * `{ label: 'Free' }` renders a bare badge in every shipped consumer, and
 * inferring `is-free` from a falsy `isPremium` restyles all of them (green
 * tint, green border, green text) on a patch bump — measured as 4 diverged
 * baseline shots, 144–310 diff px. Opting in keeps the zero-look-change
 * promise and still retires the dead CSS.
 *
 * @param {{isPremium?: boolean, variant?: 'free'|'premium'}} tier Tier descriptor.
 * @return {string} Class suffix — ' is-premium', ' is-free' or ''.
 */
function tierVariantClass( tier ) {
	if ( tier.variant === 'premium' || tier.isPremium ) {
		return ' is-premium';
	}
	if ( tier.variant === 'free' ) {
		return ' is-free';
	}
	return '';
}

export function PMDKModuleCard( {
	/* identity (product copy) */
	icon,
	meta,
	title,
	titleText,
	description,
	/* badges — tier gets kit chrome, extras are a free slot */
	tier,
	badges,
	/* state */
	state = 'disabled',
	integrationState,
	connected = false,
	/* footer */
	action,
	plannedLabel,
	statusLabel,
	/* toggle */
	toggle = true,
	onToggle,
	toggleDisabled = false,
	labels: labelOverrides,
	/* chrome */
	headingLevel = 2,
	className = '',
} ) {
	const labels = { ...DEFAULT_LABELS, ...labelOverrides };
	const isEnabled = state === 'enabled';
	const isPlanned = state === 'planned';
	const Heading = `h${ headingLevel }`;
	/*
	 * K-023: `toggle: false` renders the planned footer SHAPE (action + static
	 * label) without the planned STATE, so a connected-but-not-toggleable
	 * integration keeps its `is-enabled` chrome and its place in the on/available
	 * counts. Default `true` keeps every existing consumer unchanged.
	 */
	const showToggle = toggle && ! isPlanned;
	/* K-024: never interpolate a node into the accessible name. */
	const toggleName =
		titleText ?? ( typeof title === 'string' ? title : '' );

	let stateClass = ' is-disabled';
	if ( isEnabled ) {
		stateClass = ' is-enabled';
	} else if ( isPlanned ) {
		stateClass = ' is-planned';
	}

	return (
		<article
			className={ `pmdk-module-card${ stateClass }${
				className ? ` ${ className }` : ''
			}` }
		>
			<div className="pmdk-module-card-head">
				<span className="pmdk-module-icon" aria-hidden="true">
					{ icon || null }
				</span>
				<div className="pmdk-module-copy">
					{ meta ? (
						<p className="pmdk-module-meta">{ meta }</p>
					) : null }
					<Heading>{ title }</Heading>
					{ description ? (
						<p className="pmdk-module-description">
							{ description }
						</p>
					) : null }
					{ integrationState ? (
						<p className="pmdk-module-connection-line">
							<span
								className={ `pmdk-module-connection${
									connected ? ' is-connected' : ''
								}` }
							>
								{ integrationState }
							</span>
						</p>
					) : null }
				</div>
				<span className="pmdk-module-badges">
					{ tier ? (
						<span
							className={ `pmdk-module-license${ tierVariantClass(
								tier,
							) }` }
						>
							{ tier.label }
						</span>
					) : null }
					{ badges || null }
				</span>
			</div>
			<div className="pmdk-module-card-foot">
				<span className="pmdk-module-card-action">
					{ action || null }
				</span>
				{ showToggle ? (
					<label className="pmdk-module-toggle">
						<span className="pmdk-module-toggle-label">
							{ isEnabled
								? labels.toggleOn
								: labels.toggleOff }
						</span>
						<input
							type="checkbox"
							checked={ isEnabled }
							disabled={ toggleDisabled }
							aria-label={ labels.toggleAria(
								toggleName,
								isEnabled,
							) }
							onChange={ ( event ) =>
								onToggle?.( event.target.checked )
							}
						/>
						<span
							className="pmdk-toggle-track"
							aria-hidden="true"
						>
							<span />
						</span>
					</label>
				) : (
					<span className="pmdk-module-toggle-label">
						{ ( isPlanned ? plannedLabel : statusLabel ) || null }
					</span>
				) }
			</div>
		</article>
	);
}
