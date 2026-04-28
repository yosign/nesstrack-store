import { describe, it, expect } from 'vitest'
import { validateBounds, segmentExtent, maxStrokeForDesign } from '../bounds'
import { Anchor, TrackDesign, TRACK_DESIGN_VERSION } from '../types'

const a = (x: number, y: number, r: number, id = `${x},${y}`): Anchor => ({
  id,
  x,
  y,
  r,
})

const design = (
  anchors: Anchor[],
  closed: boolean,
  opts: Partial<TrackDesign> = {},
): TrackDesign => ({
  version: TRACK_DESIGN_VERSION,
  bboxW: 2,
  bboxH: 2,
  strokeW: 0.1,
  closed,
  anchors,
  ...opts,
})

describe('validateBounds', () => {
  it('passes for an inset closed square', () => {
    const d = design(
      [
        a(0.3, 0.3, 0.1),
        a(1.7, 0.3, 0.1),
        a(1.7, 1.7, 0.1),
        a(0.3, 1.7, 0.1),
      ],
      true,
    )
    const r = validateBounds(d)
    expect(r.ok).toBe(true)
    expect(r.violations).toHaveLength(0)
  })

  it('fails when stroke spills out of bbox', () => {
    const d = design(
      [a(0.0, 0.5, 0), a(2.0, 0.5, 0), a(2.0, 1.5, 0), a(0.0, 1.5, 0)],
      true,
      { strokeW: 0.2 },
    )
    const r = validateBounds(d)
    expect(r.ok).toBe(false)
    expect(r.violations.some((v) => v.side === 'left')).toBe(true)
    expect(r.violations.some((v) => v.side === 'right')).toBe(true)
  })

  it('detects arc bulge exceeding bbox', () => {
    const d = design(
      [
        a(0.3, 0.05, 0.05),
        a(1.7, 0.05, 0.05),
        a(1.7, 1.7, 0.05),
        a(0.3, 1.7, 0.05),
      ],
      true,
      { strokeW: 0.2 },
    )
    const r = validateBounds(d)
    expect(r.ok).toBe(false)
    expect(r.violations.some((v) => v.side === 'top')).toBe(true)
  })
})

describe('segmentExtent', () => {
  it('horizontal line', () => {
    const ext = segmentExtent({ kind: 'line', a: { x: 0, y: 1 }, b: { x: 2, y: 1 } })
    expect(ext.minX).toBe(0)
    expect(ext.maxX).toBe(2)
    expect(ext.minY).toBe(1)
    expect(ext.maxY).toBe(1)
  })

  it('quarter arc covering positive-x cardinal does not extend past r in y', () => {
    const ext = segmentExtent({
      kind: 'arc',
      center: { x: 0, y: 0 },
      r: 1,
      a1: 0,
      a2: Math.PI / 2,
      sweep: 1,
    })
    expect(ext.maxX).toBeCloseTo(1, 6)
    expect(ext.maxY).toBeCloseTo(1, 6)
  })
})

describe('maxStrokeForDesign', () => {
  it('returns headroom diameter when path sits centered', () => {
    const d = design(
      [a(0.5, 0.5, 0), a(1.5, 0.5, 0), a(1.5, 1.5, 0), a(0.5, 1.5, 0)],
      true,
      { strokeW: 0.05 },
    )
    const m = maxStrokeForDesign(d)
    expect(m).toBeCloseTo(1, 4)
  })
})
