import Flatten from '@flatten-js/core'
import { areaPaths, difference, FillRule, type Path64, type Paths64 } from 'clipper2-ts'
import { BoundaryPathV2, PointV2, TrackDocumentV2, ValidationIssueV2, ValidationResultV2 } from './types'

const INTEGER_SCALE = 100_000
const SAMPLE_STEPS = 10

export type CubicSegmentV2 = {
  start: PointV2
  c1: PointV2
  c2: PointV2
  end: PointV2
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export function cubicSegmentAt(path: BoundaryPathV2, index: number): CubicSegmentV2 {
  const points = path.nodes
  const count = points.length
  const start = points[index % count]
  const end = points[(index + 1) % count]
  const previous = points[(index - 1 + count) % count]
  const next = points[(index + 2) % count]
  const factor = clamp(path.smoothing, 0, 1.4) / 6

  return {
    start,
    c1: {
      x: start.x + (end.x - previous.x) * factor,
      y: start.y + (end.y - previous.y) * factor,
    },
    c2: {
      x: end.x - (next.x - start.x) * factor,
      y: end.y - (next.y - start.y) * factor,
    },
    end,
  }
}

export function boundarySegmentD(path: BoundaryPathV2, index: number): string {
  const segment = cubicSegmentAt(path, index)
  return `M ${segment.start.x} ${segment.start.y} C ${segment.c1.x} ${segment.c1.y}, ${segment.c2.x} ${segment.c2.y}, ${segment.end.x} ${segment.end.y}`
}

export function boundaryPathD(path: BoundaryPathV2): string {
  if (path.nodes.length < 3) return ''
  return path.nodes.map((_, index) => {
    const segment = cubicSegmentAt(path, index)
    return index === 0
      ? `M ${segment.start.x} ${segment.start.y} C ${segment.c1.x} ${segment.c1.y}, ${segment.c2.x} ${segment.c2.y}, ${segment.end.x} ${segment.end.y}`
      : `C ${segment.c1.x} ${segment.c1.y}, ${segment.c2.x} ${segment.c2.y}, ${segment.end.x} ${segment.end.y}`
  }).join(' ') + ' Z'
}

function cubicPoint(segment: CubicSegmentV2, t: number): PointV2 {
  const mt = 1 - t
  const mt2 = mt * mt
  const t2 = t * t
  return {
    x: mt2 * mt * segment.start.x + 3 * mt2 * t * segment.c1.x + 3 * mt * t2 * segment.c2.x + t2 * t * segment.end.x,
    y: mt2 * mt * segment.start.y + 3 * mt2 * t * segment.c1.y + 3 * mt * t2 * segment.c2.y + t2 * t * segment.end.y,
  }
}

export function sampleBoundary(path: BoundaryPathV2, steps = SAMPLE_STEPS): PointV2[] {
  if (path.nodes.length < 3) return path.nodes
  return path.nodes.flatMap((_, index) => {
    const segment = cubicSegmentAt(path, index)
    return Array.from({ length: steps }, (_unused, step) => cubicPoint(segment, step / steps))
  })
}

function toPath64(points: PointV2[]): Path64 {
  return points.map((point) => ({
    x: Math.round(point.x * INTEGER_SCALE),
    y: Math.round(point.y * INTEGER_SCALE),
  }))
}

export function canonicalSurface(document: TrackDocumentV2): Paths64 {
  const { width, height } = document.canvas
  const outer: Path64 = toPath64([
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ])
  const holes = document.paths.map((path) => toPath64(sampleBoundary(path)))
  return holes.length > 0 ? difference([outer], holes, FillRule.NonZero) : [outer]
}

function flattenPolygon(path: BoundaryPathV2) {
  return new Flatten.Polygon(sampleBoundary(path).map((point) => [point.x, point.y] as [number, number]))
}

function allInsideCanvas(path: BoundaryPathV2, width: number, height: number): boolean {
  return sampleBoundary(path).every((point) => point.x >= 0 && point.y >= 0 && point.x <= width && point.y <= height)
}

export function validateTrackDocument(document: TrackDocumentV2): ValidationResultV2 {
  const issues: ValidationIssueV2[] = []
  const polygons = new Map<string, ReturnType<typeof flattenPolygon>>()

  for (const path of document.paths) {
    if (path.nodes.length < 3) {
      issues.push({ id: `${path.id}-nodes`, severity: 'error', boundaryId: path.id, message: `${path.name} 至少需要 3 个边界节点` })
      continue
    }
    if (!allInsideCanvas(path, document.canvas.width, document.canvas.height)) {
      issues.push({ id: `${path.id}-outside`, severity: 'error', boundaryId: path.id, message: `${path.name} 超出成品边界` })
    }
    try {
      const polygon = flattenPolygon(path)
      polygons.set(path.id, polygon)
      if (!polygon.isValid()) {
        issues.push({ id: `${path.id}-invalid`, severity: 'error', boundaryId: path.id, message: `${path.name} 存在边界自交或退化线段` })
      }
      if (polygon.area() < document.constraints.minFeature ** 2) {
        issues.push({ id: `${path.id}-small`, severity: 'warning', boundaryId: path.id, message: `${path.name} 面积过小，可能无法稳定印刷` })
      }
    } catch {
      issues.push({ id: `${path.id}-geometry`, severity: 'error', boundaryId: path.id, message: `${path.name} 无法生成有效区域` })
    }
  }

  for (let firstIndex = 0; firstIndex < document.paths.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < document.paths.length; secondIndex += 1) {
      const first = document.paths[firstIndex]
      const second = document.paths[secondIndex]
      const firstPolygon = polygons.get(first.id)
      const secondPolygon = polygons.get(second.id)
      if (!firstPolygon || !secondPolygon) continue
      try {
        const intersections = firstPolygon.intersect(secondPolygon)
        const nested = firstPolygon.contains(secondPolygon) || secondPolygon.contains(firstPolygon)
        if (intersections.length > 0 || nested) {
          issues.push({
            id: `${first.id}-${second.id}-overlap`,
            severity: 'error',
            boundaryId: second.id,
            message: `${first.name} 与 ${second.name} 重叠`,
          })
          continue
        }
        const [distance] = firstPolygon.distanceTo(secondPolygon)
        if (distance < document.constraints.minGap) {
          issues.push({
            id: `${first.id}-${second.id}-gap`,
            severity: 'warning',
            boundaryId: second.id,
            message: `${first.name} 与 ${second.name} 间距仅 ${(distance * 100).toFixed(0)}cm`,
          })
        }
      } catch {
        // Invalid polygons already receive a more actionable issue above.
      }
    }
  }

  let normalized: Paths64 = []
  try {
    normalized = canonicalSurface(document)
  } catch {
    issues.push({ id: 'canonical-surface', severity: 'error', message: '区域规范化失败，请修复重叠边界' })
  }

  const asphaltArea = Math.abs(areaPaths(normalized)) / (INTEGER_SCALE * INTEGER_SCALE)
  return {
    valid: !issues.some((issue) => issue.severity === 'error'),
    issues,
    asphaltArea,
    normalizedPathCount: normalized.length,
  }
}

export function translateBoundary(path: BoundaryPathV2, dx: number, dy: number): BoundaryPathV2 {
  return { ...path, nodes: path.nodes.map((point) => ({ x: point.x + dx, y: point.y + dy })) }
}

export function scaleBoundary(path: BoundaryPathV2, scale: number): BoundaryPathV2 {
  const center = boundaryCenter(path)
  return {
    ...path,
    nodes: path.nodes.map((point) => ({
      x: center.x + (point.x - center.x) * scale,
      y: center.y + (point.y - center.y) * scale,
    })),
  }
}

export function rotateBoundary(path: BoundaryPathV2, radians: number): BoundaryPathV2 {
  const center = boundaryCenter(path)
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  return {
    ...path,
    nodes: path.nodes.map((point) => {
      const x = point.x - center.x
      const y = point.y - center.y
      return { x: center.x + x * cos - y * sin, y: center.y + x * sin + y * cos }
    }),
  }
}

export function boundaryCenter(path: BoundaryPathV2): PointV2 {
  return path.nodes.reduce((center, point) => ({ x: center.x + point.x / path.nodes.length, y: center.y + point.y / path.nodes.length }), { x: 0, y: 0 })
}
