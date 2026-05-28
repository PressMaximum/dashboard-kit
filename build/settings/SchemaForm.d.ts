/**
 * Stable id for the panel heading element so external CardHeader copy
 * can reference it via `aria-labelledby`. Consumers that render their
 * own heading outside the form pass the same id to keep the AT chain.
 *
 * @param {string} id Panel id, e.g. `'performance'`.
 * @return {string} DOM id, e.g. `'pmdk-settings-panel-performance'`.
 */
export function panelHeadingId(id: string): string;
export default function SchemaForm({ panel, values, onFieldChange, fieldTypes, }: {
    panel: any;
    values: any;
    onFieldChange: any;
    fieldTypes: any;
}): import("react").JSX.Element;
