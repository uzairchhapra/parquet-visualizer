# Parquet Visualizer — Project Guide

## 1. Run Locally

```bash
nvm use 20
npm install
npm run dev
# Opens at http://localhost:5173
```

Requires Node 20+ via [nvm](https://github.com/nvm-sh/nvm). If not installed: `nvm install 20`.

## 2. Build & Deploy as Static Assets

```bash
nvm use 20
npm run build
# Output: dist/
# Serve with any static server: npx serve dist, python3 -m http.server, nginx, caddy, etc.
```

The build output is a static SPA — just HTML, JS, CSS, and WASM files. No server-side runtime needed.

## 3. Nixpacks Deployment

The project includes a `nixpacks.toml` that pins Node 20 and runs the built `dist/` via `serve`.

```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npx serve dist -l $PORT"
```

Nixpacks also reads the `.nvmrc` (set to `20`) and the `engines.node` field in `package.json` as additional signals. No further configuration is needed in Coolify when using nixpacks as the build provider.

## 4. VPS Deployment (Hostinger + Coolify + Caddy + Cloudflare)

### Overview

```
User → Cloudflare (proxy) → Caddy (reverse proxy on VPS) → Coolify → static dist/
```

### Deployment Steps

1. **Push to Git** — Push the repo to GitHub/GitLab.
2. **Coolify setup** — Add a new "Static Site" resource in Coolify pointing to your repo.
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Coolify will serve the built assets and handle SSL termination internally.
3. **Caddy reverse proxy** — If Caddy sits in front of Coolify:
   ```
   parquet.yourdomain.com {
       reverse_proxy localhost:<coolify-port>
       header {
           X-Content-Type-Options nosniff
           X-Frame-Options DENY
           Referrer-Policy strict-origin-when-cross-origin
           Permissions-Policy interest-cohort=()
           Content-Security-Policy "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://cdn.jsdelivr.net; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
       }
       encode gzip
       # SPA fallback
       try_files {path} /index.html
   }
   ```

### Cloudflare DNS & SSL Settings

- **DNS**: Add an A record for `parquet.yourdomain.com` → your VPS IP. Enable the orange cloud (proxy).
- **SSL/TLS mode**:
  - **Full** — Cloudflare encrypts to your server, but does not verify the certificate. Works with Caddy's auto-HTTPS (self-signed or Let's Encrypt).
  - **Full (Strict)** — Cloudflare verifies the certificate is valid and trusted. Requires a valid cert on your origin (Let's Encrypt via Caddy, or a Cloudflare Origin Certificate).
  - **Recommendation**: Use **Full (Strict)** with Caddy's automatic Let's Encrypt certs. If Let's Encrypt has issues behind Cloudflare proxy, use a Cloudflare Origin Certificate installed in Caddy instead.
- **Edge Certificate**: Cloudflare's Universal SSL handles the browser→Cloudflare leg automatically.
- **Always Use HTTPS**: Enable in Cloudflare dashboard.
- **Minimum TLS Version**: 1.2.

### Safe Deployment Checklist

- [ ] Build succeeds locally (`npm run build`)
- [ ] `dist/` contains `index.html` and asset files
- [ ] Caddy config has SPA fallback (`try_files {path} /index.html`)
- [ ] Security headers are set (CSP, X-Frame-Options, etc.)
- [ ] Cloudflare SSL/TLS mode is Full or Full (Strict)
- [ ] HTTPS redirect is enabled
- [ ] Test the site loads in a browser; verify no mixed content warnings
- [ ] Check DuckDB WASM loads correctly (open DevTools → Network tab)
- [ ] Verify no external data requests are made (only font + WASM CDN)

## 5. Recommended Security Headers (Static SPA)

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval' blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://cdn.jsdelivr.net; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: interest-cohort=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

### CSP Notes

- `'wasm-unsafe-eval'` is required for DuckDB-WASM to compile WebAssembly modules.
- `blob:` in `script-src` and `worker-src` is needed because DuckDB-WASM creates web workers from blob URLs.
- `connect-src https://cdn.jsdelivr.net` allows fetching the DuckDB WASM binary from jsDelivr CDN.
- No `unsafe-eval` is needed — only `wasm-unsafe-eval`.

## 6. Privacy Statement

> **Parquet Visualizer** processes all data entirely within your browser using WebAssembly (DuckDB-WASM). No files, queries, schema information, or query results are ever transmitted to any server. There is no backend, no analytics, no telemetry, and no tracking. Your data never leaves your device.
>
> The only network requests made are to load the application code itself and the DuckDB WebAssembly binary from a CDN on first visit. After that, the app works fully offline.

## Tech Stack

- React + Vite + TypeScript
- Material UI (MUI) for all components and theming
- DuckDB-WASM in a Web Worker for query execution
- No backend, no server-side processing
