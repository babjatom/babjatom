# Security Policy

## Reporting a vulnerability

Please report security issues **privately**. Do not open a public issue for a
suspected vulnerability.

Use GitHub's private vulnerability reporting:

1. Go to the **[Security tab](https://github.com/babjatom/babjatom/security)** of
   this repository.
2. Click **Report a vulnerability** to open a private advisory.

If private reporting is unavailable, contact the maintainer through their GitHub
profile: [@babjatom](https://github.com/babjatom).

Please include:

- A description of the issue and its impact.
- Steps to reproduce (URL, page, or component; a minimal proof of concept if
  possible).
- Any relevant logs, screenshots, or affected versions.

## Scope

This repository hosts:

- A static, client-side SPA (`tomi-playground/`) deployed to GitHub Pages at
  `tomibabjak.dev`. It has no server component in this repo.
- The GitHub profile README at the repository root.

Backend services the app talks to (for example the Cloudflare Worker endpoints
referenced on the privacy page) are **out of scope** for this repository, though
reports about how the client handles them are welcome.

**Out of scope / not vulnerabilities:**

- Findings that require a compromised device or browser extension.
- Missing security headers that are controlled by GitHub Pages, not this code.
- The bundled DOS shareware games running in an emulator sandbox.

## Response

This is a personal project maintained on a best-effort basis. Expect an initial
response within a reasonable time. Valid reports will be addressed and, where
appropriate, credited in the advisory.

## No secrets in this repo

Everything committed here is public. The app never embeds secrets in the client
bundle; the only build-time secret (a Mixpanel token) is injected from GitHub
Actions secrets at deploy time. If you believe a secret has been committed,
please report it privately so it can be rotated.
