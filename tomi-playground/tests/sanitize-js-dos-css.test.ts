import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { sanitizeJsDosCss } from '../scripts/sanitize-js-dos-css.mjs'

const playgroundRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('sanitizeJsDosCss', () => {
  it('keeps only player-scoped rules and drops shell-leaking utilities', () => {
    const input = [
      '.jsdos-rso{display:flex}',
      '.jsdos-rso .btn{color:red}',
      '.emulator-canvas{width:100%}',
      '.nipple{position:absolute}',
      '.hidden{display:none}',
      '.bg-primary{background-color:hsl(var(--p))}',
      '.flex{display:flex}',
      ':root,[data-theme]{background-color:red;color:blue}',
      'button,[type=button]{background-color:transparent}',
      '*,:before,:after{border-width:0}',
      '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}',
      '@keyframes button-pop{0%{transform:scale(.98)}}',
      '@media (prefers-color-scheme: dark){:root{color-scheme:dark}}',
      '@media (max-width: 600px){.jsdos-rso{height:100%}.hidden{display:none}}',
    ].join('')

    const output = sanitizeJsDosCss(input)

    expect(output).toContain('.jsdos-rso{display:flex}')
    expect(output).toContain('.jsdos-rso .btn{color:red}')
    expect(output).toContain('.emulator-canvas{width:100%}')
    expect(output).toContain('.nipple{position:absolute}')
    expect(output).toContain('@keyframes spin{')
    expect(output).toContain('@media (max-width: 600px){.jsdos-rso{height:100%}}')

    expect(output).not.toContain('.hidden{display:none}')
    expect(output).not.toContain('.bg-primary{')
    expect(output).not.toContain('.flex{display:flex}')
    expect(output).not.toContain('[data-theme]')
    expect(output).not.toContain('background-color:transparent')
    expect(output).not.toContain('border-width:0')
    expect(output).not.toContain('button-pop')
    expect(output).not.toContain('prefers-color-scheme')
  })

  it('sanitizes the synced public js-dos stylesheet', () => {
    const synced = readFileSync(
      path.join(playgroundRoot, 'public/js-dos/js-dos.css'),
      'utf8',
    )

    expect(synced).toMatch(/\.jsdos/)
    expect(synced).toMatch(/\.emulator-/)
    expect(synced).not.toMatch(/\.bg-primary\{/)
    expect(synced).not.toMatch(/\.hidden\{display:none\}/)
    expect(synced).not.toMatch(/:root,\[data-theme\]\{/)
    expect(synced).not.toMatch(/\*,:before,:after\{[^}]*border-width:0/)
    expect(synced.length).toBeLessThan(80_000)
  })
})
