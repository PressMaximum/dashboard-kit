/**
 * registerSubmenuActive — visual smoke fixture.
 *
 * The real consumer is WP admin's submenu DOM, not React. This story
 * fakes that DOM (a stripped-down `#toplevel_page_*` + `.wp-submenu`
 * tree styled close enough to WP's defaults) and mounts the helper.
 * Clicking the buttons updates `window.location.hash` + dispatches
 * `hashchange`, and you can watch the `.current` highlight move
 * between submenu items.
 *
 * Imported via `../src/index.mjs` would skip the editor-helpers
 * sub-entry — pull from the same source path real consumers consume.
 */

import { useEffect, useRef, useState } from '@wordpress/element';

import { registerSubmenuActive } from '../src/editor-helpers/index.mjs';

export default {
	title: 'Editor helpers/registerSubmenuActive',
	parameters: { layout: 'fullscreen' },
};

const MENU_ID = 'toplevel_page_pmdk_demo';

const STYLES = `
.pmdk-demo-fake-wp {
	background: #1d2327;
	color: #f0f0f1;
	padding: 16px 0;
	min-height: 420px;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	font-size: 13px;
}
.pmdk-demo-fake-wp ul,
.pmdk-demo-fake-wp li { list-style: none; margin: 0; padding: 0; }
.pmdk-demo-fake-wp .wp-submenu {
	background: #2c3338;
	min-width: 200px;
	padding: 6px 0;
}
.pmdk-demo-fake-wp .wp-submenu li a {
	display: block;
	padding: 6px 12px;
	color: rgba( 240, 246, 252, 0.7 );
	text-decoration: none;
}
.pmdk-demo-fake-wp .wp-submenu li.current a,
.pmdk-demo-fake-wp .wp-submenu li a:hover {
	color: #72aee6;
	background: #0a4b78;
}
.pmdk-demo-fake-wp__topmenu {
	font-weight: 600;
	color: #fff;
	padding: 8px 12px;
}
.pmdk-demo-controls {
	background: #f6f7f7;
	padding: 16px 24px;
	border-top: 1px solid #c3c4c7;
}
.pmdk-demo-controls button {
	margin: 0 8px 0 0;
	padding: 6px 12px;
}
.pmdk-demo-hash {
	font-family: ui-monospace, SFMono-Regular, monospace;
	padding: 4px 8px;
	background: #fff;
	border: 1px solid #c3c4c7;
	border-radius: 3px;
}
`;

const ROUTES = [
	{ hash: '', label: '#welcome (clears hash)' },
	{ hash: '#templates', label: '#templates' },
	{ hash: '#settings', label: '#settings' },
	{ hash: '#changelog', label: '#changelog (unknown route)' },
];

function Demo( { targetHash = '#templates' } ) {
	const [ , force ] = useState( 0 );
	const cleanupRef = useRef( null );

	useEffect( () => {
		// Wait one tick so the React render finishes flushing before
		// the helper snapshots the submenu DOM (it captures at call
		// time — same constraint a real consumer would hit if they
		// called it before WP admin built the submenu).
		const id = window.setTimeout( () => {
			cleanupRef.current = registerSubmenuActive( {
				menuId: MENU_ID,
				hash: targetHash,
			} );
			force( ( n ) => n + 1 );
		}, 0 );
		return () => {
			window.clearTimeout( id );
			if ( cleanupRef.current ) {
				cleanupRef.current();
				cleanupRef.current = null;
			}
		};
	}, [ targetHash ] );

	function navigate( hash ) {
		// Reading + writing `window.location.hash` triggers a real
		// `hashchange` event in the browser — the helper's listener
		// will sync `.current` from inside. No React state needed.
		if ( window.location.hash === hash ) {
			return;
		}
		if ( hash ) {
			window.location.hash = hash;
		} else {
			// Clearing the hash entirely needs `history.replaceState`
			// — `window.location.hash = ''` keeps the `#`.
			history.replaceState(
				null,
				'',
				window.location.pathname + window.location.search,
			);
			window.dispatchEvent( new Event( 'hashchange' ) );
		}
	}

	return (
		<div>
			<style>{ STYLES }</style>
			<div className="pmdk-demo-fake-wp">
				<ul id={ MENU_ID }>
					<li className="pmdk-demo-fake-wp__topmenu">PMDK Demo</li>
					<ul className="wp-submenu">
						<li>
							<a
								className="wp-first-item"
								href="admin.php?page=pmdk_demo"
							>
								Welcome
							</a>
						</li>
						<li>
							<a href="admin.php?page=pmdk_demo#templates">
								Templates
							</a>
						</li>
						<li>
							<a href="admin.php?page=pmdk_demo#settings">
								Settings
							</a>
						</li>
					</ul>
				</ul>
			</div>
			<div className="pmdk-demo-controls">
				<p>
					Helper watching for{ ' ' }
					<code className="pmdk-demo-hash">{ targetHash }</code> —
					clicking the buttons below mutates{ ' ' }
					<code>window.location.hash</code> and fires{ ' ' }
					<code>hashchange</code>. Watch the dark submenu
					above: the highlighted item should swap based on
					whether the new hash matches.
				</p>
				{ ROUTES.map( ( r ) => (
					<button
						key={ r.hash || 'empty' }
						type="button"
						onClick={ () => navigate( r.hash ) }
					>
						{ r.label }
					</button>
				) ) }
				<p style={ { marginTop: 16 } }>
					Current hash:{ ' ' }
					<code className="pmdk-demo-hash">
						{ window.location.hash || '(empty)' }
					</code>
				</p>
			</div>
		</div>
	);
}

export const HighlightTemplates = {
	name: 'Watching #templates — switch hash to see the highlight',
	render: () => <Demo targetHash="#templates" />,
};

export const HighlightSettings = {
	name: 'Watching #settings — same fixture, different target hash',
	render: () => <Demo targetHash="#settings" />,
};
