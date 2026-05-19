/**
 * SaveBar — Tier-2 page component (SPEC §5.13). Left-aligned status text
 * mirrors the store lifecycle (saving / dirty / saved); right cluster is
 * a dirty-gated Save plus a Reset that prompts before dispatching.
 *
 * Locked CSS class per SPEC §16.2: `.pmdk-save-bar`.
 *
 * String surface (SPEC §5.10b — English fallbacks shipped, consumer's
 * `__()` extraction happens at the call site via the `labels` prop):
 *
 *   regionLabel    aria-label on the bar (default 'Settings actions')
 *   saveLabel      primary button copy (default 'Save changes')
 *   savingLabel    primary button copy while saving (default 'Saving…')
 *   resetLabel     reset button copy (default 'Reset to defaults')
 *   statusSaved    left-side status when clean (default 'All changes saved')
 *   statusDirty    left-side status when dirty (default 'Unsaved changes')
 *   statusSaving   left-side status while saving (default 'Saving…')
 *
 * The Reset confirmation prompt lives in the consumer's onReset handler
 * (browser-native `confirm()` with their translated copy) — keeps the
 * kit free of the `confirm()` text. SPEC §5.10b `resetConfirmLabel` is
 * a consumer-side string, not a kit prop.
 */

import { Button, Flex, FlexItem, Icon, Spinner } from '@wordpress/components';
import { check as checkIcon } from '@wordpress/icons';

import { createI18nBag } from '../core/createI18nBag.js';

import './SaveBar.css';

const DEFAULT_LABELS = {
	regionLabel: 'Settings actions',
	saveLabel: 'Save changes',
	savingLabel: 'Saving…',
	resetLabel: 'Reset to defaults',
	statusSaved: 'All changes saved',
	statusDirty: 'Unsaved changes',
	statusSaving: 'Saving…',
};

function Status( { isDirty, isSaving, labels } ) {
	if ( isSaving ) {
		return (
			<span className="pmdk-save-bar__status is-saving">
				<Spinner />
				<span>{ labels.statusSaving }</span>
			</span>
		);
	}
	if ( isDirty ) {
		return (
			<span className="pmdk-save-bar__status is-dirty">
				{ labels.statusDirty }
			</span>
		);
	}
	return (
		<span className="pmdk-save-bar__status is-saved">
			<Icon icon={ checkIcon } size={ 16 } />
			<span>{ labels.statusSaved }</span>
		</span>
	);
}

export default function SaveBar( {
	isDirty,
	isSaving,
	onSave,
	onReset,
	labels: callerLabels,
} ) {
	const labels = createI18nBag( DEFAULT_LABELS, callerLabels );
	return (
		<div
			className="pmdk-save-bar"
			role="region"
			aria-label={ labels.regionLabel }
		>
			<Flex justify="space-between" align="center" gap={ 3 }>
				<FlexItem>
					<Status
						isDirty={ isDirty }
						isSaving={ isSaving }
						labels={ labels }
					/>
				</FlexItem>
				<FlexItem>
					<Flex align="center" gap={ 2 }>
						<FlexItem>
							<Button
								variant="tertiary"
								isDestructive
								onClick={ onReset }
								disabled={ isSaving }
							>
								{ labels.resetLabel }
							</Button>
						</FlexItem>
						<FlexItem>
							<Button
								variant="primary"
								onClick={ onSave }
								disabled={ ! isDirty || isSaving }
							>
								{ isSaving
									? labels.savingLabel
									: labels.saveLabel }
							</Button>
						</FlexItem>
					</Flex>
				</FlexItem>
			</Flex>
		</div>
	);
}
