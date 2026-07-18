/**
 * Headless menu/popover controller (KIT-P3 slice 3 — the G4 primitive).
 *
 * Framework-agnostic port of the interaction model the Aponto BookingsTable
 * implements per-component (row-action kebab, status picker, table actions
 * menu): trigger toggling with `aria-expanded`, keyboard-open focusing the
 * first item, roving menu keys, Escape-with-focus-return, outside-pointerdown
 * dismiss and open-direction handling. Shipping it once means a product table
 * (B4 swap) doesn't re-write ~200 lines of popover behavior per menu.
 *
 * DOM contract (chrome from `primitives/style.css` — status/column-manager/
 * toolbar popover families):
 *
 *   <div class="…" data-menu>
 *     <button data-menu-trigger aria-haspopup="menu" aria-expanded="false">…</button>
 *     <div class="pmdk-row-action-menu" role="menu" hidden>
 *       <button role="menuitem">…</button>
 *       <div role="separator"></div>
 *       <button role="menuitemradio" aria-checked="false">…</button>
 *     </div>
 *   </div>
 *
 * Behaviors (sources: BookingsTable.jsx BookingRowActions / StatusControl /
 * BookingActionsMenu + menuRovingKeydown):
 *   - trigger click toggles; `event.detail === 0` (keyboard) marks the open
 *     so the first enabled item receives focus on the next frame,
 *   - ArrowDown/ArrowUp/Home/End rove `[role=menuitem]`/`[role=menuitemradio]`,
 *   - Escape closes and returns focus to the trigger,
 *   - pointerdown outside the root closes (no focus steal),
 *   - item activation calls `onSelect` then closes; keyboard activation
 *     returns focus to the trigger (pointer activation leaves focus alone),
 *   - `position: 'anchored'` (default) toggles `.opens-up` on the root when
 *     the space below the trigger can't fit the popover (CSS anchors it),
 *   - `position: 'fixed'` ports the floating row-action mode: viewport-clamped
 *     `left/top` coordinates, `.is-floating` class, tracking scroll + resize.
 *
 * @param {HTMLElement}                           root                    The element containing trigger + popover.
 * @param {Object}                                [options]
 * @param {(item:HTMLElement, event:Event)=>void} [options.onSelect]      Item activation.
 * @param {(open:boolean)=>void}                  [options.onOpenChange]  Open-state observer.
 * @param {'anchored'|'fixed'}                    [options.position]      Positioning mode.
 * @param {number}                                [options.viewportInset] Clamp inset for fixed mode (default 8).
 * @return {{open:Function, close:Function, toggle:Function, isOpen:Function, destroy:Function}} Menu controller.
 */
export function createMenu(root: HTMLElement, options?: {
    onSelect?: (item: HTMLElement, event: Event) => void;
    onOpenChange?: (open: boolean) => void;
    position?: "anchored" | "fixed";
    viewportInset?: number;
}): {
    open: Function;
    close: Function;
    toggle: Function;
    isOpen: Function;
    destroy: Function;
};
