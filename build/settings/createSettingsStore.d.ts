/**
 * @param {Object}   config
 * @param {string}   config.storeName   wp.data store key, e.g. `'customify/settings'`.
 * @param {string}   config.endpoint    Path passed verbatim to `fetch({ path, ... })`.
 * @param {Function} config.fetch       `({ path, method?, data? }) => Promise<unknown>`.
 *                                      Consumer-owned REST client (forbidden imports
 *                                      in the kit per SPEC §3.3).
 * @param {Object}   [config.seedSaved] Initial `saved` value so first-mount
 *                                      render is synchronous. Defaults to `null`.
 * @return {{ STORE_NAME: string, store: import('@wordpress/data').StoreDescriptor }}
 *         Store descriptor + the resolved store name, ready to `register()`.
 */
export function createSettingsStore({ storeName, endpoint, fetch, seedSaved, }?: {
    storeName: string;
    endpoint: string;
    fetch: Function;
    seedSaved?: any;
}): {
    STORE_NAME: string;
    store: import("@wordpress/data").StoreDescriptor;
};
export default createSettingsStore;
