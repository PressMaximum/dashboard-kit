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
	toggleOn: 'Enabled',
	toggleOff: 'Disabled',
	toggleAria: ( title, enabled ) =>
		`${ enabled ? 'Disable' : 'Enable' } ${ title }`,
};

export function PMDKModuleCard( {
	/* identity (product copy) */
	icon,
	meta,
	title,
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
	/* toggle */
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
							className={ `pmdk-module-license${
								tier.isPremium ? ' is-premium' : ''
							}` }
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
				{ isPlanned ? (
					<span className="pmdk-module-toggle-label">
						{ plannedLabel || null }
					</span>
				) : (
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
								title,
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
				) }
			</div>
		</article>
	);
}
