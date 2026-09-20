/** Catalog entry for a playable DOS title hosted under public/games/. */
export type DosGame = {
  id: string
  title: string
  summary: string
  credit: string
  /** Path under Vite BASE_URL to the .jsdos (or zip) bundle. */
  bundlePath: string
}

export const dosGames: DosGame[] = [
  {
    id: 'wolf3d',
    title: 'Wolfenstein 3D',
    summary: '',
    credit:
      'Shareware episode 1 © 1992 id Software, published by Apogee Software. Free to share under the included VENDOR.DOC terms.',
    bundlePath: 'games/wolf3d/wolf3d.jsdos?v=6',
  },
  {
    id: 'doom',
    title: 'Doom',
    summary: '',
    credit:
      'Shareware episode 1 © 1993 id Software. Free to share under the included README.TXT terms (DOOM1.WAD only).',
    bundlePath: 'games/doom/doom.jsdos?v=2',
  },
]

export function getDosGame(id: string): DosGame | undefined {
  return dosGames.find((game) => game.id === id)
}
