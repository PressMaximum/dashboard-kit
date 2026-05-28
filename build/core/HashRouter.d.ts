export function readHash(fallback?: string): string;
export function navigate(hash: any): void;
/**
 * Subscribe to `hashchange` and return the current hash.
 *
 * @param {string} [initialRoute='#welcome'] Default returned when no hash is set.
 */
export function useHash(initialRoute?: string): string;
/**
 * Match the current hash against a route table. Returns the matched
 * entry + extracted `:param` values, or `null` when nothing matches.
 *
 * Pattern: `#conditions/:id` matches `#conditions/42` with
 * `params: { id: '42' }`. Static segments take precedence over params.
 *
 * @param {string}                  hash   Current `#...` hash.
 * @param {Record<string, unknown>} routes Hash → route-entry table.
 * @return {{ route: string, entry: unknown, params: Record<string, string> } | null}
 *         Matched entry + params, or `null` when no pattern matches.
 */
export function matchRoute(hash: string, routes: Record<string, unknown>): {
    route: string;
    entry: unknown;
    params: Record<string, string>;
} | null;
/**
 * High-level hook consumed by `DashboardShell`. Returns the resolved
 * route or falls back to `initialRoute` when the hash is unknown / empty.
 *
 * @param {Object} routes                    Hash → route-entry table.
 * @param {string} [initialRoute='#welcome'] Default route when nothing matches.
 */
export function useRoute(routes: any, initialRoute?: string): {
    route: string;
    entry: unknown;
    params: Record<string, string>;
};
/**
 * Top-level tab id for highlighting the tab strip.
 *
 *   activeTabId( '#conditions/42' ) === 'conditions'
 *
 * @param {string} route Hash route, with or without leading `#`.
 * @return {string} First path segment (the tab id), or `''` when empty.
 */
export function activeTabId(route: string): string;
/**
 * Wrap the dashboard tree with a navigation guard so dirty buffers,
 * unsaved edits, or any other "can leave this route" predicate can
 * intercept tab / link clicks. The guard receives no arguments and
 * returns `true` to allow nav, `false` to cancel.
 *
 * @param {Object}                    props
 * @param {() => boolean}             props.guard    Predicate, returns `true` to allow.
 * @param {import('react').ReactNode} props.children
 */
export function NavigationGuardProvider({ guard, children }: {
    guard: () => boolean;
    children: import("react").ReactNode;
}): import("react").JSX.Element;
/**
 * Click handler factory for tab strip / Link-style components.
 * `onClick={ useNavigate()( '#welcome' ) }` is the call shape — curried
 * to match the call sites extracted from Blocksify Free's App.js and
 * SubNav. Calls `preventDefault` so the browser doesn't scroll to a
 * named anchor; consults the navigation guard before navigating.
 */
export function useNavigate(): (hash: any) => (event: any) => void;
export const NavigationGuardContext: import("react").Context<() => boolean>;
