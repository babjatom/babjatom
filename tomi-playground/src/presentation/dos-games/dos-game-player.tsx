import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { DosGame } from './dos-games-catalog'
import {
  dosAssetUrl,
  dosEmulatorsPathPrefix,
  loadDosPlayer,
  type DosProps,
} from './load-dos-player'
import './dos-player-chrome.css'

type DosGamePlayerProps = {
  game: DosGame
  onBack: () => void
}

export function DosGamePlayer({ game, onBack }: DosGamePlayerProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<DosProps | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    let cancelled = false

    async function start() {
      try {
        const Dos = await loadDosPlayer()
        if (cancelled || !containerRef.current) {
          return
        }

        const isTouchUi =
          typeof window.matchMedia === 'function' &&
          (window.matchMedia('(max-width: 1023px)').matches ||
            window.matchMedia('(hover: none) and (pointer: coarse)').matches)

        const player = Dos(containerRef.current, {
          url: dosAssetUrl(game.bundlePath),
          pathPrefix: dosEmulatorsPathPrefix(),
          autoStart: true,
          autoSave: true,
          kiosk: true,
          // Pointer lock is desktop-oriented; on phones it can leave a blank UI.
          mouseCapture: !isTouchUi,
          softFullscreen: false,
          // Larger hit targets for landscape phones.
          scaleControls: isTouchUi ? 0.55 : 0.2,
          theme: 'dark',
          lang: 'en',
          onEvent: (event) => {
            if (event === 'ci-ready' || event === 'bnd-play') {
              setStatus('ready')
            }
            if (event === 'fullscreen-change') {
              setIsFullScreen(Boolean(document.fullscreenElement))
            }
          },
        })

        if (isTouchUi && surfaceRef.current) {
          surfaceRef.current.classList.add('dos-player-host--touch')
        }

        playerRef.current = player
      } catch (error) {
        if (cancelled) {
          return
        }
        setStatus('error')
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to start the DOS player',
        )
      }
    }

    void start()

    return () => {
      cancelled = true
      const player = playerRef.current
      playerRef.current = null
      if (player) {
        void player.stop().catch(() => undefined)
      }
      if (container) {
        container.replaceChildren()
      }
    }
  }, [game.bundlePath])

  useEffect(() => {
    function onFullScreenChange() {
      setIsFullScreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFullScreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFullScreenChange)
    }
  }, [])

  async function toggleFullScreen() {
    const player = playerRef.current
    const surface = surfaceRef.current
    const entering = !document.fullscreenElement

    if (player) {
      player.setFullScreen(entering)
    }

    if (entering) {
      try {
        await surface?.requestFullscreen()
      } catch {
        // Dos may already handle fullscreen; ignore gesture/API failures.
      }
    } else if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch {
        // ignore
      }
    }
  }

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) {
      return
    }

    let lastTapAt = 0

    function isOnScreenControl(target: EventTarget | null) {
      return (
        target instanceof Element &&
        Boolean(
          target.closest(
            '.emulator-button-touch-zone, .nipple, .nipple-zone, .front, .back',
          ),
        )
      )
    }

    function onDoubleClick(event: MouseEvent) {
      if (isOnScreenControl(event.target)) {
        return
      }
      event.preventDefault()
      void toggleFullScreen()
    }

    function onTouchEnd(event: TouchEvent) {
      if (isOnScreenControl(event.target)) {
        lastTapAt = 0
        return
      }
      const now = Date.now()
      if (now - lastTapAt < 300) {
        lastTapAt = 0
        event.preventDefault()
        void toggleFullScreen()
        return
      }
      lastTapAt = now
    }

    surface.addEventListener('dblclick', onDoubleClick)
    surface.addEventListener('touchend', onTouchEnd, { passive: false })
    return () => {
      surface.removeEventListener('dblclick', onDoubleClick)
      surface.removeEventListener('touchend', onTouchEnd)
    }
    // Listeners only need the mount node; toggleFullScreen reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-3" data-testid="dos-game-player">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">{game.title}</h2>
          <p className="text-sm text-muted-foreground">
            Progress auto-saves in this browser. Double-click or double-tap the
            player for fullscreen. On desktop, click once to capture the mouse
            (Esc to release). On phones, slide the left stick to move without
            lifting your thumb; Fire / Open / Strafe / Enter are on the right.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          onClick={onBack}
        >
          Back to catalog
        </button>
      </div>

      {status === 'loading' ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading DOS player…
        </p>
      ) : null}
      {status === 'error' ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {/*
        js-dos adds .jsdos-rso { height: 100% } to the mount node, which overrides
        Tailwind height utilities. Keep the definite size on an outer wrapper so
        height:100% resolves and the canvas is not 0×0 (sound-only blank screen).
      */}
      <div
        ref={surfaceRef}
        className="dos-player-host relative w-full overflow-hidden rounded-md border border-border bg-black"
        style={{ height: '70dvh' }}
        data-testid="dos-player-surface"
        data-mobile-controls="available"
      >
        <div
          ref={containerRef}
          className="h-full w-full bg-black"
          style={{ height: '100%', width: '100%', background: '#000' }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            void toggleFullScreen()
          }}
        >
          {isFullScreen ? 'Exit fullscreen' : 'Fullscreen'}
        </Button>
      </div>
    </div>
  )
}
