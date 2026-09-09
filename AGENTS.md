# AGENTS.md

Instructions for Cursor agents working in this repository.

## Overview

Public repository with two parts:

- Root [`README.md`](README.md) — GitHub profile for [babjatom](https://github.com/babjatom)
- [`theme-playground/`](theme-playground/) — Vite + React SPA deployed to GitHub Pages

Everything committed here is public forever, including history.

## Do

- Work in `theme-playground/` for application changes.
- Route every page through [`app-shell.tsx`](theme-playground/src/presentation/app-shell.tsx) (`AppShell` + `<Outlet />`).
- Keep the shell `pages` array aligned with routes in [`App.tsx`](theme-playground/src/App.tsx).
- Preserve Vite `base: '/babjatom/'` and [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
- Reuse the existing CSS-variable theme system.
- Ship incomplete features as intentional placeholders, not broken nav entries.
- When adding routes, add or update routing/navigation tests.
- Verify changes with install, test, and build (commands below).

## Do not

- Commit secrets, API keys, LLM tokens, or real `.env` values.
- Commit private corpora (interview materials, resume secrets, compensation notes).
- Commit `node_modules/`, `dist/`, model weights, or large binaries.
- Put server credentials in client code or Pages build env that embeds into the bundle.
- Expose unfinished experiments in public navigation.

If configuration files are needed later, commit only `.env.example` with empty placeholders. Backend services and training data belong outside this public SPA.

## Verify

From `theme-playground/`:

```bash
pnpm install
pnpm test
pnpm lint
pnpm build
```

Local development: `pnpm dev`. Full runbook: [`theme-playground/README.md`](theme-playground/README.md).

## Cursor Cloud

No committed `.cursor/environment.json` yet; environment is dashboard-managed. On a cold machine, run `pnpm install` in `theme-playground/` before developing or verifying.
