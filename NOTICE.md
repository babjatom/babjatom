# NOTICE

This repository is a mix of original source code, personal content, and bundled
third-party assets. The MIT license in [`LICENSE`](LICENSE) applies to the
original source code only. This file records the parts that are **not** covered
by MIT and the terms that apply to them.

## Original source code — MIT

The application source under `tomi-playground/src/`, the build scripts under
`tomi-playground/scripts/`, configuration, tests under `tomi-playground/tests/`,
and the Gherkin specs under `tomi-playground/specs/` are © 2026 Tomi Babjak and
released under the MIT license.

## Personal content — All Rights Reserved

The following are personal to the repository owner and are **not** licensed for
reuse, redistribution, or modification. They are published here only so the site
can serve them:

- `tomi-playground/public/tomi-babjak-cv.pdf` — curriculum vitae.
- `tomi-playground/public/models/tomi.glb` — a 3D likeness model of the owner.
- Profile prose — the root [`README.md`](README.md) and the biographical / "Ask
  Tomi" copy shown in the app.

© 2026 Tomi Babjak. All rights reserved. No permission is granted to copy, use,
or distribute these items outside of viewing this site as published.

## Bundled third-party assets

### Fonts — SIL Open Font License 1.1

Self-hosted typefaces are distributed under the SIL Open Font License 1.1. The
per-family license text ships alongside each font:

- Under `tomi-playground/src/assets/fonts/*/OFL.txt`: Audiowide, Electrolize,
  Exo 2, Michroma, Orbitron, Oxanium, Rajdhani, Share Tech Mono.
- Via the `@fontsource/outfit` and `@fontsource/fraunces` packages: Outfit and
  Fraunces, also under the SIL Open Font License 1.1.

### UI primitives and libraries

Runtime dependencies are installed from npm and retain their own licenses (see
[`tomi-playground/package.json`](tomi-playground/package.json) and the
corresponding `node_modules/*/LICENSE` files). Notable ones:

- shadcn/ui component patterns, Radix UI, Recharts, React, React Router,
  `class-variance-authority`, `tailwind-merge`, `clsx` — MIT.
- `lucide-react` — ISC.
- `three` / `@react-three/*` — MIT.

### js-dos (DOS emulator)

The DOS games run in the browser via [`js-dos`](https://js-dos.com/). Its
runtime assets are synced from `node_modules/js-dos` into `public/js-dos/` at
build time (that folder is git-ignored and **not** committed here). js-dos
bundles a DOSBox-based emulator core, which is distributed under the GPL; see the
js-dos project for the exact terms.

### DOS shareware games

Two **shareware, episode&nbsp;1** game bundles are included under
`tomi-playground/public/games/`. These are the freely distributable shareware
builds — **not** the registered/full versions — and each is redistributed under
its own bundled terms, which are preserved next to the game files:

- **Wolfenstein 3D** (`wolf3d/wolf3d.jsdos`) — Shareware episode 1, © 1992 id
  Software, published by Apogee Software. Redistribution of the shareware
  version online without charge is expressly permitted by the bundled
  [`wolf3d/VENDOR.DOC`](tomi-playground/public/games/wolf3d/VENDOR.DOC).
  "Wolfenstein 3D", "Apogee", and the Apogee comet logo are trademarks of their
  respective owners.

- **Doom** (`doom/doom.jsdos`) — Shareware episode 1 (`DOOM1.WAD` only), © 1993
  id Software. Redistributed under id's shareware terms; the bundled
  [`doom/README.TXT`](tomi-playground/public/games/doom/README.TXT) and
  [`doom/ORDER.FRM`](tomi-playground/public/games/doom/ORDER.FRM) are preserved.
  "DOOM" and related marks are trademarks of id Software / ZeniMax.

Notes:

- Only the shareware episode 1 data is distributed. Do not replace these with
  registered/full data (`WL6` for Wolfenstein 3D, `DOOM.WAD` for Doom).
- Copyright and trademark notices in the bundled documentation are preserved and
  must not be removed.
- Redistribution of these bundles here is limited to the free, non-commercial,
  online distribution the shareware licenses allow. Commercial, retail,
  CD-ROM/rack, or bundled redistribution of Wolfenstein 3D requires prior
  written permission from Apogee per `VENDOR.DOC`.
