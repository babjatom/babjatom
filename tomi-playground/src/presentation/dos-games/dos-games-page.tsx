import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/presentation/shared/reveal'
import { track } from '@/infrastructure/analytics'
import { dosGames } from './dos-games-catalog'
import { DosGamePlayer } from './dos-game-player'

export function DosGamesPage() {
  const [activeGameId, setActiveGameId] = useState<string | null>(null)
  const sessionStartedAt = useRef<number | null>(null)

  const startGame = useCallback((gameId: string) => {
    sessionStartedAt.current = Date.now()
    track('Dos Game Started', { game_id: gameId })
    setActiveGameId(gameId)
  }, [])

  const exitGame = useCallback(() => {
    if (activeGameId) {
      const started = sessionStartedAt.current ?? Date.now()
      track('Dos Game Exited', {
        game_id: activeGameId,
        session_ms: Math.max(0, Date.now() - started),
      })
    }
    sessionStartedAt.current = null
    setActiveGameId(null)
  }, [activeGameId])
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-8">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Dos games
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          A small curated shelf of shareware and freeware DOS classics, playable
          in the browser. Saves stay on this device.
        </p>
      </header>

      <Reveal as="section" className="flex flex-col gap-4" aria-label="Game catalog">
        <ul className="flex flex-col gap-6">
          {dosGames.map((game) => (
            <li
              key={game.id}
              className="flex flex-col gap-3 border-b border-border pb-6 last:border-b-0 last:pb-0"
            >
              <div>
                <h2 className="font-display text-2xl font-semibold">{game.title}</h2>
                {game.summary ? (
                  <p className="mt-1 text-muted-foreground">{game.summary}</p>
                ) : null}
                <p className="mt-2 text-sm text-muted-foreground">{game.credit}</p>
              </div>
              {activeGameId === game.id ? null : (
                <div>
                  <Button type="button" onClick={() => startGame(game.id)}>
                    Play {game.title}
                  </Button>
                </div>
              )}
              {activeGameId === game.id ? (
                <DosGamePlayer game={game} onBack={exitGame} />
              ) : null}
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  )
}
