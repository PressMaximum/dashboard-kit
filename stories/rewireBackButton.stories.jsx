/**
 * rewireBackButton — visual smoke fixture.
 *
 * Fakes the block editor's fullscreen-close button + a couple of
 * decoy elements so you can see the capture-phase click delegation
 * pick up the right target.
 *
 * The helper redirects via `window.location.href = ...`. Real browsers
 * block redefining `window.location`, so the demo passes a same-page
 * hash (`#pmdk-rewire-clicked`) — setting `location.href = '#hash'`
 * only mutates the hash, no actual page navigation, and the visible
 * URL bar + the click log below both update.
 */

import { useEffect, useRef, useState } from '@wordpress/element';

import { rewireBackButton } from '../src/editor-helpers/index.mjs';

export default {
	title: 'Editor helpers/rewireBackButton',
	parameters: { layout: 'padded' },
};

const FAKE_HREF = '#pmdk-rewire-clicked';

function Demo( { selector } ) {
	const [ clicks, setClicks ] = useState( [] );
	const cleanupRef = useRef( null );

	useEffect( () => {
		cleanupRef.current = rewireBackButton( {
			selector: selector || undefined,
			href: FAKE_HREF,
		} );
		function onHashChange() {
			if ( window.location.hash === FAKE_HREF ) {
				setClicks( ( log ) => [
					...log,
					new Date().toLocaleTimeString(),
				] );
				// Clear so the next click re-fires hashchange.
				history.replaceState(
					null,
					'',
					window.location.pathname + window.location.search,
				);
			}
		}
		window.addEventListener( 'hashchange', onHashChange );
		return () => {
			if ( cleanupRef.current ) {
				cleanupRef.current();
				cleanupRef.current = null;
			}
			window.removeEventListener( 'hashchange', onHashChange );
		};
	}, [ selector ] );

	const css = `
		.pmdk-demo-editor {
			background: #fff;
			border: 1px solid #c3c4c7;
			border-radius: 4px;
			padding: 0;
			min-height: 320px;
		}
		.pmdk-demo-editor__bar {
			display: flex;
			align-items: center;
			gap: 8px;
			background: #1d2327;
			color: #f0f0f1;
			padding: 8px 12px;
		}
		.pmdk-demo-editor__bar button {
			background: transparent;
			color: inherit;
			border: 1px solid rgba( 255, 255, 255, 0.4 );
			border-radius: 4px;
			padding: 4px 10px;
			cursor: pointer;
		}
		.pmdk-demo-editor__bar .edit-post-fullscreen-mode-close {
			background: #2271b1;
			border-color: #2271b1;
		}
		.pmdk-demo-editor__canvas {
			padding: 24px;
			font-family: Georgia, serif;
		}
		.pmdk-demo-log {
			margin-top: 16px;
			padding: 12px;
			background: #f6f7f7;
			border: 1px solid #dcdcde;
			border-radius: 4px;
			font-family: ui-monospace, SFMono-Regular, monospace;
			font-size: 12px;
		}
	`;

	return (
		<div>
			<style>{ css }</style>
			<p>
				Helper redirects to{ ' ' }
				<code>{ FAKE_HREF }</code> when a click matches{ ' ' }
				<code>{ selector || '.edit-post-fullscreen-mode-close' }</code>.
				The story uses a same-page hash so the iframe does not
				navigate — the click log below increments on each match,
				and the URL bar momentarily shows the hash.
			</p>
			<div className="pmdk-demo-editor">
				<div className="pmdk-demo-editor__bar">
					<button
						type="button"
						className="edit-post-fullscreen-mode-close"
					>
						← Close (capture-phase target)
					</button>
					<button type="button" className="unrelated-toolbar-btn">
						Toolbar (should NOT redirect)
					</button>
					<button type="button" className="another-decoy">
						Decoy
					</button>
				</div>
				<div className="pmdk-demo-editor__canvas">
					<h2>Fake block editor canvas</h2>
					<p>
						Click any button in the dark toolbar above. Only the
						close button should append a line to the log; the
						other two are decoys to exercise the selector match.
					</p>
				</div>
			</div>
			<div className="pmdk-demo-log">
				<strong>Helper-driven navigations: { clicks.length }</strong>
				{ clicks.length === 0 && <em> (no clicks yet) </em> }
				<ul style={ { margin: '4px 0 0 16px' } }>
					{ clicks.map( ( ts, i ) => (
						<li key={ i }>{ ts }</li>
					) ) }
				</ul>
			</div>
		</div>
	);
}

export const DefaultSelector = {
	name: 'Default — `.edit-post-fullscreen-mode-close`',
	render: () => <Demo />,
};

export const CustomSelector = {
	name: 'Custom selector — `.another-decoy`',
	render: () => <Demo selector=".another-decoy" />,
};
