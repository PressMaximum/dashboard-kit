/**
 * Read the boot payload off `window`. Safe under SSR / module-eval —
 * returns `{}` if `window` is undefined or the key isn't set.
 *
 * @param {string} bootGlobal Window key name, e.g. `'customifyDashboard'`.
 * @return {Record<string, unknown>} Boot payload (empty object on miss).
 */
export function readBoot(bootGlobal: string): Record<string, unknown>;
/**
 * Provider — wraps the dashboard tree with the resolved boot snapshot.
 * `mountDashboard` does this once at the top; everything below reads via
 * `useBoot()`.
 *
 * @param {Object}                    props
 * @param {Record<string, unknown>}   props.boot     Resolved boot payload.
 * @param {import('react').ReactNode} props.children
 */
export function BootProvider({ boot, children }: {
    boot: Record<string, unknown>;
    children: import("react").ReactNode;
}): import("react").JSX.Element;
/** Consume the boot snapshot from anywhere inside the dashboard tree. */
export function useBoot(): {};
export const BootContext: import("react").Context<{}>;
