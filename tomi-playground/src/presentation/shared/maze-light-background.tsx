import { useEffect, useRef, useState } from 'react'
import {
  buildMazeScene,
  pathMetrics,
  pointAlongPath,
  trailAlongPath,
  type MazeScene,
} from '@/domain/maze'
import {
  clampMazeVisibility,
  densityToGrid,
  mazeLightSpeedPxPerSec,
} from '@/domain/maze-prefs'
import { cn } from '@/lib/utils'
import { useMaze } from '@/presentation/maze/maze-provider'
import { useTheme } from '@/presentation/theme/theme-provider'

const TRAIL_PX = 160
const RESIZE_DEBOUNCE_MS = 120
/** Compensate for removing CSS brightness-[0.96] (~4% dim). */
const BRIGHTNESS_COMPENSATION = 0.96

type ThemeColors = {
  primary: string
  accent: string
  muted: string
}

type PathMetrics = ReturnType<typeof pathMetrics>

type MazeRuntime = {
  paintStatic: (visibility: number) => void
  composite: (timeMs: number) => void
}

function reducedMotionQuery() {
  if (typeof window.matchMedia !== 'function') return null
  return window.matchMedia('(prefers-reduced-motion: reduce)')
}

function readThemeColors(): ThemeColors {
  const styles = getComputedStyle(document.documentElement)
  return {
    primary: styles.getPropertyValue('--primary').trim(),
    accent: styles.getPropertyValue('--accent').trim(),
    muted: styles.getPropertyValue('--muted-foreground').trim(),
  }
}

function hsl(channel: string, alphaValue: number) {
  if (!channel) return `rgba(255,255,255,${alphaValue})`
  return `hsl(${channel} / ${alphaValue})`
}

function alpha(base: number, visibility: number) {
  return Math.min(1, base * visibility * BRIGHTNESS_COMPENSATION)
}

function bakeStaticLayer(
  target: HTMLCanvasElement,
  scene: MazeScene,
  width: number,
  height: number,
  dpr: number,
  visibility: number,
  colors: ThemeColors,
) {
  target.width = Math.floor(width * dpr)
  target.height = Math.floor(height * dpr)
  const ctx = target.getContext('2d')
  if (!ctx) return

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const v = clampMazeVisibility(visibility)

  ctx.lineCap = 'square'
  ctx.lineJoin = 'miter'
  ctx.strokeStyle = hsl(colors.muted, alpha(0.2, v))
  ctx.lineWidth = 1.25
  ctx.beginPath()
  for (const wall of scene.walls) {
    ctx.moveTo(wall.x1, wall.y1)
    ctx.lineTo(wall.x2, wall.y2)
  }
  ctx.stroke()

  const { path } = scene
  if (path.length < 2) return

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  ctx.beginPath()
  ctx.moveTo(path[0].x, path[0].y)
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y)
  }
  ctx.strokeStyle = hsl(colors.primary, alpha(0.12, v))
  ctx.lineWidth = 1.5
  ctx.setLineDash([2, 6])
  ctx.stroke()
  ctx.setLineDash([])
}

