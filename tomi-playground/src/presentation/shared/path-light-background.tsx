import { useEffect, useRef } from 'react'
import {
  buildDijkstraPath,
  pointAlongPath,
  type Point,
} from '@/domain/path-light'
import { cn } from '@/lib/utils'

const LOOP_MS = 14000
const TRAIL_FRACTION = 0.18

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
  path: Point[],
  width: number,
  height: number,
  headT: number,
) {
  const primary = readChannel('--primary')
  const accent = readChannel('--accent')

  ctx.clearRect(0, 0, width, height)

  if (path.length < 2) return

  // Soft residual trail of the whole route — barely there.
  ctx.beginPath()
  ctx.moveTo(path[0].x, path[0].y)
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y)
  }
  ctx.strokeStyle = hsl(primary, 0.08)
  ctx.lineWidth = 1.25
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()

  const trailStart = Math.max(0, headT - TRAIL_FRACTION)
  const steps = 28
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const t = trailStart + ((headT - trailStart) * i) / steps
    const p = pointAlongPath(path, t)
    if (i === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  }
  ctx.strokeStyle = hsl(accent, 0.35)
  ctx.lineWidth = 2
  ctx.stroke()

  const head = pointAlongPath(path, headT)
  const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 48)
  glow.addColorStop(0, hsl(primary, 0.55))
  glow.addColorStop(0.35, hsl(accent, 0.22))
  glow.addColorStop(1, hsl(primary, 0))
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(head.x, head.y, 48, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = hsl(primary, 0.95)
  ctx.beginPath()
  ctx.arc(head.x, head.y, 2.75, 0, Math.PI * 2)
  ctx.fill()
}

type PathLightBackgroundProps = {
  className?: string
}

/**
 * Fixed ambient canvas: one Dijkstra path, one traveling light.
 * Theme tokens drive color; reduced-motion freezes the head on the path.
 */
export function PathLightBackground({ className }: PathLightBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let path: Point[] = []
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
      path = buildDijkstraPath({ width, height })
    }

    const paint = (time: number) => {
      if (disposed) return
      const reduced = prefersReducedMotion()
      const headT = reduced ? 0.35 : (time % LOOP_MS) / LOOP_MS
      drawFrame(ctx, path, window.innerWidth, window.innerHeight, headT)
      if (!reduced) {
        frameId = requestAnimationFrame(paint)
      }
    }

    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        sizeCanvas()
        if (prefersReducedMotion()) {
          drawFrame(ctx, path, window.innerWidth, window.innerHeight, 0.35)
        }
      }, 120)
    }

    sizeCanvas()
    if (prefersReducedMotion()) {
      drawFrame(ctx, path, window.innerWidth, window.innerHeight, 0.35)
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
      data-testid="path-light-background"
      className={cn(
        'pointer-events-none fixed inset-0 z-0 h-dvh w-screen',
        className,
      )}
    />
  )
}
