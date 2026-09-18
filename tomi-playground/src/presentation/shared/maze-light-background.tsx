import { useEffect, useRef } from 'react'
import {
  buildMazeScene,
  pathMetrics,
  pointAlongPath,
  trailAlongPath,
  type MazeScene,
} from '@/domain/maze'
import { clampMazeVisibility, densityToGrid } from '@/domain/maze-prefs'
import { cn } from '@/lib/utils'
import { useMaze } from '@/presentation/maze/maze-provider'

const SPEED_PX_PER_SEC = 280
const TRAIL_PX = 160

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
  const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 48)
  glow.addColorStop(0, hsl(primary, alpha(0.5, v)))
  glow.addColorStop(0.4, hsl(accent, alpha(0.18, v)))
  glow.addColorStop(1, hsl(primary, 0))
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(head.x, head.y, 48, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = hsl(primary, alpha(0.9, v))
  ctx.beginPath()
  ctx.arc(head.x, head.y, 2.5, 0, Math.PI * 2)
  ctx.fill()
}

type MazeLightBackgroundProps = {
  className?: string
}

/**
 * Fixed ambient canvas: random maze walls + light traveling the solution path
 * at a constant pixels-per-second speed.
 */
export function MazeLightBackground({ className }: MazeLightBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { background, density, visibility, generation } = useMaze()
  const visibilityRef = useRef(visibility)

  useEffect(() => {
    visibilityRef.current = visibility
  }, [visibility])

  const { cols, rows } = densityToGrid(density)

  useEffect(() => {
    if (background !== 'maze') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let scene: MazeScene = { walls: [], path: [], cols: 0, rows: 0 }
    let frameId = 0
    let disposed = false
    let resizeTimer = 0

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      scene = buildMazeScene({ width, height, cols, rows })
    }

    const headDistanceAt = (timeMs: number) => {
      if (prefersReducedMotion()) {
        const total = pathMetrics(scene.path).total
        return total * 0.4
      }
      return (timeMs / 1000) * SPEED_PX_PER_SEC
    }

    const paint = (time: number) => {
      if (disposed) return
      const reduced = prefersReducedMotion()
      drawFrame(
        ctx,
        scene,
        window.innerWidth,
        window.innerHeight,
        headDistanceAt(time),
        visibilityRef.current,
      )
      if (!reduced) {
        frameId = requestAnimationFrame(paint)
      }
    }

    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        sizeCanvas()
        if (prefersReducedMotion()) {
          drawFrame(
            ctx,
            scene,
            window.innerWidth,
            window.innerHeight,
            headDistanceAt(0),
            visibilityRef.current,
          )
        }
      }, 120)
    }

    sizeCanvas()
    if (prefersReducedMotion()) {
      drawFrame(
        ctx,
        scene,
        window.innerWidth,
        window.innerHeight,
        headDistanceAt(0),
        visibilityRef.current,
      )
    } else {
      frameId = requestAnimationFrame(paint)
    }

    window.addEventListener('resize', onResize)
    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
    }
  }, [background, cols, rows, generation])

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
