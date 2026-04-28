import { TrackDesign, Vec2 } from './types'
import { getSegments, Segment } from './geometry'

const TAU = Math.PI * 2
const normAngle = (a: number): number => ((a % TAU) + TAU) % TAU

function isAngleOnArc(
  phi: number,
  a1: number,
  a2: number,
  sweep: 0 | 1,
): boolean {
  const eps = 1e-9
  if (sweep === 1) {
    const span = normAngle(a2 - a1)
    const at = normAngle(phi - a1)
    return at <= span + eps
  }
  const span = normAngle(a1 - a2)
  const at = normAngle(a1 - phi)
  return at <= span + eps
}

export type SegmentExtent = { minX: number; maxX: number; minY: number; maxY: number }

export function segmentExtent(seg: Segment): SegmentExtent {
  if (seg.kind === 'line') {
    return {
      minX: Math.min(seg.a.x, seg.b.x),
      maxX: Math.max(seg.a.x, seg.b.x),
      minY: Math.min(seg.a.y, seg.b.y),
      maxY: Math.max(seg.a.y, seg.b.y),
    }
  }
  const t1: Vec2 = {
    x: seg.center.x + seg.r * Math.cos(seg.a1),
    y: seg.center.y + seg.r * Math.sin(seg.a1),
  }
  const t2: Vec2 = {
    x: seg.center.x + seg.r * Math.cos(seg.a2),
    y: seg.center.y + seg.r * Math.sin(seg.a2),
  }
  let minX = Math.min(t1.x, t2.x)
  let maxX = Math.max(t1.x, t2.x)
  let minY = Math.min(t1.y, t2.y)
  let maxY = Math.max(t1.y, t2.y)
  const candidates: { angle: number; dx: number; dy: number }[] = [
    { angle: 0, dx: 1, dy: 0 },
    { angle: Math.PI / 2, dx: 0, dy: 1 },
    { angle: Math.PI, dx: -1, dy: 0 },
    { angle: -Math.PI / 2, dx: 0, dy: -1 },
  ]
  for (const c of candidates) {
    if (isAngleOnArc(c.angle, seg.a1, seg.a2, seg.sweep)) {
      const x = seg.center.x + seg.r * c.dx
      const y = seg.center.y + seg.r * c.dy
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  return { minX, maxX, minY, maxY }
}

export type BoundsViolation = {
  segmentIndex: number
  side: 'left' | 'right' | 'top' | 'bottom'
  excess: number
}

export type BoundsResult = {
  ok: boolean
  violations: BoundsViolation[]
  extent: SegmentExtent
}

export function validateBounds(design: TrackDesign): BoundsResult {
  const segments = getSegments(design)
  const half = design.strokeW / 2
  const violations: BoundsViolation[] = []
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  segments.forEach((seg, idx) => {
    const ext = segmentExtent(seg)
    const sMinX = ext.minX - half
    const sMaxX = ext.maxX + half
    const sMinY = ext.minY - half
    const sMaxY = ext.maxY + half
    if (sMinX < minX) minX = sMinX
    if (sMaxX > maxX) maxX = sMaxX
    if (sMinY < minY) minY = sMinY
    if (sMaxY > maxY) maxY = sMaxY

    if (sMinX < 0) violations.push({ segmentIndex: idx, side: 'left', excess: -sMinX })
    if (sMaxX > design.bboxW) violations.push({ segmentIndex: idx, side: 'right', excess: sMaxX - design.bboxW })
    if (sMinY < 0) violations.push({ segmentIndex: idx, side: 'top', excess: -sMinY })
    if (sMaxY > design.bboxH) violations.push({ segmentIndex: idx, side: 'bottom', excess: sMaxY - design.bboxH })
  })

  return {
    ok: violations.length === 0,
    violations,
    extent: { minX, maxX, minY, maxY },
  }
}

export function maxStrokeForDesign(design: TrackDesign): number {
  const probe: TrackDesign = { ...design, strokeW: 0 }
  const segments = getSegments(probe)
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const seg of segments) {
    const ext = segmentExtent(seg)
    if (ext.minX < minX) minX = ext.minX
    if (ext.maxX > maxX) maxX = ext.maxX
    if (ext.minY < minY) minY = ext.minY
    if (ext.maxY > maxY) maxY = ext.maxY
  }
  if (!isFinite(minX)) return 0
  const left = minX
  const right = design.bboxW - maxX
  const top = minY
  const bottom = design.bboxH - maxY
  return 2 * Math.max(0, Math.min(left, right, top, bottom))
}
