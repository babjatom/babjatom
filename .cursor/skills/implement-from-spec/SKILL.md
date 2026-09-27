---
name: implement-from-spec
description: >-
  Implement or change tomi-playground visitor-facing behavior from Gherkin
  specs. Use when adding or changing a page, menu item, question, visible
  theme, chart, game, privacy note, or any other behavior a visitor can see.
---

# Implement from spec

Read [`tomi-playground/specs/README.md`](../../../tomi-playground/specs/README.md) and the matching `.feature` file before editing UI.

1. Write or update the scenario until the behavior is unambiguous.
2. Tag unfinished scenarios `@wip`. Leave them out of the sidebar.
3. Update the Vitest files mapped in `specs/README.md`. Tests follow the scenarios.
4. Implement only what those scenarios say.
5. If a page or menu item is added, removed, or renamed, update `App.tsx` and the `pages` array in `app-shell.tsx` together. Update the route list in `tomi-playground/README.md` in the same change.
6. From `tomi-playground/`, run `pnpm test`, `pnpm lint`, and `pnpm build`.
