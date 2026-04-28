import { describe, it, expect } from 'vitest'
import {
  computeFillet,
  buildSvgPath,
  getMaxFilletRadius,
  getSegments,
  clampAnchorRadii,
} from '../geometry'
import { Anchor, TrackDesign, TRACK_DESIGN_VERSION } from '../types'

const a = (x: number, y: number, r: number, id = `${x},${y}`): Anchor => ({
  id,
  x,
  y,
  r,
})

const design = (anchors: Anchor[], closed: boolean, opts: Partial<TrackDesign> = {}): TrackDesign => ({
  version: TRACK_DESIGN_VERSION,
  bboxW: 2,
  bboxH: 2,
  strokeW: 0.1,
  closed,
  anchors,
  ...opts,
})

describe('computeFillet', () => {
  it('produces tangent points and center for a 90° corner', () => {
    const r = 0.2
    const f = computeFillet({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: -1 }, r)
    expect(f.kind).toBe('arc')
    if (f.kind !== 'arc') return
    expect(f.t1.x).toBeCloseTo(-r, 6)
    expect(f.t1.y).toBeCloseTo(0, 6)
    expect(f.t2.x).toBeCloseTo(0, 6)
    expect(f.t2.y).toBeCloseTo(-r, 6)
    expect(f.center.x).toBeCloseTo(-r, 6)
    expect(f.center.y).toBeCloseTo(-r, 6)
    expect(f.theta).toBeCloseTo(Math.PI / 2, 6)
  })

  it('skips when nearly collinear', () => {
    const f = computeFillet({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, 0.1)
    expect(f.kind).toBe('skip')
  })

  it('skips when radius is zero', () => {
    const f = computeFillet({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: -1 }, 0)
    expect(f.kind).toBe('skip')
  })

  it('sweep produces a short arc for a 90° corner', () => {
    const r = 0.2
    const f = computeFillet({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: -1 }, r)
    if (f.kind !== 'arc') throw new Error()
    const a1 = Math.atan2(f.t1.y - f.center.y, f.t1.x - f.center.x)
    const a2 = Math.atan2(f.t2.y - f.center.y, f.t2.x - f.center.x)
    const TAU = Math.PI * 2
    const span =
      f.sweep === 1
        ? (((a2 - a1) % TAU) + TAU) % TAU
        : (((a1 - a2) % TAU) + TAU) % TAU
    expect(span).toBeCloseTo(Math.PI / 2, 4)
  })
})

describe('buildSvgPath', () => {
  it('open polyline with no fillets', () => {
    const d = design([a(0.1, 0.1, 0), a(1, 0.1, 0), a(1, 1, 0)], false)
    const path = buildSvgPath(d)
    expect(path.startsWith('M')).toBe(true)
    expect(path).not.toContain('A ')
    expect(path).toContain('L')
  })

  it('open polyline with interior fillet', () => {
    const d = design([a(0.2, 0.2, 0), a(1, 0.2, 0.1), a(1, 1, 0)], false)
    const path = buildSvgPath(d)
    expect(path).toContain('A 0.1 0.1 0 0')
  })

  it('closed square with fillets ends with Z', () => {
    const d = design(
      [
        a(0.3, 0.3, 0.1),
        a(1.7, 0.3, 0.1),
        a(1.7, 1.7, 0.1),
        a(0.3, 1.7, 0.1),
      ],
      true,
    )
    const path = buildSvgPath(d)
    expect(path.endsWith('Z')).toBe(true)
    const arcs = path.match(/A /g) ?? []
    expect(arcs.length).toBe(4)
  })

  it('returns empty for too few anchors', () => {
    expect(buildSvgPath(design([a(0, 0, 0)], false))).toBe('')
    expect(buildSvgPath(design([a(0, 0, 0), a(1, 0, 0)], true))).toBe('')
  })
})

describe('getMaxFilletRadius', () => {
  it('returns 0 at endpoints of open path', () => {
    const anchors = [a(0, 0, 0), a(1, 0, 0.1), a(1, 1, 0)]
    expect(getMaxFilletRadius(anchors, 0, false)).toBe(0)
    expect(getMaxFilletRadius(anchors, 2, false)).toBe(0)
  })

  it('caps radius based on shorter adjacent leg for 90° corner', () => {
    const anchors = [a(0, 0, 0), a(1, 0, 0.1), a(1, 1, 0)]
    const max = getMaxFilletRadius(anchors, 1, false)
    expect(max).toBeCloseTo(0.5, 6)
  })

  it('huge radius for nearly collinear', () => {
    const anchors = [a(0, 0, 0), a(1, 0, 0), a(2, 0, 0)]
    expect(getMaxFilletRadius(anchors, 1, false)).toBeGreaterThan(1e5)
  })

  it('clampAnchorRadii reduces over-large r', () => {
    const anchors = [a(0, 0, 0), a(1, 0, 10), a(1, 1, 0)]
    const clamped = clampAnchorRadii(anchors, false)
    expect(clamped[1].r).toBeLessThanOrEqual(0.5 + 1e-9)
  })
})

describe('getSegments', () => {
  it('open polyline produces n-1 segments + interior arcs', () => {
    const d = design([a(0.2, 0.2, 0), a(1, 0.2, 0.1), a(1, 1, 0)], false)
    const segs = getSegments(d)
    const arcs = segs.filter((s) => s.kind === 'arc')
    const lines = segs.filter((s) => s.kind === 'line')
    expect(arcs.length).toBe(1)
    expect(lines.length).toBe(2)
  })

  it('closed square produces 4 lines + 4 arcs', () => {
    const d = design(
      [
        a(0.3, 0.3, 0.1),
        a(1.7, 0.3, 0.1),
        a(1.7, 1.7, 0.1),
        a(0.3, 1.7, 0.1),
      ],
      true,
    )
    const segs = getSegments(d)
    expect(segs.filter((s) => s.kind === 'line').length).toBe(4)
    expect(segs.filter((s) => s.kind === 'arc').length).toBe(4)
  })
})
