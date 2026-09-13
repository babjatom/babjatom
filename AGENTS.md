# AGENTS.md

Instructions for Cursor agents working in this repository.

## Overview

Public repository with two parts:

- Root [`README.md`](README.md) — GitHub profile for [babjatom](https://github.com/babjatom)
- [`tomi-playground/`](tomi-playground/) — Vite + React SPA deployed to GitHub Pages

Everything committed here is public forever, including history.

## Do

- Work in `tomi-playground/` for application changes.
- Route every page through [`app-shell.tsx`](tomi-playground/src/presentation/app-shell.tsx) (`AppShell` + `<Outlet />`).
- Keep the shell `pages` array aligned with routes in [`App.tsx`](tomi-playground/src/App.tsx).
- Preserve Vite `base: '/babjatom/'` and [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
- Reuse the existing CSS-variable theme system.
- Ship incomplete features as intentional placeholders, not broken nav entries.
- When adding routes, add or update routing/navigation tests.
- Use Conventional Commits for every commit (see below).
- Verify changes with install, test, and build (commands below).

## Do not

- Commit secrets, API keys, LLM tokens, or real `.env` values.
- Commit private corpora (interview materials, resume secrets, compensation notes).
- Commit `node_modules/`, `dist/`, model weights, or large binaries.
- Put server credentials in client code or Pages build env that embeds into the bundle.
- Expose unfinished experiments in public navigation.

If configuration files are needed later, commit only `.env.example` with empty placeholders. Backend services and training data belong outside this public SPA.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(optional-scope): <description>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Rules:

- Imperative, concise description (for example `add AGENTS.md`, not `added` / `Adds`).
- Scope optional; use when it clarifies the area (`tomi-playground`, `deploy`, `agents`).
- Breaking changes: append `!` after type/scope or add a `BREAKING CHANGE:` footer.
- One logical change per commit when practical.

Examples:

```text
docs: add AGENTS.md agent contract
feat(tomi-playground): add analytics charts page
fix(deploy): preserve Pages base path
```

## Verify

From `tomi-playground/`:

```bash
pnpm install
pnpm test
pnpm lint
pnpm build
```

Local development: `pnpm dev`. Full runbook: [`tomi-playground/README.md`](tomi-playground/README.md).

## Cursor Cloud

No committed `.cursor/environment.json` yet; environment is dashboard-managed. On a cold machine, run `pnpm install` in `tomi-playground/` before developing or verifying.
