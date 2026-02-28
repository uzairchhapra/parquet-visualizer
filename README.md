# Parquet Visualizer

A privacy-first, 100% client-side Parquet file explorer powered by DuckDB-WASM. No backend, no uploads, no telemetry.

## Features

- Drag-and-drop Parquet file loading
- Schema inspection with column types and nullability
- Data preview with virtualized table and pagination
- Progressive column profiling (null %, distinct count, min/max, top values)
- SQL query editor with history
- Dark/light theme with Material Design
- Fully offline-capable after initial load

## Quick Start

```bash
nvm use 20
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Build

```bash
npm run build
```

Static assets are output to `dist/`. Serve with any static file server.

## Privacy Statement

Parquet Visualizer processes all data entirely within your browser using WebAssembly. No files, queries, schemas, or results are ever transmitted to any server. There is no backend, no analytics, and no telemetry. Your data never leaves your device.

## License

MIT — see [LICENSE](LICENSE).

All runtime dependencies (React, MUI, DuckDB-WASM, Emotion, Vite) are also MIT licensed.
