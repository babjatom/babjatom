import { describe, expect, it } from 'vitest'
// Sanitizer lives next to the sync script (plain ESM, no TS types).
// @ts-expect-error -- .mjs helper has no declaration file
import { sanitizeJsDosCss } from '../scripts/sanitize-js-dos-css.mjs'

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
      '.w-full{width:100%}',
      '.h-full{height:100%}',
      '.absolute{position:absolute}',
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
    expect(output).toContain('.jsdos-rso .flex,.dos-player-host .flex{display:flex}')
    expect(output).toContain('.jsdos-rso .w-full,.dos-player-host .w-full{width:100%}')
    expect(output).toContain('.jsdos-rso .h-full,.dos-player-host .h-full{height:100%}')
    expect(output).toContain(
      '.jsdos-rso .absolute,.dos-player-host .absolute{position:absolute}',
    )

    expect(output).not.toContain('.hidden{display:none}')
    expect(output).not.toContain('.bg-primary{')
    expect(output).not.toContain('[data-theme]')
    expect(output).not.toContain('background-color:transparent')
    expect(output).not.toContain('border-width:0')
    expect(output).not.toContain('button-pop')
    expect(output).not.toContain('prefers-color-scheme')
    expect(output).not.toMatch(/(?:^|[,}])\.flex\{display:flex\}/)
    expect(output).not.toMatch(/(?:^|[,}])\.w-full\{width:100%\}/)
  })
})