function drawLight(
  ctx: CanvasRenderingContext2D,
  path: MazeScene['path'],
  metrics: PathMetrics,
  headDist: number,
  visibility: number,
  colors: ThemeColors,
) {
  if (path.length < 2) return

  const v = clampMazeVisibility(visibility)
  const total = Math.max(metrics.total, 1)
  const clampedHead = ((headDist % total) + total) % total
  const headT = clampedHead / total
  const trailStartT = Math.max(0, clampedHead - TRAIL_PX) / total

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2

  const trail = trailAlongPath(path, trailStartT, headT, metrics)
  if (trail.length >= 2) {
    ctx.beginPath()
    ctx.moveTo(trail[0].x, trail[0].y)
    for (let i = 1; i < trail.length; i++) {
      ctx.lineTo(trail[i].x, trail[i].y)
    }
    ctx.strokeStyle = hsl(colors.accent, alpha(0.45, v))
    ctx.lineWidth = 2.25
    ctx.stroke()
  }

  const head = pointAlongPath(path, headT, metrics)
  const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 28)
  glow.addColorStop(0, hsl(colors.accent, alpha(0.55, v)))
  glow.addColorStop(1, hsl(colors.accent, 0))
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(head.x, head.y, 28, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = hsl(colors.accent, alpha(0.95, v))
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
  const runtimeRef = useRef<MazeRuntime | null>(null)
  const { background, density, visibility, generation } = useMaze()
  const { theme } = useTheme()
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
    if (background !== 'maze') {
      runtimeRef.current = null
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const setAnimatingAttr = (on: boolean) => {
      canvas.dataset.mazeAnimating = on ? 'true' : 'false'
    }
    setAnimatingAttr(false)

    const { width, height } = viewport
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const grid = densityToGrid(density, width, height)
    const speed = mazeLightSpeedPxPerSec(width)
    const scene = buildMazeScene({
      width,
      height,
      cols: grid.cols,
      rows: grid.rows,
    })
    const metrics = pathMetrics(scene.path)
    const staticCanvas = document.createElement('canvas')
    const colors = readThemeColors()

    const paintStatic = (vis: number) => {
      bakeStaticLayer(staticCanvas, scene, width, height, dpr, vis, colors)
    }

    const headDistanceAt = (timeMs: number, reduced: boolean) => {
      if (reduced) {
        return Math.max(metrics.total, 1) * 0.4
      }
      return (timeMs / 1000) * speed
    }

    const composite = (timeMs: number, reduced: boolean) => {
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(staticCanvas, 0, 0, width, height)
      drawLight(
        ctx,
        scene.path,
        metrics,
        headDistanceAt(timeMs, reduced),
        visibilityRef.current,
        colors,
      )
    }

    paintStatic(visibilityRef.current)

    const runtime: MazeRuntime = {
      paintStatic,
      composite: (timeMs) =>
        composite(timeMs, reducedMotionQuery()?.matches ?? false),
    }
    runtimeRef.current = runtime

    const motionQuery = reducedMotionQuery()
    let reduced = motionQuery?.matches ?? false
    let frameId = 0
    let disposed = false
    let running = false

    const stopLoop = () => {
      cancelAnimationFrame(frameId)
      frameId = 0
      running = false
      if (!disposed) setAnimatingAttr(false)
    }

    const paint = (time: number) => {
      if (disposed || document.hidden || reduced) {
        stopLoop()
        return
      }
      composite(time, false)
      frameId = requestAnimationFrame(paint)
    }

    const startLoop = () => {
      if (disposed || document.hidden || reduced || running) return
      running = true
      setAnimatingAttr(true)
      frameId = requestAnimationFrame(paint)
    }

    const onVisibility = () => {
      if (document.hidden) {
        stopLoop()
        return
      }
      startLoop()
    }

    const onMotionChange = () => {
      reduced = motionQuery?.matches ?? false
      if (reduced) {
        stopLoop()
        composite(0, true)
        return
      }
      startLoop()
    }

    if (reduced) {
      composite(0, true)
      setAnimatingAttr(false)
    } else if (!document.hidden) {
      startLoop()
    } else {
      composite(0, false)
      setAnimatingAttr(false)
    }

    document.addEventListener('visibilitychange', onVisibility)
    motionQuery?.addEventListener('change', onMotionChange)

    return () => {
      disposed = true
      runtimeRef.current = null
      stopLoop()
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery?.removeEventListener('change', onMotionChange)
    }
  }, [background, density, generation, viewport, theme.id])

  useEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime || background !== 'maze') return
    runtime.paintStatic(visibility)
    runtime.composite(performance.now())
  }, [background, visibility])

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
          'pointer-events-none fixed inset-0 z-0 h-dvh w-screen opacity-95',
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
