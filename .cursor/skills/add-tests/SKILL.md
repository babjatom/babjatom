---
name: add-tests
description: Add the narrowest useful tests for a PR diff or named files, then run the project test command from AGENTS.md. Use when the user asks to write tests, cover a change, or fill gaps found in review-pr.
---

# Add tests

Write tests for **this change**, not the whole codebase.

## Scope

1. Prefer the PR diff (`gh pr diff` or `git diff origin/<base>...HEAD`).
2. Or files / behaviors the user names.
3. If scope is unclear, ask once before writing a large suite.

## Steps

1. **Read context**
   - Diff and nearby existing tests (same folder, `__tests__`, `*_test.go`, `test_*.py`, etc.).
   - Match the project’s test style and runner.
   - Commands come from `@AGENTS.md` (`{{CMD_TEST}}` / Test row). Do not invent a new framework if one exists.

2. **Choose the narrowest tests**
   - Cover changed behavior and likely regressions.
   - Prefer unit tests at the right boundary; add one integration test only if the change is cross-module and unit tests cannot catch it.
   - Do not snapshot huge outputs or duplicate lint/typecheck.

3. **Implement**
   - Add or extend test files next to existing conventions.
   - No production refactors unless required to make code testable — and ask first if non-trivial.

4. **Run**
   - Run the project test command from `AGENTS.md` (narrowest subset if the repo supports it).
   - If tests cannot run locally, say exactly what to run in CI and why it was skipped.

5. **Summarize**
   - What was covered.
   - Commands run and results.
   - Remaining gaps (honest).

## When CI exists

- Prefer green `{{CMD_TEST}}` before claiming done.
- If `.github/workflows/ci.yml` is present, remind the user that PR checks are the merge gate.

## Do not

- “Improve coverage” across unrelated packages.
- Commit, push, or open a PR unless the user asks.
- Skip failing tests with `.skip` / `xit` unless the user agrees and a ticket/reason is noted.
- Add flaky network/live-service tests without asking.

## Related

- `review-pr` finds gaps; this skill fills them.
- `ship-change` should call this when a feature change lacks tests.
