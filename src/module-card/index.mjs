/**
 * Public entry `@pressmaximum/dashboard-kit/module-card` — the shared
 * module/integration card (KIT-P3, K-018).
 *
 * Own sub-entry (mirrors `./table`) so the `./primitives` entry stays
 * React-free per its contract: this chunk imports React (external), the
 * headless primitives chunk must not. Zero third-party deps. Chrome from
 * `@pressmaximum/dashboard-kit/primitives/style.css` (module-card.css).
 */

export { PMDKModuleCard } from './PMDKModuleCard.jsx';
