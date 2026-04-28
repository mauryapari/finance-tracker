# Finance Tracker

A personal finance tracker for managing Indian stock market positions (NSE/BSE), ETFs, commodity ETFs, CAGR analysis, and monthly budget planning. Built as a Nuxt 4 SPA deployed on Netlify.

## Features

- **Positions** — track open and closed stock/ETF/commodity ETF holdings with live CMP polling (Yahoo Finance, every 5 minutes)
- **Peak price tracking** — historical peak price since buy date with drop-from-peak percentage
- **Target alerts** — browser notification when CMP crosses your target price
- **CAGR analysis** — derived CAGR entries computed from all buy/sell trade history
- **Budget planning** — monthly investment tracking, gap analysis (planned vs actual), and broker cash flow history
- **Dark mode** — persisted per-device
- **Data sync** — optional Upstash Redis sync; falls back to `localStorage` if not configured
- **Demo mode** — try the app without entering real data

## Setup

```bash
npm install
```

Copy the environment file and fill in values (all optional — see below):

```bash
cp .env.example .env
```

```
NUXT_UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
NUXT_UPSTASH_REDIS_REST_TOKEN=your-token-here
AUTH_PASSWORD=your_secure_password
AUTH_SECRET=random_hex_string_32_chars_or_more
```

- Without the Upstash vars, data stays in `localStorage` only.
- Without `AUTH_PASSWORD` / `AUTH_SECRET`, login is disabled and the app runs in local-only mode.

## Development

```bash
npm run dev        # http://localhost:3010
npm run lint       # ESLint + Stylelint
npm run lint:fix   # auto-fix lint issues
```

## Testing

```bash
npm run test           # run once
npm run test:watch     # watch mode
npm run test:coverage  # coverage report
```

## Production build

```bash
npm run build    # → dist/ + .netlify/functions-internal/
npm run preview  # preview the production build locally
```

## Deployment

Push to GitHub and import on Netlify. The `netlify.toml` configures the build automatically:

- Build command: `npm run build`
- Publish directory: `dist`

For Redis sync and password auth, set the four env vars in the Netlify UI under **Site settings → Environment variables**.

## Architecture overview

| Layer | Tech |
|---|---|
| Framework | Nuxt 4 SPA (`ssr: false`) |
| UI | PrimeVue 4 (Aura) + Tailwind CSS |
| State | Pinia (`app/stores/data.js`) |
| Server routes | Nitro → Netlify Functions |
| Stock data | `yahoo-finance2` |
| Database | Upstash Redis (optional) |
| Tests | Vitest + `@vue/test-utils` + `happy-dom` |

All user data is stored locally in `localStorage` by default. Enabling Upstash Redis adds cross-device sync protected by HMAC-SHA256 token authentication.
