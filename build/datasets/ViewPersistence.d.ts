export namespace ViewPersistence {
    export { create };
}
export default ViewPersistence;
/**
 * @param {Object} config
 * @param {string} config.storageKey  localStorage key to read/write under.
 * @param {Object} config.defaultView View shape returned when storage is
 *                                    empty / unreadable / corrupt.
 * @return {{ load: () => Object, save: (next: Object) => void }} Storage
 *         adapter with `load()` + `save(next)` methods.
 */
declare function create({ storageKey, defaultView }?: {
    storageKey: string;
    defaultView: any;
}): {
    load: () => any;
    save: (next: any) => void;
};
