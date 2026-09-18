import { useEffect, useRef, useState } from 'react'
import type { DosGame } from './dos-games-catalog'
import {
  dosAssetUrl,
  dosEmulatorsPathPrefix,
  loadDosPlayer,
  type DosProps,
} from './load-dos-player'

type DosGamePlayerProps = {
  game: DosGame
  onBack: () => void
}

export function DosGamePlayer({ game, onBack }: DosGamePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<DosProps | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

        const isMobile =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(max-width: 1023px)').matches

        const player = Dos(containerRef.current, {
          url: dosAssetUrl(game.bundlePath),
          pathPrefix: dosEmulatorsPathPrefix(),
          autoStart: true,
          autoSave: true,
          // Pointer lock is desktop-oriented; on phones it can leave a blank UI.
          mouseCapture: !isMobile,
          softFullscreen: false,
          scaleControls: isMobile ? 0.4 : 0.2,
          theme: 'dark',
          lang: 'en',
          onEvent: (event) => {
            if (event === 'ci-ready' || event === 'bnd-play') {
              setStatus('ready')
            }
          },
        })

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

  return (
    <div className="flex flex-col gap-3" data-testid="dos-game-player">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">{game.title}</h2>
          <p className="text-sm text-muted-foreground">
            Progress auto-saves in this browser. On phones, open the player sidebar
            and enable Mobile controls if the pad is not already visible.
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
        className="relative w-full overflow-hidden rounded-md border border-border bg-black"
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
    </div>
  )
}
