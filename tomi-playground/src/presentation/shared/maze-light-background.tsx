import { useEffect, useRef } from 'react'
import {
  buildMazeScene,
  pathMetrics,
  pointAlongPath,
  trailAlongPath,
  type MazeScene,
} from '@/domain/maze'
import { cn } from '@/lib/utils'

const LOOP_MS = 16000
const TRAIL_FRACTION = 0.14

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

function drawFrame(
  ctx: CanvasRenderingContext2D,
  scene: MazeScene,
  width: number,
  height: number,
  headT: number,
) {
  const primary = readChannel('--primary')
  const accent = readChannel('--accent')
  const muted = readChannel('--muted-foreground')

  ctx.clearRect(0, 0, width, height)

  ctx.lineCap = 'square'
  ctx.lineJoin = 'miter'
  ctx.strokeStyle = hsl(muted, 0.22)
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

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2

  ctx.beginPath()
  ctx.moveTo(path[0].x, path[0].y)
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y)
  }
  ctx.strokeStyle = hsl(primary, 0.12)
  ctx.lineWidth = 1.5
  ctx.stroke()

  const trail = trailAlongPath(
    path,
    Math.max(0, headT - TRAIL_FRACTION),
    headT,
    metrics,
  )
  if (trail.length >= 2) {
    ctx.beginPath()
    ctx.moveTo(trail[0].x, trail[0].y)
    for (let i = 1; i < trail.length; i++) {
      ctx.lineTo(trail[i].x, trail[i].y)
    }
    ctx.strokeStyle = hsl(accent, 0.45)
    ctx.lineWidth = 2.25
    ctx.stroke()
  }

  const head = pointAlongPath(path, headT, metrics)
  const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 42)
  glow.addColorStop(0, hsl(primary, 0.55))
  glow.addColorStop(0.4, hsl(accent, 0.2))
  glow.addColorStop(1, hsl(primary, 0))
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(head.x, head.y, 42, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = hsl(primary, 0.95)
  ctx.beginPath()
  ctx.arc(head.x, head.y, 2.5, 0, Math.PI * 2)
  ctx.fill()
}

type MazeLightBackgroundProps = {
  className?: string
}

/**
 * Fixed ambient canvas: random maze walls + light traveling the solution path.
 */
export function MazeLightBackground({ className }: MazeLightBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
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
      scene = buildMazeScene({ width, height })
    }

    const paint = (time: number) => {
      if (disposed) return
      const reduced = prefersReducedMotion()
      const headT = reduced ? 0.4 : (time % LOOP_MS) / LOOP_MS
      drawFrame(ctx, scene, window.innerWidth, window.innerHeight, headT)
      if (!reduced) {
        frameId = requestAnimationFrame(paint)
      }
    }

    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        sizeCanvas()
        if (prefersReducedMotion()) {
          drawFrame(ctx, scene, window.innerWidth, window.innerHeight, 0.4)
        }
      }, 120)
    }

    sizeCanvas()
    if (prefersReducedMotion()) {
      drawFrame(ctx, scene, window.innerWidth, window.innerHeight, 0.4)
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
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      data-testid="maze-light-background"
      className={cn(
        'pointer-events-none fixed inset-0 z-0 h-dvh w-screen',
        className,
      )}
    />
  )
}
