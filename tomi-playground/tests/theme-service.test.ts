import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeService } from '@/application/theme-service'
import type { ThemePersistence } from '@/application/ports'
import { DEFAULT_THEME_ID } from '@/domain/presets'

function createMemoryPersistence(): ThemePersistence & {
  store: Map<string, string>
} {
  const store = new Map<string, string>()
  return {
    store,
    loadThemeId: () => store.get('id') ?? null,
    saveThemeId: (id) => {
      store.set('id', id)
    },
    loadCustomTheme: () => store.get('custom') ?? null,
    saveCustomTheme: (serialized) => {
      store.set('custom', serialized)
    },
    clearCustomTheme: () => {
      store.delete('custom')
    },
  }
}

describe('ThemeService', () => {
  let persistence: ReturnType<typeof createMemoryPersistence>
  let service: ThemeService

  beforeEach(() => {
    persistence = createMemoryPersistence()
    service = new ThemeService(persistence)
  })

  it('loads the default theme when nothing is persisted', () => {
    const session = service.loadSession()
    expect(session.activeTheme.id).toBe(DEFAULT_THEME_ID)
    expect(session.availableThemes.length).toBeGreaterThanOrEqual(3)
  })

  it('persists a selected theme id', () => {
    const session = service.loadSession()
    const target = session.availableThemes[1]!
    service.selectTheme(target)
    expect(persistence.loadThemeId()).toBe(target.id)
    expect(service.loadSession().activeTheme.id).toBe(target.id)
  })

  it('creates and restores a random custom theme', () => {
    const random = service.createRandomTheme(1234)
    expect(random.generated).toBe(true)
    expect(persistence.loadThemeId()).toBe(random.id)

    const reloaded = service.loadSession()
    expect(reloaded.activeTheme.id).toBe(random.id)
    expect(reloaded.activeTheme.tokens).toEqual(random.tokens)
    expect(reloaded.availableThemes.some((theme) => theme.id === random.id)).toBe(
      true,
    )
  })
})
