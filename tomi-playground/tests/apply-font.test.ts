import { describe, expect, it } from 'vitest'
import { findFontPreset } from '@/domain/font-presets'
import { applyFont } from '@/presentation/font/apply-font'

describe('applyFont', () => {
  it('writes font stacks and data-font onto the root', () => {
    const root = document.createElement('div')
    const font = findFontPreset('orbitron')!
    applyFont(font, root)

    expect(root.style.getPropertyValue('--font-sans-stack')).toBe(font.sans)
    expect(root.style.getPropertyValue('--font-display-stack')).toBe(
      font.display,
    )
    expect(root.dataset.font).toBe('orbitron')
  })
})
