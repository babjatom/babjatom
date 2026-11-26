---
name: update-from-template
description: Diff this project's agent layer against the upstream agentic-bootstrap template and propose a sync PR. Use when refreshing hooks, AGENTS.md skeleton pieces, or skills from a newer template commit.
---

# Update from template

## Steps

1. **Locate upstream**
   - Default remote name: `template`.
   - If missing, ask for the template clone URL, then:

     ```bash
     git remote add template <url>
     git fetch template
     ```

   - Prefer a pinned tag or commit if the user names one.

2. **Diff the agent layer only**
   Compare against `template/main` (or the chosen ref):

   - `.cursor/hooks.json`
   - `.cursor/hooks/`
   - `.cursor/templates/` (including `ci.yml.tmpl` and rule templates)
   - `.cursor/rules/security.mdc`
   - `.cursor/skills/` (bootstrap, ship-change, add-rule, doctor, update-from-template, review-pr, add-tests)
   - `AGENTS.md` (careful: project may have filled placeholders)
   - `scripts/install-user-layer.sh`
   - `scripts/hooks-smoke.sh`
   - `scripts/detect.sh`
   - `.github/workflows/secret-scan.yml`
   - `.github/workflows/hooks-smoke.yml`
   - `.github/pull_request_template.md` or `.github/PULL_REQUEST_TEMPLATE.md`

   Do **not** overwrite project app code.
   Do **not** blindly overwrite a customized `.github/workflows/ci.yml`; diff against `.cursor/templates/ci.yml.tmpl` and merge by hand.

3. **Classify changes**
   - Safe to take: hook script fixes, security rule clarifications, new skills, template `.mdc.tmpl` / `ci.yml.tmpl` updates.
   - Needs merge by hand: `AGENTS.md` commands and boundaries the project customized; product `ci.yml`.
   - Skip unless asked: deleting project-only rules under `.cursor/rules/`.

4. **Propose a PR**
   - Create a branch like `chore/update-agent-template`.
   - Apply agreed files.
   - Update `.bootstrap-version` to the template commit used.
   - Open a PR **only if the user asks**; otherwise stop after showing the diff summary.

## Do not

- Force-push or reset shared branches.
- Auto-install third-party plugins as part of the update.
