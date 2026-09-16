/** 2D point in canvas space. */
export type Point = { x: number; y: number }

type GridNode = Point & {
  r: number
  c: number
  dist: number
  prev: GridNode | null
}

export type PathLightOptions = {
  width: number
  height: number
  /** Horizontal cells. Keep low for instant solves. Default 10. */
  cols?: number
  /** Vertical cells. Default 7. */
  rows?: number
  /** Optional RNG for deterministic tests. */
  random?: () => number
}

/**
 * Build a sparse organic grid, run Dijkstra corner-to-corner, return the path.
 * Tiny grids (~70 nodes) finish well under a millisecond.
 */
export function buildDijkstraPath(options: PathLightOptions): Point[] {
  const width = Math.max(1, options.width)
  const height = Math.max(1, options.height)
  const cols = Math.max(3, options.cols ?? 10)
  const rows = Math.max(3, options.rows ?? 7)
  const random = options.random ?? Math.random

  const cellW = width / cols
  const cellH = height / rows
  const nodes: GridNode[][] = []

  for (let r = 0; r < rows; r++) {
    nodes[r] = []
    for (let c = 0; c < cols; c++) {
      nodes[r][c] = {
        x: (c + 0.2 + random() * 0.6) * cellW,
        y: (r + 0.2 + random() * 0.6) * cellH,
        r,
        c,
        dist: Number.POSITIVE_INFINITY,
        prev: null,
      }
    }
  }

  const start = nodes[0][0]
  const end = nodes[rows - 1][cols - 1]
  start.dist = 0

  // Flat set + linear scan beats sort-per-step for ~70 nodes.
  const inOpen = new Set<GridNode>()
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      inOpen.add(nodes[r][c])
    }
  }

  while (inOpen.size > 0) {
    let best: GridNode | null = null
    for (const node of inOpen) {
      if (!best || node.dist < best.dist) best = node
    }
    if (!best || best.dist === Number.POSITIVE_INFINITY) break

    inOpen.delete(best)
    if (best === end) break

    const neighbors: GridNode[] = []
    if (best.r > 0) neighbors.push(nodes[best.r - 1][best.c])
    if (best.r < rows - 1) neighbors.push(nodes[best.r + 1][best.c])
    if (best.c > 0) neighbors.push(nodes[best.r][best.c - 1])
    if (best.c < cols - 1) neighbors.push(nodes[best.r][best.c + 1])
    // Light diagonals so paths feel less stair-stepped.
    if (best.r > 0 && best.c > 0) neighbors.push(nodes[best.r - 1][best.c - 1])
    if (best.r > 0 && best.c < cols - 1)
      neighbors.push(nodes[best.r - 1][best.c + 1])
    if (best.r < rows - 1 && best.c > 0)
      neighbors.push(nodes[best.r + 1][best.c - 1])
    if (best.r < rows - 1 && best.c < cols - 1)
      neighbors.push(nodes[best.r + 1][best.c + 1])

    for (const neighbor of neighbors) {
      if (!inOpen.has(neighbor)) continue
      const step = Math.hypot(best.x - neighbor.x, best.y - neighbor.y)
      const alt = best.dist + step
      if (alt < neighbor.dist) {
        neighbor.dist = alt
        neighbor.prev = best
      }
    }
  }

  const path: Point[] = []
  let cursor: GridNode | null = end
  while (cursor) {
    path.push({ x: cursor.x, y: cursor.y })
    cursor = cursor.prev
  }
  path.reverse()

  if (path.length < 2 || path[0].x !== start.x || path[0].y !== start.y) {
    return [
      { x: start.x, y: start.y },
      { x: end.x, y: end.y },
    ]
  }

  return path
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
export function pointAlongPath(path: Point[], t: number): Point {
  if (path.length === 0) return { x: 0, y: 0 }
  if (path.length === 1) return { ...path[0] }

  const { total, distances } = pathMetrics(path)
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
