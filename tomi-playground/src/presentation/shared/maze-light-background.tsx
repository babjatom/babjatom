import { useEffect, useRef, useState } from 'react'
import {
  buildMazeScene,
  pathMetrics,
  pointAlongPath,
  trailAlongPath,
  type MazeScene,
} from '@/domain/maze'
import { clampMazeVisibility, densityToGrid, mazeLightSpeedPxPerSec } from '@/domain/maze-prefs'
import { cn } from '@/lib/utils'
import { useMaze } from '@/presentation/maze/maze-provider'

const TRAIL_PX = 160
const RESIZE_DEBOUNCE_MS = 120

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function readChannel(name: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
}

function hsl(channel: string, alpha: number) {
  if (!channel) return `rgba(255,255,255,${alpha})`
  return `hsl(${channel} / ${alpha})`
}

function alpha(base: number, visibility: number) {
  return Math.min(1, base * visibility)
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  scene: MazeScene,
  width: number,
  height: number,
  headDist: number,
  visibility: number,
) {
  const primary = readChannel('--primary')
  const accent = readChannel('--accent')
  const muted = readChannel('--muted-foreground')
  const v = clampMazeVisibility(visibility)

  ctx.clearRect(0, 0, width, height)

  ctx.lineCap = 'square'
  ctx.lineJoin = 'miter'
  ctx.strokeStyle = hsl(muted, alpha(0.2, v))
  ctx.lineWidth = 1.25
  for (const wall of scene.walls) {
    ctx.beginPath()
    ctx.moveTo(wall.x1, wall.y1)
    ctx.lineTo(wall.x2, wall.y2)
    ctx.stroke()
  }

  const { path } = scene
  if (path.length < 2) return

  const metrics = pathMetrics(path)
  const total = Math.max(metrics.total, 1)
  const clampedHead = ((headDist % total) + total) % total
  const headT = clampedHead / total
  const trailStartT = Math.max(0, clampedHead - TRAIL_PX) / total

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2

  ctx.beginPath()
  ctx.moveTo(path[0].x, path[0].y)
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y)
  }
  ctx.strokeStyle = hsl(primary, alpha(0.12, v))
  ctx.lineWidth = 1.5
  ctx.setLineDash([2, 6])
  ctx.stroke()
  ctx.setLineDash([])

  const trail = trailAlongPath(path, trailStartT, headT, metrics)
  if (trail.length >= 2) {
    ctx.beginPath()
    ctx.moveTo(trail[0].x, trail[0].y)
    for (let i = 1; i < trail.length; i++) {
      ctx.lineTo(trail[i].x, trail[i].y)
    }
    ctx.strokeStyle = hsl(accent, alpha(0.45, v))
    ctx.lineWidth = 2.25
    ctx.stroke()
  }

  const head = pointAlongPath(path, headT, metrics)
  const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 28)
  glow.addColorStop(0, hsl(accent, alpha(0.55, v)))
  glow.addColorStop(1, hsl(accent, 0))
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(head.x, head.y, 28, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = hsl(accent, alpha(0.95, v))
  ctx.beginPath()
  ctx.arc(head.x, head.y, 3.5, 0, Math.PI * 2)
  ctx.fill()
}

type MazeLightBackgroundProps = {
  className?: string
}

function readViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

/**
 * Fixed ambient canvas: random maze walls + light traveling the solution path
 * at a constant pixels-per-second speed.
 */
export function MazeLightBackground({ className }: MazeLightBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { background, density, visibility, generation } = useMaze()
  const visibilityRef = useRef(visibility)
  const [viewport, setViewport] = useState(readViewport)

  useEffect(() => {
    visibilityRef.current = visibility
  }, [visibility])

  useEffect(() => {
    let resizeTimer = 0
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        setViewport(readViewport())
      }, RESIZE_DEBOUNCE_MS)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const { cols, rows } = densityToGrid(density, viewport.width, viewport.height)
  const lightSpeed = mazeLightSpeedPxPerSec(viewport.width)
  const rebuildKey = `${viewport.width}x${viewport.height}:${cols}x${rows}:${generation}`

  useEffect(() => {
    if (background !== 'maze') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = viewport
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const grid = densityToGrid(density, width, height)
    const speed = mazeLightSpeedPxPerSec(width)
    const scene: MazeScene = buildMazeScene({
      width,
      height,
      cols: grid.cols,
      rows: grid.rows,
    })

    let frameId = 0
    let disposed = false

    const headDistanceAt = (timeMs: number) => {
      if (prefersReducedMotion()) {
        const total = pathMetrics(scene.path).total
        return total * 0.4
      }
      return (timeMs / 1000) * speed
    }

    const paint = (time: number) => {
      if (disposed) return
      const reduced = prefersReducedMotion()
      drawFrame(
        ctx,
        scene,
        width,
        height,
        headDistanceAt(time),
        visibilityRef.current,
      )
      if (!reduced) {
        frameId = requestAnimationFrame(paint)
      }
    }

    if (prefersReducedMotion()) {
      drawFrame(
        ctx,
        scene,
        width,
        height,
        headDistanceAt(0),
        visibilityRef.current,
      )
    } else {
      frameId = requestAnimationFrame(paint)
    }

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
    }
  }, [background, density, generation, viewport])

  if (background !== 'maze') return null

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        data-testid="maze-light-background"
        data-maze-cols={cols}
        data-maze-rows={rows}
        data-maze-visibility={visibility}
        data-maze-generation={generation}
        data-maze-rebuild={rebuildKey}
        data-maze-light-speed={lightSpeed}
        className={cn(
          'pointer-events-none fixed inset-0 z-0 h-dvh w-screen opacity-95 brightness-[0.96]',
          className,
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-background/5"
      />
    </>
  )
}
