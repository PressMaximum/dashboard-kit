/**
 * @param {Object}   config
 * @param {string}   config.storeName wp.data store key, e.g. `'customify/onboarding'`.
 * @param {string}   config.endpoint  REST path. GET loads, PATCH persists deltas.
 * @param {Function} config.fetch     `({ path, method?, data? }) => Promise<unknown>`.
 * @return {{ STORE_NAME: string, store: import('@wordpress/data').StoreDescriptor }}
 *         Store descriptor + the resolved name, ready to `register()`.
 */
export function createOnboardingStore({ storeName, endpoint, fetch, }?: {
    storeName: string;
    endpoint: string;
    fetch: Function;
}): {
    STORE_NAME: string;
    store: import("@wordpress/data").StoreDescriptor;
};
export default createOnboardingStore;
