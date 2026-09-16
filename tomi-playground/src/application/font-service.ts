import {
  DEFAULT_FONT_ID,
  findFontPreset,
  fontPresets,
  type FontPreset,
} from '@/domain/font-presets'
import type { FontPersistence } from './ports'

export type FontSession = {
  activeFont: FontPreset
  availableFonts: FontPreset[]
}

export class FontService {
  private readonly persistence: FontPersistence

  constructor(persistence: FontPersistence) {
    this.persistence = persistence
  }

  loadSession(): FontSession {
    const availableFonts = [...fontPresets]
    const savedId = this.persistence.loadFontId()
    const activeFont =
      availableFonts.find((font) => font.id === savedId) ??
      findFontPreset(DEFAULT_FONT_ID) ??
      fontPresets[0]!

    return { activeFont, availableFonts }
  }

  selectFont(font: FontPreset): void {
    this.persistence.saveFontId(font.id)
  }

  listPresets(): FontPreset[] {
    return [...fontPresets]
  }
}
