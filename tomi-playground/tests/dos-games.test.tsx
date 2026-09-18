import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { track } from '@/infrastructure/analytics'
import { setMatchMediaMatches } from './setup'

const dosMock = vi.fn()

vi.mock('@/presentation/dos-games/load-dos-player', () => ({
  loadDosPlayer: () => Promise.resolve(dosMock),
  dosAssetUrl: (path: string) => `/babjatom/${path}`,
  dosEmulatorsPathPrefix: () => '/babjatom/js-dos/emulators/',
}))

function renderApp(path = '/babjatom/') {
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
    renderApp('/babjatom/')
    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    expect(
      within(pagesNav).getByRole('link', { name: 'Dos games' }),
    ).toBeInTheDocument()
  })

  it('shows the catalog with Wolfenstein 3D and shareware credit', async () => {
    const user = userEvent.setup()
    renderApp('/babjatom/')
    await openDosGames(user)

    expect(screen.getByRole('heading', { name: 'Dos games' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Wolfenstein 3D' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/shareware episode 1/i)).toBeInTheDocument()
  })

  it('starts Wolfenstein 3D in the DOS player and can return to the catalog', async () => {
    const user = userEvent.setup()
    renderApp('/babjatom/')
    await openDosGames(user)

    await user.click(
      screen.getByRole('button', { name: 'Play Wolfenstein 3D' }),
    )

    expect(screen.getByTestId('dos-game-player')).toBeInTheDocument()
    const surface = screen.getByTestId('dos-player-surface')
    expect(surface).toBeInTheDocument()
    expect(surface).toHaveStyle({ height: '70dvh' })
    expect(surface).toHaveClass('dos-player-host')
    expect(screen.getByText(/progress auto-saves/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fullscreen' })).toBeInTheDocument()

    await vi.waitFor(() => {
      expect(dosMock).toHaveBeenCalled()
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
    expect(
      screen.getByRole('button', { name: 'Play Wolfenstein 3D' }),
    ).toBeInTheDocument()
  })

  it('offers a custom fullscreen control under the player', async () => {
    const user = userEvent.setup()
    renderApp('/babjatom/')
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
  })

  it('enters fullscreen when the player is double-clicked', async () => {
    const user = userEvent.setup()
    renderApp('/babjatom/')
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
    setFullScreen.mockClear()

    await user.dblClick(screen.getByTestId('dos-player-surface'))
    expect(setFullScreen).toHaveBeenCalledWith(true)
  })

  it('disables pointer lock on a mobile viewport', async () => {
    const user = userEvent.setup()
    setMatchMediaMatches(true)
    renderApp('/babjatom/')

    await user.click(screen.getByRole('button', { name: /toggle sidebar/i }))
    await openDosGames(user)

    await user.click(
      screen.getByRole('button', { name: 'Play Wolfenstein 3D' }),
    )

    expect(screen.getByTestId('dos-player-surface')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fullscreen' })).toBeInTheDocument()

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
    expect(options.scaleControls).toBe(0.55)
  })
})
