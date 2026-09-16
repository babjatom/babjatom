# Specs

Gherkin `.feature` files in this folder are the **acceptance contract** for `tomi-playground`.

Requirements go here first. Vitest tests under `tests/` make the scenarios executable. Implementation follows the spec — not the other way around.

These files are not run by Cucumber. They are for humans and agents. Do not add a Gherkin test runner unless that is requested.

## Workflow

1. Write or update scenarios in a `.feature` file until the desired behavior is unambiguous.
2. Point the agent at that file (or `@wip` scenarios) and ask it to implement the feature **and** tests.
3. Keep tests aligned with the scenarios. Do not ship extra user-facing behavior that is not in the spec.
4. Mark unfinished scenarios `@wip`. Incomplete features stay placeholders and stay out of public navigation.

## Style

- One capability per file (`ask-tomi.feature`, not a dump of the whole app).
- Use visitor language: pages, menus, questions, answers. Avoid selectors, storage keys, and API payloads.
- Prefer `Given` / `When` / `Then`. `And` / `But` are fine. Skip `Background` unless every scenario shares the same setup.
- Name scenarios by outcome (`Visitor submits a typed question`), not by implementation (`POST /chat`).

## Mapping

| Spec | Executable tests |
| --- | --- |
| `shell.feature` | `tests/app.test.tsx` |
| `themes.feature` | `tests/app.test.tsx`, `tests/theme-service.test.ts`, `tests/theme-domain.test.ts` |
| `fonts.feature` | `tests/app.test.tsx`, `tests/font-service.test.ts`, `tests/font-domain.test.ts`, `tests/apply-font.test.ts` |
| `theme-playground.feature` | `tests/app.test.tsx`, `tests/visits-data-table.test.tsx` |
| `analytics.feature` | `tests/analytics.test.tsx` |
| `ask-tomi.feature` | `tests/ask-tomi.test.tsx` |
| `privacy.feature` | `tests/privacy.test.tsx` |
