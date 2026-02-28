# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-27

### Added
- Initial release
- Drag-and-drop `.parquet` file loading via DuckDB-WASM in a Web Worker
- **Preview tab**: virtualized DataGrid showing first 200 rows
- **Schema tab**: column names, types, and nullability
- **Profile tab**: progressive per-column profiling (null %, distinct count, min/max, top 20 values)
- **Query tab**: SQL editor with Ctrl+Enter shortcut, query history, and sample queries
- Dark/light theme toggle with persistence in `localStorage`
- Dark theme with neon green accent (`#39ff14`) on near-black surfaces
- "Local-only" badge in AppBar — no data ever leaves the browser
- File name and size shown in AppBar with one-click reset
- Full-page dropzone when no file is loaded
- Nixpacks configuration for zero-config deployment via Coolify
- MIT license
