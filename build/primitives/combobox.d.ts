/**
 * Headless combobox controller (KIT-P3 slice 1).
 *
 * Framework-agnostic: it attaches interaction behavior to existing markup and
 * never renders React. Ported from the mockup design system's relationship
 * picker (`design-system.js` `[data-ds-relationship-picker]` — the behavior
 * contract source) with the same interaction model:
 *
 *   - open on focus / pointerdown / typing / Enter / Arrow keys,
 *   - an option is ALWAYS active while open (the selected one, else the first
 *     visible), `aria-activedescendant` + `.is-active` kept in sync,
 *   - ArrowDown/ArrowUp move with wrap-around (modulo, no clamping),
 *   - pointerenter on an option makes it active (hover + keyboard in sync),
 *   - the input text is selected (`input.select()`) when the picker opens,
 *   - filter state resets when the picker closes,
 *   - outside pointerdown AND outside focusin dismiss.
 *
 * Documented deviations from that source (reasons, not drift):
 *   - Escape closes but KEEPS focus on the input — the source blurs, a
 *     gallery-demo shortcut; the ARIA APG combobox pattern keeps focus.
 *   - A typed exact match (case-insensitive) commits on dismiss, per the
 *     evolved booking-form combobox in `plugin-dashboard.js` — dropping a
 *     fully typed valid value on outside-click would be hostile.
 *   - Home/End jump to the first/last visible option; Tab closes with
 *     restore. Additive keyboard affordances, covered by tests.
 *
 * Markup contract (styled by `primitives/style.css` — `combobox.css`):
 *
 *   <div class="pmdk-combobox" data-combobox data-selected-value="">
 *     <label class="pmdk-compact-field pmdk-combobox-field">
 *       <input data-combobox-input role="combobox" aria-autocomplete="list"
 *              aria-expanded="false" aria-controls="listId" placeholder=" ">
 *       <span class="pmdk-compact-label">Label</span>
 *       <span class="pmdk-field-end-icon">…idle + active icons…</span>
 *     </label>
 *     <div class="pmdk-combobox-popover" id="listId" role="listbox" hidden>
 *       <button data-combobox-option="Value" role="option" aria-selected="false">Value</button>
 *       …
 *       <p data-combobox-empty hidden>No results</p>
 *     </div>
 *   </div>
 *
 * `buildComboboxMarkup()` below returns exactly this string so consumers need
 * not hand-write the ARIA scaffold.
 *
 * @param {HTMLElement}                                   root               The `.pmdk-combobox` element.
 * @param {Object}                                        [options]
 * @param {(value:string, option:HTMLElement|null)=>void} [options.onChange]
 *                                                                           Called after a committed selection change (value may be '').
 * @param {(option:HTMLElement, query:string)=>boolean}   [options.filter]
 *                                                                           Custom match predicate; defaults to substring over option text +
 *                                                                           `data-combobox-keywords`.
 * @return {{open:Function, close:Function, setOptions:Function, getValue:Function, refresh:Function, destroy:Function}} Combobox controller.
 */
export function createCombobox(root: HTMLElement, options?: {
    onChange?: (value: string, option: HTMLElement | null) => void;
    filter?: (option: HTMLElement, query: string) => boolean;
}): {
    open: Function;
    close: Function;
    setOptions: Function;
    getValue: Function;
    refresh: Function;
    destroy: Function;
};
/**
 * Build the ARIA combobox markup string for a set of string options — so
 * consumers get a correct scaffold without hand-writing it. Values are escaped.
 *
 * @param {Object}                config
 * @param {string}                config.name         Input name.
 * @param {string}                config.label        Floating label text.
 * @param {string[]}              config.options      Option values.
 * @param {string}                [config.selected]   Pre-selected value.
 * @param {string}                [config.listId]     Popover id (defaults to `${name}-list`).
 * @param {(name:string)=>string} [config.idleIcon]   Idle chevron HTML.
 * @param {(name:string)=>string} [config.activeIcon] Active search-icon HTML.
 * @return {string} HTML string.
 */
export function buildComboboxMarkup({ name, label, options, selected, listId, idleIcon, activeIcon, }: {
    name: string;
    label: string;
    options: string[];
    selected?: string;
    listId?: string;
    idleIcon?: (name: string) => string;
    activeIcon?: (name: string) => string;
}): string;
