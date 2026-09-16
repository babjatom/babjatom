import { beforeEach, describe, expect, it } from 'vitest'
import { FontService } from '@/application/font-service'
import type { FontPersistence } from '@/application/ports'
import { DEFAULT_FONT_ID, fontPresets } from '@/domain/font-presets'

function createMemoryPersistence(): FontPersistence & {
  store: Map<string, string>
} {
  const store = new Map<string, string>()
  return {
    store,
    loadFontId: () => store.get('id') ?? null,
    saveFontId: (id) => {
      store.set('id', id)
    },
  }
}

describe('FontService', () => {
  let persistence: ReturnType<typeof createMemoryPersistence>
  let service: FontService

  beforeEach(() => {
    persistence = createMemoryPersistence()
    service = new FontService(persistence)
  })

  it('loads Exo 2 when nothing is persisted', () => {
    const session = service.loadSession()
    expect(session.activeFont.id).toBe(DEFAULT_FONT_ID)
    expect(session.activeFont.id).toBe('exo-2')
    expect(session.availableFonts.length).toBeGreaterThanOrEqual(3)
    expect(session.availableFonts).toEqual(fontPresets)
  })

  it('persists a selected font id', () => {
    const classic = fontPresets.find((font) => font.id === 'classic')!
    service.selectFont(classic)
    expect(persistence.loadFontId()).toBe('classic')
    expect(service.loadSession().activeFont.id).toBe('classic')
  })

  it('falls back to Exo 2 for an unknown saved id', () => {
    persistence.saveFontId('not-a-real-font')
    expect(service.loadSession().activeFont.id).toBe(DEFAULT_FONT_ID)
  })
})
