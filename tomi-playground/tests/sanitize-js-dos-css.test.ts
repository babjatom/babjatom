import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { sanitizeJsDosCss } from '../scripts/sanitize-js-dos-css.mjs'

const playgroundRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('sanitizeJsDosCss', () => {
  it('removes global .hidden, data-theme, and transparent button preflight', () => {
    const input = [
      '.jsdos-rso{display:flex}',
      '.hidden{display:none}',
      ':root,[data-theme]{background-color:red;color:blue}',
      ':root{color-scheme:light;--pf:1}',
      'button,[type=button],[type=reset],[type=submit]{-webkit-appearance:button;background-color:transparent;background-image:none}',
      'button,input{color:inherit}',
      '@media (prefers-color-scheme: dark){:root{color-scheme:dark;--pf:2}}',
    ].join('')

    const output = sanitizeJsDosCss(input)

    expect(output).toContain('.jsdos-rso{display:flex}')
    expect(output).toContain('button,input{color:inherit}')
    expect(output).not.toContain('.hidden{display:none}')
    expect(output).not.toContain('[data-theme]')
    expect(output).not.toContain('color-scheme:light')
    expect(output).not.toContain('color-scheme:dark')
    expect(output).not.toContain('background-color:transparent')
  })

  it('sanitizes the synced public js-dos stylesheet', () => {
    const synced = readFileSync(
      path.join(playgroundRoot, 'public/js-dos/js-dos.css'),
      'utf8',
    )

    expect(synced).not.toMatch(/\.hidden\{display:none\}/)
    expect(synced).not.toMatch(/:root,\[data-theme\]\{/)
    expect(synced).not.toMatch(
      /button,\[type=button\],\[type=reset\],\[type=submit\]\{[^}]*background-color:transparent/,
    )
    expect(synced).toMatch(/\.jsdos/)
  })
})
