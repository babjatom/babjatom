---
name: add-rule
description: Turn a repeated agent mistake into a specific Cursor rule under .cursor/rules. Use after a bad agent action, a PR review finding, or an incident that should not happen again.
---

# Add rule

## When to use

- The same agent mistake happened more than once, or once with high cost.
- A PR or incident should be linked so future agents know why the rule exists.

## Steps

1. **Capture the mistake**
   - What went wrong (one sentence).
   - What the agent should do instead.
   - Link: PR URL, issue, or incident note (required if available).

2. **Choose scope**
   - Prefer `globs` + `alwaysApply: false` for file-type or path-specific guidance.
   - Use `alwaysApply: true` only for short, repo-wide constraints. This repo should keep **one** always-on rule (`security.mdc`) unless the user explicitly wants another.
   - Keep the body under ~15 lines.
   - Reference real files with `@path` instead of inlining large content.

3. **Write the rule**
   - Path: `.cursor/rules/<short-name>.mdc`
   - Frontmatter must include `description`, and either `globs` or `alwaysApply`.
   - Example frontmatter:

     ```yaml
     ---
     description: Why this rule exists in one line
     globs: path/to/**/*.ts
     alwaysApply: false
     ---
     ```

4. **Name clearly**
   - File name matches the topic (`api-errors.mdc`, not `rule1.mdc`).
   - First heading matches the description.

5. **Confirm**
   - Show the draft to the user before saving if the wording is judgment-heavy.
   - Do not duplicate `security.mdc` or `AGENTS.md`; link them instead.

## Do not

- Vendor large third-party rule packs.
- Use the legacy `.cursorrules` file; use `.mdc` only.
