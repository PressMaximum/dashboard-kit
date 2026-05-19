/**
 * BootDataLoader — read the consumer's PHP-localized boot payload off
 * `window[ bootGlobal ]` and ship it down the component tree via React
 * context. Single accessor pattern keeps the rest of the kit ignorant of
 * which `window` key any given consumer chose.
 *
 * Shape contract is consumer-defined (the kit imposes no required keys
 * — that's the consumer's PHP). Components that need a value pull it
 * via `useBoot()`; missing keys are the consumer's bug to surface.
 */

import { createContext, useContext } from '@wordpress/element';

const BootContext = createContext( {} );

/**
 * Read the boot payload off `window`. Safe under SSR / module-eval —
 * returns `{}` if `window` is undefined or the key isn't set.
 *
 * @param {string} bootGlobal Window key name, e.g. `'customifyDashboard'`.
 * @return {Record<string, unknown>} Boot payload (empty object on miss).
 */
export function readBoot( bootGlobal ) {
	if ( typeof window === 'undefined' || ! bootGlobal ) {
		return {};
	}
	const raw = window[ bootGlobal ];
	return raw && typeof raw === 'object' ? raw : {};
}

/**
 * Provider — wraps the dashboard tree with the resolved boot snapshot.
 * `mountDashboard` does this once at the top; everything below reads via
 * `useBoot()`.
 *
 * @param {Object}                    props
 * @param {Record<string, unknown>}   props.boot     Resolved boot payload.
 * @param {import('react').ReactNode} props.children
 */
export function BootProvider( { boot, children } ) {
	return <BootContext.Provider value={ boot || {} }>{ children }</BootContext.Provider>;
}

/** Consume the boot snapshot from anywhere inside the dashboard tree. */
export function useBoot() {
	return useContext( BootContext );
}

export { BootContext };
