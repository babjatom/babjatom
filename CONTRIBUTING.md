# Contributing

Thanks for your interest! This is a personal profile + playground repo, but
issues and pull requests are welcome.

> The source of truth for how this repo works is **[`AGENTS.md`](AGENTS.md)**.
> Read it first — it defines the layout, conventions, and the rules below in
> more detail. This file is the human-facing summary.

## Repository layout

- Root [`README.md`](README.md) — GitHub profile page. Keep it a clean profile;
  do not add app badges here.
- [`tomi-playground/`](tomi-playground/) — the Vite + React SPA deployed to
  GitHub Pages. **Application changes go here.**

## Prerequisites

- **Node 22** (see [`.nvmrc`](.nvmrc); run `nvm use`).
- **pnpm** (the project uses pnpm with a committed lockfile).

## Spec-first workflow

Visitor-facing behavior is specified as Gherkin **before** it is implemented.

1. Write or update a scenario in [`tomi-playground/specs/*.feature`](tomi-playground/specs/).
2. Make it executable with Vitest tests under `tomi-playground/tests/` (there is
   **no** Cucumber runner — see [`tomi-playground/specs/README.md`](tomi-playground/specs/README.md)).
3. Implement the feature so the scenarios and tests pass.
4. Tag unfinished scenarios `@wip` and keep incomplete features out of public
   navigation.

Do not add user-facing behavior that is not described in a spec. The full
procedure lives in `.cursor/skills/implement-from-spec/SKILL.md`.

## Verify before you push

From `tomi-playground/`:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

All four must pass. CI (`.github/workflows/ci.yml`) runs the same commands on
every PR.

## Commits and pull requests

- Use **[Conventional Commits](https://www.conventionalcommits.org/)** for
  commit messages and, importantly, for the **PR title** — the PR title becomes
  the commit subject on `main` and is validated by
  [`pr-title.yml`](.github/workflows/pr-title.yml).
  Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore`, `revert`. Example:
  `feat(tomi-playground): add analytics charts page`.
- Keep each PR to **one logical change**.
- `main` is **linear and squash-only**. PRs land via `gh pr merge --squash`;
  never merge commits. Rebase your branch onto `origin/main` if it has moved.

## Reporting bugs and requesting features

Use the issue forms under **New issue**. For security issues, follow
[`SECURITY.md`](SECURITY.md) instead of opening a public issue.

## Code of Conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
