export type FontPreset = {
  id: string
  name: string
  /** CSS font-family stack for body / UI text */
  sans: string
  /** CSS font-family stack for display headings */
  display: string
}

const SANS_FALLBACK = 'ui-sans-serif, system-ui, sans-serif'
const SERIF_FALLBACK = 'ui-serif, Georgia, serif'
const MONO_FALLBACK = 'ui-monospace, monospace'

function createFontPreset(
  id: string,
  name: string,
  family: string,
  fallback: string = SANS_FALLBACK,
): FontPreset {
  const stack = `"${family}", ${fallback}`
  return { id, name, sans: stack, display: stack }
}

export const DEFAULT_FONT_ID = 'exo-2'

export const fontPresets: FontPreset[] = [
  createFontPreset('exo-2', 'Exo 2', 'Exo 2'),
  createFontPreset('orbitron', 'Orbitron', 'Orbitron'),
  {
    id: 'classic',
    name: 'Classic',
    sans: `"Outfit", ${SANS_FALLBACK}`,
    display: `"Fraunces", ${SERIF_FALLBACK}`,
  },
  createFontPreset('audiowide', 'Audiowide', 'Audiowide'),
  createFontPreset('rajdhani', 'Rajdhani', 'Rajdhani'),
  createFontPreset(
    'share-tech-mono',
    'Share Tech Mono',
    'Share Tech Mono',
    MONO_FALLBACK,
  ),
  createFontPreset('oxanium', 'Oxanium', 'Oxanium'),
  createFontPreset('electrolize', 'Electrolize', 'Electrolize'),
  createFontPreset('michroma', 'Michroma', 'Michroma'),
]

export function findFontPreset(id: string): FontPreset | undefined {
  return fontPresets.find((preset) => preset.id === id)
}
