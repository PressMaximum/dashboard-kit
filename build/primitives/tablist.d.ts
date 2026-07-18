/**
 * Headless tablist controller (KIT-P3 slice 4).
 *
 * Port of the ~25-line design-system tablist (`[data-ds-tablist]` in
 * `design-system.js`) for the `.pmdk-section-tabs` chrome. Behavior contract
 * (DESIGN-SYSTEM "Tabs"): Left/Right arrows move with wrap-around, Home/End
 * jump to the ends, activation follows focus, and `aria-selected` stays in
 * sync. Panel visibility is the consumer's job (headless — wire it in
 * `onChange`), matching the source.
 *
 * DOM contract:
 *
 *   <div class="pmdk-section-tabs" role="tablist" data-tablist>
 *     <button role="tab" aria-selected="true">Upcoming <span>3</span></button>
 *     <button role="tab" aria-selected="false">Past</button>
 *   </div>
 *
 * @param {HTMLElement}                           root               The tablist element containing `[role="tab"]`s.
 * @param {Object}                                [options]
 * @param {(tab:HTMLElement, index:number)=>void} [options.onChange] Called on activation.
 * @return {{activate:Function, getActive:Function, destroy:Function}} Tablist controller.
 */
export function createTablist(root: HTMLElement, options?: {
    onChange?: (tab: HTMLElement, index: number) => void;
}): {
    activate: Function;
    getActive: Function;
    destroy: Function;
};
