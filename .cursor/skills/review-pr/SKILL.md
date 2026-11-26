---
name: review-pr
description: Review a pull request like a careful teammate — bugs, security, missing tests, and AGENTS.md boundary issues. Use when the user asks to review a PR, review the current branch, or leave PR feedback. Comment-only unless the user asks to post.
---

# Review PR

Advisory review only. Do not approve, merge, or dismiss required checks unless the user explicitly asks.

## Inputs

- PR number or URL, **or** the current branch vs the default base (`main` / `master`).
- Prefer `gh` when available:

  ```bash
  gh pr view --json number,title,body,baseRefName,headRefName,url
  gh pr diff
  gh pr checks
  ```

- If `gh` is unavailable, use `git fetch` + `git diff origin/<base>...HEAD` and say checks were not fetched.

## What to look for

Prioritize in this order:

1. **Correctness** — logic bugs, broken edge cases, regressions in the diff.
2. **Security** — secrets, authz gaps, unsafe shell, dependency or injection risks (see `@.cursor/rules/security.mdc`).
3. **Tests** — behavior changed without coverage; suggest `add-tests` for gaps.
4. **Boundaries** — AGENTS.md Ask-first / Never violations; generated files edited by hand; skipped hooks.
5. **Maintainability** — only if it blocks understanding or will cause real pain; no style nits already covered by lint CI.

## Output format

Post (or show) a short review:

```markdown
## Review

### Blocking
- …

### Non-blocking
- …

### Missing tests
- …

### Checks
- CI / `gh pr checks`: pass | fail | unknown
```

- Every finding: file path + short why + suggested fix (one line).
- If nothing blocking: say so explicitly.
- Do not rewrite the PR unless asked.

## Posting comments

- Default: show the review in chat.
- Only run `gh pr comment` / `gh pr review` when the user asks to post.
- Prefer one summary comment over dozens of noise threads.
- Never approve with `gh pr review --approve` unless the user explicitly asks.

## Follow-ups

- Repeated mistakes → offer `add-rule`.
- Clear test gaps → offer `add-tests` on this PR.
- Failed checks → fix CI first; do not rubber-stamp.

## Do not

- Merge, force-push, or skip required checks.
- Expand into a full rewrite or drive-by refactor.
- Treat this skill as a replacement for human review or green CI.
