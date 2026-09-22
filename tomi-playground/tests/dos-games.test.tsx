import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { track } from '@/infrastructure/analytics'
import { setMatchMediaMatches } from './setup'

const dosMock = vi.fn()

vi.mock('@/presentation/dos-games/load-dos-player', () => ({
  loadDosPlayer: () => Promise.resolve(dosMock),
  dosAssetUrl: (path: string) => `/${path}`,
  dosEmulatorsPathPrefix: () => '/js-dos/emulators/',
}))

function renderApp(path = '/') {
  window.history.pushState({}, '', path)
  return render(<App />)
}

async function openDosGames(user: ReturnType<typeof userEvent.setup>) {
  const pagesNav = screen.getByRole('navigation', { name: /pages/i })
  await user.click(within(pagesNav).getByRole('link', { name: 'Dos games' }))
}

describe('Dos games page', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setMatchMediaMatches(false)
    vi.mocked(track).mockClear()
    dosMock.mockReset()
    dosMock.mockImplementation((element: HTMLDivElement, options?: { onEvent?: (event: string) => void }) => {
      element.setAttribute('data-dos-started', 'true')
      queueMicrotask(() => options?.onEvent?.('ci-ready'))
      return {
        stop: vi.fn().mockResolvedValue(undefined),
        save: vi.fn().mockResolvedValue(true),
        setAutoSave: vi.fn(),
        setSoftFullscreen: vi.fn(),
        setFullScreen: vi.fn(),
        setKiosk: vi.fn(),
        setScaleControls: vi.fn(),
      }
    })
  })

  it('lists Dos games in the pages menu', () => {
    renderApp('/')
    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    expect(
      within(pagesNav).getByRole('link', { name: 'Dos games' }),
    ).toBeInTheDocument()
  })

  it('shows the catalog with Wolfenstein 3D, Doom, and shareware credits', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await openDosGames(user)

    expect(screen.getByRole('heading', { name: 'Dos games' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Wolfenstein 3D' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Doom' })).toBeInTheDocument()
    expect(
      screen.getByText(/shareware episode 1 © 1992 id Software, published by Apogee/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/shareware episode 1 © 1993 id Software.*DOOM1\.WAD only/i),
    ).toBeInTheDocument()
  })

  it('starts Wolfenstein 3D in the DOS player and can return to the catalog', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await openDosGames(user)

    await user.click(
      screen.getByRole('button', { name: 'Play Wolfenstein 3D' }),
    )

    expect(track).toHaveBeenCalledWith('Dos Game Started', {
      game_id: 'wolf3d',
    })

    expect(screen.getByRole('heading', { name: 'Dos games' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Wolfenstein 3D' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Play Wolfenstein 3D' }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('dos-game-player')).toBeInTheDocument()
    const surface = screen.getByTestId('dos-player-surface')
    expect(surface).toBeInTheDocument()
    expect(surface).toHaveStyle({ height: '70dvh' })
    expect(surface).toHaveClass('dos-player-host')
    expect(screen.getByText(/progress auto-saves/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fullscreen' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Back to catalog' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Collapse sidebar' }),
    ).toBeInTheDocument()

    await vi.waitFor(() => {
      expect(dosMock).toHaveBeenCalled()
    })

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith('Dos Game Ready', {
        game_id: 'wolf3d',
      })
    })

    const options = dosMock.mock.calls[0]?.[1] as {
      autoSave?: boolean
      url?: string
      mouseCapture?: boolean
      kiosk?: boolean
    }
    expect(options.autoSave).toBe(true)
    expect(options.kiosk).toBe(true)
    expect(options.mouseCapture).toBe(true)
    expect(options.url).toContain('games/wolf3d/wolf3d.jsdos')

    await user.click(screen.getByRole('button', { name: 'Back to catalog' }))
    expect(track).toHaveBeenCalledWith(
      'Dos Game Exited',
      expect.objectContaining({
        game_id: 'wolf3d',
        session_ms: expect.any(Number),
      }),
    )
    expect(screen.queryByTestId('dos-game-player')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Play Wolfenstein 3D' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dos games' })).toBeInTheDocument()
  })

  it('starts Doom in the DOS player and can return to the catalog', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await openDosGames(user)

    await user.click(screen.getByRole('button', { name: 'Play Doom' }))

    expect(screen.getByRole('heading', { name: 'Dos games' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Doom' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Play Doom' }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('dos-game-player')).toBeInTheDocument()

    await vi.waitFor(() => {
      expect(dosMock).toHaveBeenCalled()
    })

    const options = dosMock.mock.calls[0]?.[1] as { url?: string }
    expect(options.url).toContain('games/doom/doom.jsdos')

    await user.click(screen.getByRole('button', { name: 'Back to catalog' }))
    expect(screen.queryByTestId('dos-game-player')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play Doom' })).toBeInTheDocument()
  })

  it('shows mouse capture guidance when playing Doom on desktop', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await openDosGames(user)

    await user.click(screen.getByRole('button', { name: 'Play Doom' }))

    expect(screen.getByText(/click once to capture the mouse/i)).toBeInTheDocument()
  })

  it('offers a custom fullscreen control above the player', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await openDosGames(user)
    await user.click(
      screen.getByRole('button', { name: 'Play Wolfenstein 3D' }),
    )

    await vi.waitFor(() => {
      expect(dosMock).toHaveBeenCalled()
    })

    const setFullScreen = dosMock.mock.results[0]?.value.setFullScreen as ReturnType<
      typeof vi.fn
    >
    await user.click(screen.getByRole('button', { name: 'Fullscreen' }))
    expect(setFullScreen).toHaveBeenCalledWith(true)
    expect(track).toHaveBeenCalledWith('Dos Game Fullscreen', {
      game_id: 'wolf3d',
      active: true,
    })
  })

  it('disables pointer lock on a mobile viewport', async () => {
    const user = userEvent.setup()
    setMatchMediaMatches(true)
    renderApp('/')

    await user.click(screen.getByRole('button', { name: /toggle sidebar/i }))
    await openDosGames(user)

    await user.click(
      screen.getByRole('button', { name: 'Play Wolfenstein 3D' }),
    )

    expect(screen.getByTestId('dos-player-surface')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fullscreen' })).toBeInTheDocument()
    expect(screen.getByText(/slide the left stick/i)).toBeInTheDocument()

    await vi.waitFor(() => {
      expect(dosMock).toHaveBeenCalled()
    })
    const options = dosMock.mock.calls[0]?.[1] as {
      softFullscreen?: boolean
      scaleControls?: number
      mouseCapture?: boolean
      kiosk?: boolean
    }
    expect(options.kiosk).toBe(true)
    expect(options.softFullscreen).toBe(false)
    expect(options.mouseCapture).toBe(false)
    expect(options.scaleControls).toBe(0.7)
  })
})
