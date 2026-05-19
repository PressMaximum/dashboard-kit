# PMDK Test Consumer

Internal WordPress plugin scaffold for end-to-end testing
`@pressmaximum/dashboard-kit` inside a real WordPress admin during kit
development. **Not for distribution.**

## Local link workflow

From the **kit repo root** (`/Users/kientrong/Studio/dashboard-kit`):

```bash
npm link
```

From **this directory** (`packages/test-consumer/`):

```bash
npm install
npm link @pressmaximum/dashboard-kit
```

Then symlink the plugin folder into a local WP install:

```bash
ln -s "$(pwd)" /path/to/wp-content/plugins/pmdk-test-consumer
```

Activate **PMDK Test Consumer** in WP admin. A `PMDK Test` menu item
appears with a placeholder mount node. Real mounting wires up in P1.

## Development cycle

1. Edit a file under `dashboard-kit/src/`.
2. From kit repo root: `npm run build` (or `npm run dev` for watch).
3. From this dir: `npm run start` (once wp-scripts compile step is added
   in P1).
4. Hard-refresh the WP admin tab.

## Why the symlinks

Using `npm link` lets the consumer resolve `@pressmaximum/dashboard-kit`
against the live kit checkout instead of npm. Edits to kit source are
visible to the consumer's build pipeline immediately, without an npm
publish + reinstall cycle.
