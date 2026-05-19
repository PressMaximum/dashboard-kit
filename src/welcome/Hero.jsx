/**
 * Hero — Welcome page greeting + tagline + primary CTA + optional
 * illustration. SPEC §5.5 + §5.13 Tier-2 page component.
 *
 * Every visible string arrives via props; the kit ships zero
 * translatable copy. SPEC §16.2 locked class: `.pmdk-hero`.
 *
 * Slot shape:
 *
 *   <Hero
 *     greeting={ string }                        // e.g. 'Welcome, Jack'
 *     tagline={ string? }                        // short subhead
 *     primaryCta={ { label: string, href: string }? }
 *     illustration={ ReactNode? }                // brand SVG / image
 *   />
 *
 * Consumer reads the user's display name from the boot payload
 * (`useBoot()`) and formats the greeting before passing it down — keeps
 * the kit free of `sprintf` + text-domain coupling.
 */

import { Button } from '@wordpress/components';

import './Hero.css';

export default function Hero( {
	greeting,
	tagline,
	primaryCta,
	illustration,
} ) {
	return (
		<section className="pmdk-hero">
			<div className="pmdk-hero__content">
				{ greeting && (
					<h2 className="pmdk-hero__title">{ greeting }</h2>
				) }
				{ tagline && (
					<p className="pmdk-hero__tagline">{ tagline }</p>
				) }
				{ primaryCta && primaryCta.href && primaryCta.label && (
					<Button
						variant="primary"
						href={ primaryCta.href }
						className="pmdk-hero__cta"
					>
						{ primaryCta.label }
					</Button>
				) }
			</div>
			{ illustration && (
				<div className="pmdk-hero__illustration" aria-hidden="true">
					{ illustration }
				</div>
			) }
		</section>
	);
}
