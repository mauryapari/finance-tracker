# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (http://localhost:3000)
npm run build      # production build → dist/ + .netlify/functions-internal/
npm run preview    # preview the production build locally
npm run generate   # static site generation (not used for this project)
```

There are no tests or linters configured.

## Architecture

**Nuxt 4 SPA** (`ssr: false`) using the `app/` directory layout (`future.compatibilityVersion: 4`). All page/component/composable/store code lives under `app/`. The server route (`server/api/`) stays at the project root and is compiled by Nitro to a Netlify Function via `nitro.preset = 'netlify'`.

### Data flow

All data lives in a single Pinia store (`app/stores/data.js`) that mirrors itself to `localStorage` under the key `finance_tracker_data`. The persisted shape is:

```js
{ version: 1, tables: { openPositions, closedPositions, etfs, closedEtfs, commodityEtfs, closedCommodityEtfs, cagrEntries, commodityCagrEntries } }
```

**Stored fields are user-entered only.** Every derived number (% gain, days, annual gain, target value, drop from peak, etc.) is calculated at render time by functions from `app/composables/useCalculations.js` and never written to storage.

One exception: `store.updateCmp()` mutates CMP in memory **without** calling `saveToStorage()`. This keeps live prices transient — a page refresh resets CMPs to whatever was last saved.

### Two table interaction patterns

- **Pattern A — inline editing** (`PositionsTable.vue`): used for Open Positions and Closed Positions. PrimeVue `DataTable` with `editMode="row"` — the built-in pencil/✓/✕ row editor handles enter/exit. Delete uses a PrimeVue `Dialog`.
- **Pattern B — modal editing** (`TableWithModal.vue`): used for ETFs, CAGR, and Commodity tabs. PrimeVue `DataTable` (display-only) plus an inline `Dialog` for add/edit and another `Dialog` for delete confirm. Column definitions and form field configs are co-located inside `TableWithModal.vue` in the `COLUMNS` and `FIELD_CONFIGS` maps keyed by `tableKey`.

### CMP polling

`app/composables/useCmpPoller.js` is called once from `app/app.vue`. It polls every 5 minutes via `$fetch('/api/stock-price?symbol=...')` for all `openPositions`, `etfs`, and `commodityEtfs`. Polling pauses when `document.visibilityState === 'hidden'` and resumes on `visibilitychange`. Yahoo Finance symbol convention: NSE stocks get `.NS` appended, BSE stocks get `.BO`. If the symbol already contains a `.`, it is used as-is.

### Server route

`server/api/stock-price.get.js` wraps `yahoo-finance2` and returns `{ price: number }`. It is the only server-side code; everything else runs in the browser.

### UI stack

PrimeVue 4 (Aura theme) + Tailwind CSS. PrimeVue components (`DataTable`, `Column`, `Dialog`, `Button`, `InputText`, `InputNumber`, `Select`) are auto-imported by `@primevue/nuxt-module`. Tailwind is auto-configured by `@nuxtjs/tailwindcss`. No separate `tailwind.config.js` is needed.

## Adding a new table

1. Add the table key with `[]` to `initialState().tables` in `app/stores/data.js` and bump `CURRENT_VERSION`.
2. Add a migration branch in `loadFromStorage()` to backfill the new key for existing localStorage data.
3. If it uses inline editing, add column config inside `PositionsTable.vue`; otherwise add entries to `COLUMNS` and `FIELD_CONFIGS` in `TableWithModal.vue`.
4. Add a tab to the `tabs` array in `TabNav.vue` and a corresponding `v-else-if` branch in `app/pages/index.vue`.

## Deployment

Push to GitHub → import on Netlify. Build command: `npm run build`, publish directory: `dist`. The `netlify.toml` and `nitro.preset = 'netlify'` handle everything else — no environment variables are required.
