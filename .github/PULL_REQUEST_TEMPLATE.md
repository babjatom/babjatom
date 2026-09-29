<!--
PR title MUST be a Conventional Commit (validated by pr-title.yml) and becomes
the squash commit on main. Example: feat(tomi-playground): add analytics page
Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
-->

## Summary

<!-- What does this PR change, and why? Keep it to one logical change. -->

## Related

<!-- Link issues (e.g. Closes #123) or specs, if any. -->

## Spec-first (visitor-facing changes)

<!-- Delete this section if the change is not visitor-facing. -->

- [ ] Scenario added/updated in `tomi-playground/specs/*.feature`
- [ ] Vitest tests under `tomi-playground/tests/` cover the scenario
- [ ] Unfinished scenarios tagged `@wip` and kept out of public navigation

## Verification

Ran from `tomi-playground/`:

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build`

## Checklist

- [ ] PR title is a Conventional Commit
- [ ] One logical change; branch rebased on `origin/main`
- [ ] No secrets or license-violating assets added
