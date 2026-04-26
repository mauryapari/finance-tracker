# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # start dev server (http://localhost:3000)
npm run build          # production build → dist/ + .netlify/functions-internal/
npm run preview        # preview the production build locally
npm run test           # run Vitest tests once
npm run test:watch     # Vitest in watch mode
npm run test:coverage  # Vitest with coverage report
npm run lint           # ESLint + Stylelint check
npm run lint:fix       # auto-fix lint issues
```

Tests live in `tests/` and use `happy-dom`. Coverage is scoped to `app/composables/` and `app/stores/`.

## Architecture

**Nuxt 4 SPA** (`ssr: false`) using the `app/` directory layout (`future.compatibilityVersion: 4`). All page/component/composable/store code lives under `app/`. The server routes (`server/api/`) stay at the project root and are compiled by Nitro to Netlify Functions via `nitro.preset = 'netlify'`.

### Data flow

All data lives in a single Pinia store (`app/stores/data.js`) that mirrors itself to `localStorage` under the key `finance_tracker_data`. The persisted shape is:

```js
{ version: 1, tables: { openPositions, closedPositions, etfs, closedEtfs, commodityEtfs, closedCommodityEtfs, cagrEntries, commodityCagrEntries } }
```

**Stored fields are user-entered only.** Every derived number (% gain, days, annual gain, target value, drop from peak, etc.) is calculated at render time by functions from `app/composables/useCalculations.js` and never written to storage.

Two exceptions to the transient rule:
- `store.updateCmp()` mutates CMP in memory **without** calling `saveToStorage()` — live prices reset on refresh.
- `store.updatePeak()` **does** call `saveToStorage()` — peak prices are persisted.

### Table config hub

`app/utils/tableConfigs.js` is the single source of truth for all table definitions. It exports:

- **`COLUMNS`** — display column defs per `tableKey` (field, header, formatting function, frozen columns)
- **`FIELD_CONFIGS`** — editable field specs per `tableKey` (type: `text | number | decimal | date | select`)
- **`BLANK_ROWS`** — template objects for new row creation
- **`ENRICHMENT`** — per-table row enrichment functions (compute `pctGain`, `annualGainPct`, `days`, `targetHit` at render time)
- **`CLOSE_TARGET_KEY`** — maps open → closed table keys (e.g., `openPositions → closedPositions`)
- **`CLOSE_FIELD_MAP`** — fields copied during a close operation (e.g., `buyPrice → buyRate`)

When a row is "closed" in `Table.vue`, the close operation reads `CLOSE_TARGET_KEY` to find the destination table and `CLOSE_FIELD_MAP` to transform field names before inserting into the closed table.

### Table editing pattern

All tables use a single `Table.vue` component with a `tableKey` prop. Column/field config is looked up from `tableConfigs.js` at runtime. The component supports:

- **Inline row editing** — PrimeVue `DataTable` with `editMode="row"` (pencil/✓/✕ controls)
- **Delete dialog** — PrimeVue `Dialog` for delete confirmation
- **Close action** — moves a row from open to closed table using the config maps above

Composables that power the table: `useTableEditing.js` (tracks which rows are in edit mode) and `useTableDelete.js` (delete dialog state).

### CMP polling

`app/composables/useCmpPoller.js` is called once from `app/app.vue`. On mount it:
1. Fetches historical peak prices via `GET /api/stock-peak` for all open positions, ETFs, and commodity ETFs.
2. Starts a 5-minute polling loop via `GET /api/stock-price` for live CMPs.

Polling pauses when `document.visibilityState === 'hidden'` and resumes on `visibilitychange`. When a CMP crosses the user's target price, the poller fires a browser Notification API alert.

Yahoo Finance symbol convention: NSE stocks get `.NS` appended, BSE stocks get `.BO`. If the symbol already contains a `.`, it is used as-is.

### CAGR entries

`app/composables/useDerivedCagrEntries.js` computes virtual CAGR rows from all buy/sell trades by date (it does not read `cagrEntries` or `commodityCagrEntries` from the store — those are separate manual entries). The `cagr` and `commodity-cagr` pages display only read-only DataTables showing these derived entries.

### Server routes

| Route | Purpose | Params | Response |
|---|---|---|---|
| `GET /api/stock-price` | Real-time quote | `symbol` | `{ price: number }` |
| `GET /api/stock-peak` | Historical peak price since buy date | `symbol`, `from` | `{ peak: number \| null }` |

Both wrap `yahoo-finance2`. No environment variables are required.

### UI stack

PrimeVue 4 (Aura theme) + Tailwind CSS. PrimeVue components (`DataTable`, `Column`, `Dialog`, `Button`, `InputText`, `InputNumber`, `Select`) are auto-imported by `@primevue/nuxt-module`. Tailwind is auto-configured by `@nuxtjs/tailwindcss` — no separate `tailwind.config.js` needed. Dark mode uses Tailwind's `class` strategy, toggled by `useTheme.js` which persists the preference to `localStorage`.

## Adding a new table

1. Add the table key with `[]` to `initialState().tables` in `app/stores/data.js` and bump `CURRENT_VERSION`.
2. Add a migration branch in `loadFromStorage()` to backfill the new key for existing localStorage data.
3. Add entries for the new key to `COLUMNS`, `FIELD_CONFIGS`, `BLANK_ROWS`, and `ENRICHMENT` in `app/utils/tableConfigs.js`. If the table supports closing positions, also add to `CLOSE_TARGET_KEY` and `CLOSE_FIELD_MAP`.
4. Create a page at `app/pages/<name>.vue` that renders `<Table tableKey="<key>" title="..." />`.
5. Add a tab to the `tabs` array in `app/components/TabNav.vue`.

## Deployment

Push to GitHub → import on Netlify. Build command: `npm run build`, publish directory: `dist`. The `netlify.toml` and `nitro.preset = 'netlify'` handle everything else — no environment variables are required.

## Testing

Tests live in `tests/` and use Vitest + `@vue/test-utils` with `happy-dom`.

### Coverage requirement

**Every component in `app/components/` must have a corresponding test file in `tests/components/`.** Every composable in `app/composables/` and every store in `app/stores/` must have a test in `tests/`. When you add or modify a component, composable, or store, always write or update the matching test file before considering the task done.

### What to test per file type

**Components** (`tests/components/<Name>.test.js`):
- Renders without error (snapshot or existence check)
- Props drive the correct output (pass different `tableKey`, title, etc.)
- User interactions: clicking Add/Edit/Delete/Close buttons triggers the right store mutations or emits
- Conditional rendering: empty-state, loading, error states
- Slot content when applicable

**Composables** (`tests/<composable>.test.js`):
- Return shape matches expected interface
- Reactive state updates correctly after calling exposed methods
- Edge cases: empty arrays, zero values, NaN guards

**Store** (`tests/data.store.test.js`):
- `initialState()` shape is correct
- Each action mutates state as expected
- `saveToStorage` / `loadFromStorage` round-trip produces identical state
- Migration branches in `loadFromStorage` upgrade old versions without data loss

### Test file conventions

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

// Always create a fresh pinia per test to avoid state leakage
const pinia = createTestingPinia({ createSpy: vi.fn })
```

