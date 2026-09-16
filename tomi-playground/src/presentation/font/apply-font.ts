import type { FontPreset } from '@/domain/font-presets'

export function applyFont(
  font: FontPreset,
  root: HTMLElement = document.documentElement,
) {
  root.style.setProperty('--font-sans-stack', font.sans)
  root.style.setProperty('--font-display-stack', font.display)
  root.dataset.font = font.id
}
