# Contributing to Parquet Visualizer

Thank you for your interest in contributing! This is a small, focused tool — contributions that stay true to its core goal (fast, private, local Parquet exploration) are most welcome.

## Ground Rules

- All processing must remain 100% client-side. No new network requests for user data.
- Keep dependencies minimal. Prefer MUI components over adding new UI libraries.
- No telemetry, analytics, or tracking of any kind.

## Getting Started

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/parquet-visualizer.git
cd parquet-visualizer

# 2. Use the right Node version
nvm use 24

# 3. Install dependencies
npm install

# 4. Start the dev server
npm run dev
```

## Development Workflow

```bash
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
npm run format       # Prettier (auto-fix)
npm run build        # Production build
```

The dev server opens at http://localhost:5173. You'll need a `.parquet` file to test with — sample files are available at [DuckDB's test data](https://duckdb.org/docs/data/parquet/overview) or generate one with Python:

```python
import pandas as pd
df = pd.DataFrame({"a": [1, 2, 3], "b": ["x", "y", "z"]})
df.to_parquet("sample.parquet")
```

## Project Structure

```
src/
  workers/duckdb.worker.ts   # DuckDB-WASM runs here (Web Worker)
  lib/
    duckdbClient.ts          # Typed wrapper around worker postMessage
    workerTypes.ts           # Shared message types
    storage.ts               # Theme persistence
  components/                # MUI-based React components
  App.tsx                    # Layout and state
  theme.ts                   # MUI theme (light/dark)
```

## Submitting a Pull Request

1. Create a branch: `git checkout -b feat/my-feature` or `fix/my-bug`
2. Make your changes and ensure all checks pass:
   ```bash
   npm run typecheck && npm run lint && npm run build
   ```
3. Commit with a clear message: `feat: add column search in schema view`
4. Push and open a PR against `main`
5. Fill out the PR template

## Commit Style

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|--------|---------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `docs:` | Documentation only |
| `refactor:` | Code changes with no behavior change |
| `chore:` | Tooling, deps, CI |

## Reporting Bugs

Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) template. Include your browser, OS, and a sample `.parquet` file if possible (or describe its schema).

## Questions

Open a [Discussion](../../discussions) rather than an issue for questions or ideas.
