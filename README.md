# Parquet Visualizer

[![CI](https://github.com/uzairchhapra/parquet-visualizer/actions/workflows/ci.yml/badge.svg)](https://github.com/uzairchhapra/parquet-visualizer/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/uzairchhapra/parquet-visualizer)](https://github.com/uzairchhapra/parquet-visualizer/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node >=24](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](package.json)
[![Powered by DuckDB](https://img.shields.io/badge/powered%20by-DuckDB%20WASM-f0c40f?logo=duckdb&logoColor=black)](https://duckdb.org/docs/api/wasm/overview)
[![100% client-side](https://img.shields.io/badge/privacy-100%25%20client--side-blue)](#privacy)
[![Live Demo](https://img.shields.io/badge/demo-parquet.chhapra.cloud-d4fa00?labelColor=121212)](https://parquet.chhapra.cloud)

A privacy-first, 100% client-side Parquet file explorer powered by DuckDB-WASM. No backend, no uploads, no telemetry.

**[parquet.chhapra.cloud](https://parquet.chhapra.cloud)** — live demo, no install needed.

## Features

- Drag-and-drop Parquet file loading
- Schema inspection with column types and nullability
- Data preview with virtualized table and pagination
- Progressive column profiling (null %, distinct count, min/max, top values)
- SQL query editor with history
- Dark/light theme with Material Design
- Fully offline-capable after initial load

## Privacy

All data is processed locally in your browser using DuckDB-WASM. No files, queries, schemas, or results are ever transmitted to any server. No analytics, no telemetry. **Your data never leaves your device.**

## Quick Start

```bash
nvm use 24
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Build

```bash
nvm use 24
npm run build
```

Static assets are output to `dist/`. Serve with any static file server.

## Credits

Powered by [DuckDB-WASM](https://duckdb.org/docs/api/wasm/overview) — an in-process SQL OLAP database compiled to WebAssembly, enabling full SQL queries directly in the browser without any server.

## License

MIT — see [LICENSE](LICENSE).

All runtime dependencies (React, MUI, DuckDB-WASM, Emotion, Vite) are also MIT licensed.
