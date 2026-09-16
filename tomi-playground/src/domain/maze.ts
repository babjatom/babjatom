/** 2D point in canvas space. */
export type Point = { x: number; y: number }

export type MazeWall = {
  x1: number
  y1: number
  x2: number
  y2: number
}

export type MazeScene = {
  walls: MazeWall[]
  path: Point[]
  cols: number
  rows: number
}

export type BuildMazeOptions = {
  width: number
  height: number
  /** Passage cells horizontally. Default 15. */
  cols?: number
  /** Passage cells vertically. Default 9. */
  rows?: number
  /** Optional RNG for deterministic tests. */
  random?: () => number
}

type Cell = { r: number; c: number }

const DIRS: Array<{ dr: number; dc: number; bit: number; opposite: number }> = [
  { dr: -1, dc: 0, bit: 1, opposite: 2 }, // N
  { dr: 1, dc: 0, bit: 2, opposite: 1 }, // S
  { dr: 0, dc: -1, bit: 4, opposite: 8 }, // W
  { dr: 0, dc: 1, bit: 8, opposite: 4 }, // E
]

function key(r: number, c: number) {
  return `${r},${c}`
}

/**
 * Recursive-backtracker maze → wall segments + BFS solution polyline.
 * Coarse grids stay ambient and solve instantly.
 */
export function buildMazeScene(options: BuildMazeOptions): MazeScene {
  const width = Math.max(1, options.width)
  const height = Math.max(1, options.height)
  const cols = Math.max(3, options.cols ?? 15)
  const rows = Math.max(3, options.rows ?? 9)
  const random = options.random ?? Math.random

  // Bitmask of open walls per cell (N=1 S=2 W=4 E=8). Start fully walled.
  const open: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0),
  )
  const visited = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false),
  )

  const stack: Cell[] = [{ r: 0, c: 0 }]
  visited[0][0] = true
  let carved = 1
  const total = rows * cols

  while (carved < total) {
    const current = stack[stack.length - 1]
    const neighbors: Array<{
      cell: Cell
      dir: (typeof DIRS)[number]
    }> = []

    for (const dir of DIRS) {
      const nr = current.r + dir.dr
      const nc = current.c + dir.dc
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      if (visited[nr][nc]) continue
      neighbors.push({ cell: { r: nr, c: nc }, dir })
    }

    if (neighbors.length === 0) {
      stack.pop()
      continue
    }

    const pick = neighbors[Math.floor(random() * neighbors.length)]
    open[current.r][current.c] |= pick.dir.bit
    open[pick.cell.r][pick.cell.c] |= pick.dir.opposite
    visited[pick.cell.r][pick.cell.c] = true
    stack.push(pick.cell)
    carved++
  }

  const cellW = width / cols
  const cellH = height / rows
  const inset = 0

  const walls: MazeWall[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = c * cellW
      const y0 = r * cellH
      const x1 = (c + 1) * cellW
      const y1 = (r + 1) * cellH
      const bits = open[r][c]

      // Draw each shared wall once: north + west, plus outer south/east.
      if ((bits & 1) === 0) {
        walls.push({
          x1: x0 + inset * cellW,
          y1: y0,
          x2: x1 - inset * cellW,
          y2: y0,
        })
      }
      if ((bits & 4) === 0) {
        walls.push({
          x1: x0,
          y1: y0 + inset * cellH,
          x2: x0,
          y2: y1 - inset * cellH,
        })
      }
      if (r === rows - 1 && (bits & 2) === 0) {
        walls.push({
          x1: x0 + inset * cellW,
          y1: y1,
          x2: x1 - inset * cellW,
          y2: y1,
        })
      }
      if (c === cols - 1 && (bits & 8) === 0) {
        walls.push({
          x1: x1,
          y1: y0 + inset * cellH,
          x2: x1,
          y2: y1 - inset * cellH,
        })
      }
    }
  }

  const start: Cell = { r: 0, c: 0 }
  const end: Cell = { r: rows - 1, c: cols - 1 }
  const pathCells = solveMaze(open, start, end)
  const rawPath = pathCells.map((cell) => ({
    x: (cell.c + 0.5) * cellW,
    y: (cell.r + 0.5) * cellH,
  }))
  const cornerRadius = Math.min(cellW, cellH) * 0.35
  const path = smoothPolyline(rawPath, cornerRadius)

  return { walls, path, cols, rows }
}