- Use `createTestingPinia` for any component that touches the data store.
- Mock `fetch` / server routes with `vi.stubGlobal('fetch', ...)` — never hit the real network in tests.
- Prefer `wrapper.find('[data-testid="..."]')` selectors over CSS class selectors so tests survive style changes.
- Add `data-testid` attributes to interactive elements (buttons, inputs, dialogs) when writing new components.

### Running tests

```bash
npm run test             # run once
npm run test:watch       # watch mode during development
npm run test:coverage    # ensure coverage stays green
```

Coverage is scoped to `app/composables/` and `app/stores/`. Components are tested functionally; 100 % line coverage is not required but every component file must have at least one test file.

## Accessibility

This project targets WCAG 2.1 AA. Apply the following rules whenever writing or modifying components.

### Semantic HTML

- Use native elements (`<button>`, `<a>`, `<nav>`, `<main>`, `<section>`, `<table>`) instead of `<div>`/`<span>` with click handlers.
- Page-level landmark regions: wrap the main content in `<main>`, navigation tabs in `<nav>`.
- Headings must follow a logical hierarchy (one `<h1>` per page, then `<h2>`, `<h3>` — never skip levels).

### ARIA

- Every icon-only button must have `aria-label` describing the action (e.g., `aria-label="Delete row"`).
- Dialogs: PrimeVue `Dialog` emits the correct `role="dialog"` and `aria-modal="true"` automatically — do not override these. Always set the `:header` prop so the dialog has an accessible title.
- Live price updates (CMP polling): wrap the updating cell in `aria-live="polite"` so screen readers announce changes without interrupting the user.
- Tables rendered by `Table.vue` use PrimeVue `DataTable` which outputs `<table>` with proper `<thead>`/`<tbody>` — preserve this; do not replace with CSS grids.
- Status badges (gain/loss colors): never convey meaning by color alone — include a text label or `aria-label` (e.g., `+12.3%` alongside a green badge).

### Keyboard navigation

- Every interactive element must be reachable and operable via keyboard alone.
- Edit/Delete/Close row actions must be focusable and triggered by `Enter`/`Space`.
- Dialogs must trap focus when open and return focus to the trigger element on close. PrimeVue `Dialog` handles this automatically — do not break it with custom `tabindex` or `pointer-events` overrides.
- Tab order must follow visual reading order; avoid positive `tabindex` values.

### Color and contrast

- Text contrast ratio must be ≥ 4.5 : 1 against its background (≥ 3 : 1 for large text / UI components).
- Dark mode must independently meet contrast requirements — test both themes.
- Do not use color as the only indicator for gain (green) vs loss (red) — add `▲`/`▼` icons or `aria-label` text.

### Forms and inputs

- Every `InputText` / `InputNumber` / `Select` inside an edit row must have an associated `<label>` (or `aria-label` / `aria-labelledby`) matching the column header.
- Required fields must carry `aria-required="true"` and surface validation errors in an `aria-describedby` message, not only via border color.

### Motion

- Respect `prefers-reduced-motion`: any CSS transition or animation must be wrapped with `@media (prefers-reduced-motion: reduce) { ... }` to disable or reduce it.

### Automated checks

Run Lighthouse accessibility audit (`npm run dev` → DevTools → Lighthouse → Accessibility) before shipping UI changes. Aim for a score ≥ 90. Add `axe-core` via `vitest-axe` to component tests for any new interactive component:

```js
import { axe } from 'vitest-axe'
it('has no axe violations', async () => {
  const { container } = render(MyComponent)
  expect(await axe(container)).toHaveNoViolations()
})
```
