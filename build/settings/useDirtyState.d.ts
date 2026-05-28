export function useDirtyState(key: any, options?: {}): {
    isDirty: boolean;
    setDirty: (next: any) => void;
    confirmDiscard: () => boolean;
};
/** True when any registered consumer has flagged itself dirty. */
export function isAnyDirty(): boolean;
/**
 * Walk the registry; prompt once if any consumer is dirty. Returns
 * `true` when the navigation may proceed (no dirty state OR user
 * confirmed discard). The kit's `<NavigationGuardProvider>` consumes
 * this directly — `mountDashboard` wires it as the default guard so
 * tab-strip clicks + version-anchor clicks honor the dirty buffer
 * without consumer wiring.
 *
 * On accept, invokes each dirty key's `onDiscard` callback so stores
 * that own the actual edit buffer clear themselves.
 */
export function confirmDiscardAny(): boolean;
/**
 * Test helper — wipe the registry between tests so per-test side-effects
 * don't leak. Not exported from the public surface.
 *
 * @private
 */
export function __resetDirtyRegistry(): void;
export default useDirtyState;
