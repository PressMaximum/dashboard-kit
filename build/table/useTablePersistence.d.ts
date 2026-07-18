/**
 * SSR/quota-safe localStorage read of a persisted preference blob.
 *
 * @param {string} key Namespaced storage key.
 * @return {Object|null} Parsed preference blob, or null.
 */
export function readTablePrefs(key: string): any | null;
/**
 * SSR/quota-safe localStorage write; never throws.
 *
 * @param {string} key   Namespaced storage key.
 * @param {Object} value Preference blob to serialise.
 */
export function writeTablePrefs(key: string, value: any): void;
/**
 * Hook: seed table view state from (defaults + persisted) and auto-persist the
 * preference subset on every change. Returns the merged initial snapshot plus a
 * `persist(partial)` writer the component calls whenever a persisted field
 * changes.
 *
 * @param {string} key      Namespaced localStorage key ('' disables persistence).
 * @param {Object} defaults { sorting, columnVisibility, columnOrder, pageSize }.
 * @return {{ initial: Object, persist: Function }} Merged initial view + writer.
 */
export function useTablePersistence(key: string, defaults: any): {
    initial: any;
    persist: Function;
};
