---
name: ship-change
description: Plan and deliver a small, reviewable change with a minimal diff and the narrowest useful test. Use when implementing a feature or fix that should be ready to ship; does not commit or open a PR unless the user asks.
---

# Ship change

## Goal

Produce a focused change that is easy to review. Prefer correctness and a small diff over drive-by cleanup.

## Steps

1. **Plan (short)**
   - Restate the goal in one or two sentences.
   - List files you expect to touch.
   - Note risks (API, data, auth) and whether to ask first per `AGENTS.md`.

2. **Implement**
   - Make the minimal change.
   - Match existing style.
   - Do not refactor unrelated code.

3. **Verify**
   - Run the narrowest useful test or check from `AGENTS.md` commands.
   - If behavior changed and tests are missing, use `add-tests` (or do the same work inline).
   - If you cannot run tests, say what you would run and why it was skipped.

4. **Summarize**
   - What changed and why.
   - How to test.
   - Follow-ups (not done now). Offer `review-pr` if the user wants a pass before merge.

## If the user asks to commit or open a PR

- Follow the **Git workflow** section in `@AGENTS.md` (Conventional Commits, branch prefixes, PR template).
- Prefer one logical change per commit when practical.
- Still do not push or open a PR unless the user explicitly asks.


## Do not

- Commit, push, or open a PR unless the user explicitly asks.
- Skip hooks or CI.
- Expand scope without asking.
