/**
 * Fixture sync reminder — compares the committed CI fixtures against the live
 * files in the aponto worktree.
 *
 *   node tests/vr/check-bridge-sync.mjs [aponto-mockup-assets-css-dir]
 *
 * The kit repo commits copies of the Aponto bridge + token sheet under
 * `tests/vr/fixtures/` so GATE B (verify-tokens.mjs) runs on CI without an
 * aponto checkout. Whoever edits the live files must re-copy them here; this
 * script fails (exit 1) on drift with copy instructions. When the live path
 * does not exist (CI, other machines) it SKIPS with exit 0 — the check is a
 * local dev reminder, not a CI gate.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname( fileURLToPath( import.meta.url ) );

const LIVE_DIR =
	process.argv[ 2 ] ||
	process.env.VR_APONTO_CSS_DIR ||
	'/Users/kientrongmini/Studio/aponto/wp-content/plugins/aponto/.claude/worktrees/wt-kit-p2-bridge/docs/mockups/v4/assets/css';

const PAIRS = [
	[ 'aponto-admin-bridge.css', 'aponto-admin-bridge.css' ],
	[ 'aponto-tokens.css', 'aponto-tokens.css' ],
];

if ( ! existsSync( LIVE_DIR ) ) {
	console.log(
		`  aponto worktree not found at ${ LIVE_DIR } — skipping fixture sync check (expected on CI).`
	);
	process.exit( 0 );
}

let drift = 0;
for ( const [ fixtureName, liveName ] of PAIRS ) {
	const fixturePath = path.join( HERE, 'fixtures', fixtureName );
	const livePath = path.join( LIVE_DIR, liveName );
	if ( ! existsSync( livePath ) ) {
		console.log( `  ! live file missing: ${ livePath } (skipped)` );
		continue;
	}
	const [ a, b ] = await Promise.all( [
		readFile( fixturePath, 'utf8' ),
		readFile( livePath, 'utf8' ),
	] );
	if ( a === b ) {
		console.log( `  in sync: ${ fixtureName }` );
	} else {
		drift++;
		console.log( `  ✗ DRIFT: ${ fixtureName }` );
		console.log( `      cp '${ livePath }' '${ fixturePath }'` );
	}
}

if ( drift ) {
	console.log(
		`\n  ${ drift } fixture(s) out of sync — re-copy (commands above), re-run GATE B, and update the intended-mapping table in verify-tokens.mjs if the mapping itself changed.`
	);
	process.exit( 1 );
}
console.log( '  fixtures in sync ✓' );
