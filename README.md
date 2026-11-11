# Drill Insights

A SvelteKit dashboard that explores 1.2 million phishing-drill results directly in the browser. There's no backend: DuckDB-WASM queries a Parquet file, and filters live in the URL so any view can be shared.

**All data is synthetic.** A seeded script generates it. It doesn't describe any real company or product.

## AI use

Claude Code wrote this codebase. I'm using the project to learn Svelte and studying how it works, so please don't read it as hand-written Svelte experience. If I rewrite parts of it myself, I'll list them here.

## How it works

- `scripts/generate-data.mjs` writes 1.2M rows to Parquet with a fixed seed.
- `src/lib/db.ts` starts DuckDB-WASM in a web worker, so queries don't block the UI, and reads the Parquet file over HTTP.
- `src/lib/filters.ts` parses the URL against allow-lists. `src/lib/queries.ts` builds SQL only from those parsed values.
- `src/lib/components/EventTable.svelte` is a virtualized table. It fetches rows by offset as you scroll, and maps scroll position onto the rows because browsers cap element height.

## Measurements

Taken on a Mac against a local production build, in fresh headless Chromium sessions.

| Metric | Result |
|---|---|
| Rows | 1,200,000 |
| Parquet file | 2.2 MB |
| Query engine download | 7.1 MB compressed, from jsDelivr |
| First dashboard ready | 1.8–2.4 s |
| Dashboard refresh after a filter change (10 changes) | 178–200 ms |
| axe violations on the default view | 0 |

A slower network or device will take longer. Core Web Vitals will be added once it's deployed.

## Run it

Needs Node 24.

```sh
npm install
npm run data
npm run dev
```

Checks: `npm run check`, `npm test`, `npm run test:e2e`.
