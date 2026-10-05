import { useEffect, useRef, useState } from 'react'
import { buildIfsPoints, densityToIfsCount } from '@/domain/ifs'
import { clampMazeVisibility } from '@/domain/maze-prefs'
import { cn } from '@/lib/utils'
import { useMaze } from '@/presentation/maze/maze-provider'
import { useTheme } from '@/presentation/theme/theme-provider'

const RESIZE_DEBOUNCE_MS = 120
const MIN_FRAME_MS = 50
const IFS_DPR = 1
const BRIGHTNESS_COMPENSATION = 0.96
/** Points drawn per animation frame while baking. */
const BATCH_SIZE = 400

type ThemeColors = {
  primary: string
}

type IfsRuntime = {
  paintAll: (visibility: number) => void
}

function reducedMotionQuery() {
  if (typeof window.matchMedia !== 'function') return null
  return window.matchMedia('(prefers-reduced-motion: reduce)')
}

function readThemeColors(): ThemeColors {
  const styles = getComputedStyle(document.documentElement)
  return {
    primary: styles.getPropertyValue('--primary').trim(),
  }
}

function hsl(channel: string, alphaValue: number) {
  if (!channel) return `rgba(255,255,255,${alphaValue})`
  return `hsl(${channel} / ${alphaValue})`
}

function alpha(base: number, visibility: number) {
  return Math.min(1, base * visibility * BRIGHTNESS_COMPENSATION)
}

function sizeCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  dpr: number,
) {
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function readViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

type IfsBackgroundProps = {
  className?: string
}

/**
 * Ambient IFS attractor: points baked in batches (~20 fps, DPR 1).
 */
export function IfsBackground({ className }: IfsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const runtimeRef = useRef<IfsRuntime | null>(null)
  const { background, density, visibility, ifsVariant, generation } = useMaze()
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

  const pointCount = densityToIfsCount(density, viewport.width)
  const rebuildKey = `${viewport.width}x${viewport.height}:${pointCount}:${ifsVariant}:${generation}`

  useEffect(() => {
    if (background !== 'ifs') {
      runtimeRef.current = null
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = sizeCanvas(canvas, viewport.width, viewport.height, IFS_DPR)
    if (!ctx) return

    const setAnimatingAttr = (on: boolean) => {
      canvas.dataset.ifsAnimating = on ? 'true' : 'false'
    }
    setAnimatingAttr(false)

    const { width, height } = viewport
    const count = densityToIfsCount(density, width)
    const random = seededRandom(
      generation * 9973 +
        Math.floor(width * height) +
        ifsVariant.charCodeAt(0) * 131,
    )
    const points = buildIfsPoints({
      count,
      width,
      height,
      variant: ifsVariant,
      random,
    })
    const colors = readThemeColors()

    const paintAll = (vis: number) => {
      ctx.clearRect(0, 0, width, height)
      const v = clampMazeVisibility(vis)
      ctx.fillStyle = hsl(colors.primary, alpha(0.35, v))
      for (const p of points) {
        ctx.fillRect(p.x, p.y, 1.25, 1.25)
      }
    }

    runtimeRef.current = { paintAll }

    const motionQuery = reducedMotionQuery()
    let reduced = motionQuery?.matches ?? false
    let frameId = 0
    let disposed = false
    let running = false
    let lastPaintMs = 0
    let cursor = 0

    const stopLoop = () => {
      cancelAnimationFrame(frameId)
      frameId = 0
      running = false
      if (!disposed) setAnimatingAttr(false)
    }

    const drawBatch = (vis: number) => {
      const v = clampMazeVisibility(vis)
      ctx.fillStyle = hsl(colors.primary, alpha(0.35, v))
      const end = Math.min(points.length, cursor + BATCH_SIZE)
      for (; cursor < end; cursor++) {
        const p = points[cursor]
        ctx.fillRect(p.x, p.y, 1.25, 1.25)
      }
    }

    const paint = (time: number) => {
      if (disposed || document.hidden || reduced) {
        stopLoop()
        return
      }
      if (time - lastPaintMs >= MIN_FRAME_MS) {
        lastPaintMs = time
        drawBatch(visibilityRef.current)
        if (cursor >= points.length) {
          stopLoop()
          return
        }
      }
      frameId = requestAnimationFrame(paint)
    }

    const startBake = () => {
      if (disposed || document.hidden || reduced || running) return
      if (cursor >= points.length) return
      running = true
      lastPaintMs = 0
      setAnimatingAttr(true)
      frameId = requestAnimationFrame(paint)
    }

    const begin = () => {
      stopLoop()
      cursor = 0
      ctx.clearRect(0, 0, width, height)
      if (reduced) {
        paintAll(visibilityRef.current)
        setAnimatingAttr(false)
        return
      }
      if (!document.hidden) {
        startBake()
      } else {
        paintAll(visibilityRef.current)
        cursor = points.length
        setAnimatingAttr(false)
      }
    }

    const onVisibility = () => {
      if (document.hidden) {
        stopLoop()
        return
      }
      if (cursor < points.length && !reduced) startBake()
    }

    const onMotionChange = () => {
      reduced = motionQuery?.matches ?? false
      begin()
    }

    begin()

    document.addEventListener('visibilitychange', onVisibility)
    motionQuery?.addEventListener('change', onMotionChange)

    return () => {
      disposed = true
      runtimeRef.current = null
      stopLoop()
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery?.removeEventListener('change', onMotionChange)
    }
  }, [background, density, ifsVariant, generation, viewport, theme.id])

  useEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime || background !== 'ifs') return
    runtime.paintAll(visibility)
  }, [background, visibility])

  if (background !== 'ifs') return null

  const layerClass = cn(
    'pointer-events-none fixed inset-0 z-0 h-dvh w-screen',
    className,
  )

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        data-testid="ifs-background"
        data-ifs-points={pointCount}
        data-ifs-variant={ifsVariant}
        data-ifs-visibility={visibility}
        data-ifs-generation={generation}
        data-ifs-rebuild={rebuildKey}
        className={layerClass}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-background/5"
      />
    </>
  )
}
