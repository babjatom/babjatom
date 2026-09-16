# Tomi Playground

A Vite + React SPA for babjatom: CSS-variable themes, analytics charts, and Ask Tomi.

The app in this folder is served from GitHub Pages with routes:

- `/` — Ask Tomi chat (site home)
- `/theme-playground` — component showcase and visits table
- `/analytics` — visits table plus area, bar, line, pie, radar, radial, and tooltip charts
- `/ask-tomi` and `/tomi-ai` — redirect to `/`
- `/privacy` — short privacy note (hosting, Ask Tomi, profile pixel)

The sidebar **Pages** menu lists Theme Playground, Analytics, and Ask Tomi, with **Themes** below. A **Privacy** link sits under the sidebar footer.

## Features

- shadcn/ui components
- Tailwind CSS
- CSS-variable based themes
- theme switching
- random theme generation
- collapsible sidebar
- responsive mobile layout
- CSS-based visual effects
- localStorage theme persistence
- Mixpanel product analytics (optional locally; off on GitHub Pages)
- Self-hosted Outfit / Fraunces (Classic) plus techno typeface presets (no Google Fonts CDN)
- Vitest + React Testing Library
- Gherkin acceptance specs in `specs/`
- GitHub Pages deployment

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Vitest
- React Testing Library
- GitHub Actions
- GitHub Pages

## Development

From the `tomi-playground/` directory:

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

Run tests in watch mode:

```bash
pnpm test:watch
```

Preview the production build locally:

```bash
pnpm preview
```

Vite is configured with `base: '/babjatom/'` so assets resolve correctly on GitHub Pages. Local `pnpm dev` still works with that base path.

## Specs

User-facing behavior is specified as Gherkin in [`specs/`](specs/). Write or update those scenarios before implementing a feature. Vitest tests under `tests/` make the scenarios executable; there is no Cucumber runner.

See [`specs/README.md`](specs/README.md) for the workflow and file mapping.

## Adding a Theme

Themes are maps of **semantic CSS variables**. Components read those tokens; they are not restyled per theme.

Typical tokens:

```text
background
foreground
primary
primary-foreground
secondary
muted
accent
border
ring
radius
```

To add a preset theme:

1. Open `src/domain/presets.ts`
2. Call `createTheme(id, name, tokens)` with HSL channel values (for example `"199 89% 38%"`)
3. The sidebar lists presets automatically — **do not duplicate components** for the new look

Random themes are produced in `src/domain/random-theme.ts` using the same token shape.

## Adding Components

1. Add a shadcn-style primitive under `src/components/ui/` (or generate with the shadcn CLI using `components.json`)
2. Import it in `src/presentation/theme-playground/component-showcase.tsx`
3. Prefer semantic utility classes (`bg-primary`, `text-muted-foreground`, `border-border`) so the control follows every theme

## Architecture

Lightweight DDD layering keeps theming logic independent of React:

```text
domain          Theme entities, presets, random generation (no React)
application     ThemeService use-cases and persistence ports
infrastructure  localStorage adapter, Mixpanel analytics
presentation    React shell, sidebar, showcase, CSS variable application
```

The Theme domain can be unit-tested and reused without mounting the UI.

## Analytics

Mixpanel is optional for local development only. Copy `.env.example` to `.env`
and set `VITE_MIXPANEL_TOKEN` if you want tracking while developing. Without a
token, analytics no-ops.

The GitHub Pages deploy workflow does **not** inject a Mixpanel token, so the
public site ships without product analytics trackers.

## Deployment

Pushes to the `main` branch run `.github/workflows/deploy.yml`, which installs dependencies, runs the test suite, builds the Vite app, and deploys `tomi-playground/dist/` to GitHub Pages.

The workflow fails if tests or the production build fail.

Production URL:

```text
https://babjatom.github.io/babjatom/
```

In repository Settings → Pages, set the source to **GitHub Actions** after merging.