function solveMaze(open: number[][], start: Cell, end: Cell): Cell[] {
  const rows = open.length
  const cols = open[0].length
  const prev = new Map<string, string | null>()
  const queue: Cell[] = [start]
  prev.set(key(start.r, start.c), null)

  while (queue.length > 0) {
    const cur = queue.shift()!
    if (cur.r === end.r && cur.c === end.c) break

    for (const dir of DIRS) {
      if ((open[cur.r][cur.c] & dir.bit) === 0) continue
      const nr = cur.r + dir.dr
      const nc = cur.c + dir.dc
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      const nextKey = key(nr, nc)
      if (prev.has(nextKey)) continue
      prev.set(nextKey, key(cur.r, cur.c))
      queue.push({ r: nr, c: nc })
    }
  }

  const path: Cell[] = []
  let cursor: string | null = key(end.r, end.c)
  if (!prev.has(cursor)) {
    return [start, end]
  }
  while (cursor) {
    const [r, c] = cursor.split(',').map(Number)
    path.push({ r, c })
    cursor = prev.get(cursor) ?? null
  }
  path.reverse()
  return path
}

/** Round sharp polyline corners so the traveling light does not hard-snap. */
export function smoothPolyline(
  path: Point[],
  radius: number,
  samplesPerCorner = 8,
): Point[] {
  if (path.length < 3 || radius <= 0) {
    return path.map((p) => ({ ...p }))
  }

  const out: Point[] = [{ ...path[0] }]

  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1]
    const curr = path[i]
    const next = path[i + 1]
    const toPrev = { x: prev.x - curr.x, y: prev.y - curr.y }
    const toNext = { x: next.x - curr.x, y: next.y - curr.y }
    const lenPrev = Math.hypot(toPrev.x, toPrev.y)
    const lenNext = Math.hypot(toNext.x, toNext.y)
    const r = Math.min(radius, lenPrev * 0.45, lenNext * 0.45)

    if (r < 0.5 || lenPrev === 0 || lenNext === 0) {
      out.push({ ...curr })
      continue
    }

    const p1 = {
      x: curr.x + (toPrev.x / lenPrev) * r,
      y: curr.y + (toPrev.y / lenPrev) * r,
    }
    const p2 = {
      x: curr.x + (toNext.x / lenNext) * r,
      y: curr.y + (toNext.y / lenNext) * r,
    }

    out.push(p1)
    for (let s = 1; s <= samplesPerCorner; s++) {
      const t = s / (samplesPerCorner + 1)
      const u = 1 - t
      out.push({
        x: u * u * p1.x + 2 * u * t * curr.x + t * t * p2.x,
        y: u * u * p1.y + 2 * u * t * curr.y + t * t * p2.y,
      })
    }
    out.push(p2)
  }

  out.push({ ...path[path.length - 1] })
  return out
}

/** Cumulative segment lengths along a polyline. */
export function pathMetrics(path: Point[]): {
  total: number
  distances: number[]
} {
  const distances = [0]
  let total = 0
  for (let i = 1; i < path.length; i++) {
    total += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
    distances.push(total)
  }
  return { total, distances }
}

/** Point at arc-length fraction `t` in [0, 1] along the path. */
export function pointAlongPath(
  path: Point[],
  t: number,
  metrics?: { total: number; distances: number[] },
): Point {
  if (path.length === 0) return { x: 0, y: 0 }
  if (path.length === 1) return { ...path[0] }

  const { total, distances } = metrics ?? pathMetrics(path)
  if (total <= 0) return { ...path[0] }

  const target = Math.min(1, Math.max(0, t)) * total
  let i = 1
  while (i < distances.length && distances[i] < target) i++

  const a = path[i - 1]
  const b = path[Math.min(i, path.length - 1)]
  const segmentStart = distances[i - 1]
  const segmentLen = distances[Math.min(i, distances.length - 1)] - segmentStart
  const local = segmentLen > 0 ? (target - segmentStart) / segmentLen : 0

  return {
    x: a.x + (b.x - a.x) * local,
    y: a.y + (b.y - a.y) * local,
  }
}

/**
 * Trail polyline for [t0, t1] that keeps every path vertex in range.
 * Uniform resampling can chord-cut corners and flicker sharp/round.
 */
export function trailAlongPath(
  path: Point[],
  t0: number,
  t1: number,
  metrics?: { total: number; distances: number[] },
): Point[] {
  if (path.length === 0) return []
  if (path.length === 1) return [{ ...path[0] }]

  const m = metrics ?? pathMetrics(path)
  if (m.total <= 0) return [{ ...path[0] }]

  const startT = Math.min(1, Math.max(0, Math.min(t0, t1)))
  const endT = Math.min(1, Math.max(0, Math.max(t0, t1)))
  const startDist = startT * m.total
  const endDist = endT * m.total

  const points: Point[] = [pointAlongPath(path, startT, m)]
  for (let i = 0; i < path.length; i++) {
    const d = m.distances[i]
    if (d > startDist + 1e-4 && d < endDist - 1e-4) {
      points.push(path[i])
    }
  }

  const head = pointAlongPath(path, endT, m)
  const last = points[points.length - 1]
  if (
    !last ||
    Math.abs(last.x - head.x) > 1e-4 ||
    Math.abs(last.y - head.y) > 1e-4
  ) {
    points.push(head)
  }

  return points
}
