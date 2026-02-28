# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| latest (main) | ✅ |

## Threat Model

Parquet Visualizer is a **fully client-side, static web application**. There is no server, no database, no user accounts, and no network transmission of user data. The attack surface is limited to:

- **Malicious `.parquet` files**: DuckDB-WASM parses files in a sandboxed Web Worker. A crafted file could potentially exploit a DuckDB parsing bug. Keep DuckDB-WASM updated.
- **Supply chain**: NPM dependencies (React, MUI, DuckDB-WASM). Dependency pinning and `npm audit` help mitigate this.
- **XSS via query results**: Column names and values are rendered in React (which escapes by default). Avoid `dangerouslySetInnerHTML`.
- **CSP**: Deploy with the recommended Content-Security-Policy (see CLAUDE.md). This limits what injected scripts can do.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report them via GitHub's private [Security Advisories](../../security/advisories/new) feature (Advisories → Report a vulnerability).

Include:
- Description of the vulnerability and potential impact
- Steps to reproduce (with a minimal `.parquet` file if applicable)
- Any suggested fix

You can expect an acknowledgement within 72 hours and a resolution or status update within 14 days.
