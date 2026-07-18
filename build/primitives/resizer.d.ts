/**
 * Headless in-flow inspector resizer (KIT-P3 slice 3).
 *
 * Port of the design-system reference resizer (~90 lines,
 * `[data-ds-resizable-inspector]` in `design-system.js`) onto the kit's
 * `.pmdk-inflow-*` chrome. Behavior contract (DESIGN-SYSTEM "Drawer versus
 * in-flow inspector"):
 *
 *   - pointer drag resizes; ArrowLeft/ArrowRight step by 16px; Home resets to
 *     the default width; End jumps to the max,
 *   - the separator exposes `aria-valuemin/-valuemax/-valuenow`,
 *   - the preference persists in namespaced localStorage (default key
 *     `dashboard-kit.inspector-width.v1`); a temporary narrow viewport clamps
 *     only the RENDERED width and never overwrites the stored preference,
 *   - storage failure never blocks the interaction,
 *   - `is-resizing` on the workspace suppresses transitions while dragging.
 *
 * DOM contract (chrome from `primitives/style.css` — inspector.css):
 *
 *   <div class="pmdk-inflow-workspace is-inspecting">   ← workspace root
 *     <div class="pmdk-inflow-main">…</div>
 *     <div class="pmdk-inflow-resizer" role="separator" tabindex="0"
 *          aria-orientation="vertical" aria-label="Resize panel">
 *       <span aria-hidden="true"></span>
 *     </div>
 *     <aside class="pmdk-inflow-inspector">…</aside>    ← pane
 *   </div>
 *
 * The rendered width is written to a CSS custom property on the workspace
 * (default `--pmdk-inflow-inspector-width`, the chrome variable whose initial
 * value falls back to the token-tier `--pmdk-inspector-width`) — the
 * stylesheet consumes it.
 *
 * @param {HTMLElement}          workspace               The workspace root carrying the CSS var.
 * @param {Object}               [options]
 * @param {HTMLElement}          [options.handle]        Separator (default: `.pmdk-inflow-resizer` inside workspace).
 * @param {HTMLElement}          [options.pane]          Resized pane (default: `.pmdk-inflow-inspector` inside workspace).
 * @param {string}               [options.cssVar]        CSS custom property to write (default `--pmdk-inflow-inspector-width`).
 * @param {string}               [options.storageKey]    localStorage key ('' disables persistence; default `dashboard-kit.inspector-width.v1`).
 * @param {number}               [options.minWidth]      Pane minimum (default 320).
 * @param {number}               [options.maxWidth]      Pane hard maximum (default 520).
 * @param {number}               [options.mainMinWidth]  Main-content minimum preserved while resizing (default 360).
 * @param {number}               [options.defaultWidth]  Default/Home width (default 360).
 * @param {number}               [options.step]          Keyboard step (default 16).
 * @param {(width:number)=>void} [options.onWidthChange] Rendered-width observer.
 * @return {{setWidth:Function, getWidth:Function, refresh:Function, destroy:Function}} Resizer controller.
 */
export function createInspectorResizer(workspace: HTMLElement, options?: {
    handle?: HTMLElement;
    pane?: HTMLElement;
    cssVar?: string;
    storageKey?: string;
    minWidth?: number;
    maxWidth?: number;
    mainMinWidth?: number;
    defaultWidth?: number;
    step?: number;
    onWidthChange?: (width: number) => void;
}): {
    setWidth: Function;
    getWidth: Function;
    refresh: Function;
    destroy: Function;
};
