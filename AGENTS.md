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
- Use Conventional Commits for every commit (see below).
- Verify changes with install, test, and build (commands below).

## Do not

- Commit secrets, API keys, LLM tokens, or real `.env` values.
- Commit private corpora (interview materials, resume secrets, compensation notes).
- Commit `node_modules/`, `dist/`, model weights, or large binaries.
- Put server credentials in client code or Pages build env that embeds into the bundle.
- Expose unfinished experiments in public navigation.
- Use browser automation, computer use, screenshots, or screen recordings by default.
- Upload walkthrough artifacts unless the task is explicitly visual or the user asked for a demo.

If configuration files are needed later, commit only `.env.example` with empty placeholders. Backend services and training data belong outside this public SPA.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(optional-scope): <description>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Rules:

- Imperative, concise description (for example `add AGENTS.md`, not `added` / `Adds`).
- Scope optional; use when it clarifies the area (`theme-playground`, `deploy`, `agents`).
- Breaking changes: append `!` after type/scope or add a `BREAKING CHANGE:` footer.
- One logical change per commit when practical.

Examples:

```text
docs: add AGENTS.md agent contract
feat(theme-playground): add analytics charts page
fix(deploy): preserve Pages base path
```

## Verify

Default validation is CLI only. From `theme-playground/`:

```bash
pnpm install
pnpm test
pnpm lint
pnpm build
```

That is enough to consider the task verified for non-visual changes (routing, logic, refactors, tests, docs, CI).

### Visual / manual demo (opt-in only)

Use browser computer-use, screenshots, or screen recordings only when at least one is true:

- The user explicitly asked for a visual demo, screenshot, or recording
- The change is primarily look-and-feel (theme, layout, motion, responsive UI) and cannot be judged from tests alone

When demos are allowed: prefer one short recording or one screenshot. Do not record setup, exploratory clicking, or failed attempts. Do not run video-review unless needed to confirm the recording.

Local development: `pnpm dev`. Full runbook: [`theme-playground/README.md`](theme-playground/README.md).

## Cursor Cloud

No committed `.cursor/environment.json` yet; environment is dashboard-managed. On a cold machine, run `pnpm install` in `theme-playground/` before developing or verifying.

Prefer the cheapest successful path: implement → `pnpm test` / `pnpm lint` / `pnpm build` → commit/push/PR. Skip GUI walkthroughs unless the opt-in rules above apply.
