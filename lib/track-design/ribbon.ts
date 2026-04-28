import { Anchor, TrackDesign, Vec2 } from './types'
import { computeFillet, widthAt } from './geometry'

const TAU = Math.PI * 2
const SAMPLE_DENSITY = 0.025

type FilletEntry =
  | { kind: 'skip' }
  | {
      kind: 'arc'
      t1: Vec2
      t2: Vec2
      center: Vec2
      r: number
      sweep: 0 | 1
    }

type TaggedSegment =
  | { kind: 'line'; a: Vec2; b: Vec2; w0: number; w1: number }
  | {
      kind: 'arc'
      center: Vec2
      r: number
      a1: number
      a2: number
      sweep: 0 | 1
      w: number
    }

export type CenterSample = {
  p: Vec2
  /** unit tangent (direction of travel) */
  t: Vec2
  /** total width at this point (meters) */
  w: number
}

export type RibbonResult = {
  samples: CenterSample[]
  outer: Vec2[]
  inner: Vec2[]
  closed: boolean
  /** filled body path (asphalt) */
  bodyD: string
  /** outer-edge stroked path */
  outerD: string
  /** inner-edge stroked path (closed only) */
  innerD: string
  /** centerline path (raw fillet path) */
  centerD: string
}

const fmt = (n: number): string => {
  if (Math.abs(n) < 1e-9) return '0'
  return Number(n.toFixed(5)).toString()
}
const pt = (p: Vec2): string => `${fmt(p.x)} ${fmt(p.y)}`

function buildFillets(design: TrackDesign): FilletEntry[] {
  const { anchors, closed } = design
  const n = anchors.length
  return anchors.map((_, i) => {
    if (!closed && (i === 0 || i === n - 1)) return { kind: 'skip' as const }
    const f = computeFillet(
      anchors[(i - 1 + n) % n],
      anchors[i],
      anchors[(i + 1) % n],
      anchors[i].r,
    )
    if (f.kind === 'skip') return { kind: 'skip' as const }
    return {
      kind: 'arc' as const,
      t1: f.t1,
      t2: f.t2,
      center: f.center,
      r: f.r,
      sweep: f.sweep,
    }
  })
}

function buildTaggedSegments(design: TrackDesign): TaggedSegment[] {
  const { anchors, closed } = design
  const n = anchors.length
  if (n < 2) return []
  if (closed && n < 3) return []

  const fillets = buildFillets(design)
  const widths = anchors.map((a) => widthAt(a, design))
  const out: TaggedSegment[] = []

  const arcOf = (i: number): TaggedSegment | null => {
    const f = fillets[i]
    if (f.kind !== 'arc') return null
    const a1 = Math.atan2(f.t1.y - f.center.y, f.t1.x - f.center.x)
    const a2 = Math.atan2(f.t2.y - f.center.y, f.t2.x - f.center.x)
    return {
      kind: 'arc',
      center: f.center,
      r: f.r,
      a1,
      a2,
      sweep: f.sweep,
      w: widths[i],
    }
  }

  if (closed) {
    for (let i = 0; i < n; i++) {
      const arc = arcOf(i)
      if (arc) out.push(arc)
      const fHere = fillets[i]
      const fNext = fillets[(i + 1) % n]
      const start = fHere.kind === 'arc' ? fHere.t2 : anchors[i]
      const end = fNext.kind === 'arc' ? fNext.t1 : anchors[(i + 1) % n]
      out.push({
        kind: 'line',
        a: start,
        b: end,
        w0: widths[i],
        w1: widths[(i + 1) % n],
      })
    }
  } else {
    for (let i = 0; i < n - 1; i++) {
      const fHere = fillets[i]
      const fNext = fillets[i + 1]
      const start = fHere.kind === 'arc' ? fHere.t2 : anchors[i]
      const end = fNext.kind === 'arc' ? fNext.t1 : anchors[i + 1]
      out.push({
        kind: 'line',
        a: start,
        b: end,
        w0: widths[i],
        w1: widths[i + 1],
      })
      if (i < n - 2) {
        const arc = arcOf(i + 1)
        if (arc) out.push(arc)
      }
    }
  }

  return out
}

function sampleSegment(seg: TaggedSegment): CenterSample[] {
  const out: CenterSample[] = []
  if (seg.kind === 'line') {
    const dx = seg.b.x - seg.a.x
    const dy = seg.b.y - seg.a.y
    const length = Math.hypot(dx, dy)
    if (length < 1e-9) {
      out.push({ p: seg.a, t: { x: 1, y: 0 }, w: seg.w0 })
      return out
    }
    const tx = dx / length
    const ty = dy / length
    const steps = Math.max(2, Math.ceil(length / SAMPLE_DENSITY))
    for (let k = 0; k <= steps; k++) {
      const u = k / steps
      out.push({
        p: { x: seg.a.x + dx * u, y: seg.a.y + dy * u },
        t: { x: tx, y: ty },
        w: seg.w0 + (seg.w1 - seg.w0) * u,
      })
    }
    return out
  }
  let span: number
  if (seg.sweep === 1) {
    span = ((seg.a2 - seg.a1) % TAU + TAU) % TAU
  } else {
    span = -(((seg.a1 - seg.a2) % TAU + TAU) % TAU)
  }
  const arcLen = Math.abs(span) * seg.r
  const steps = Math.max(2, Math.ceil(arcLen / SAMPLE_DENSITY))
  const sign = span >= 0 ? 1 : -1
  for (let k = 0; k <= steps; k++) {
    const u = k / steps
    const ang = seg.a1 + span * u
    out.push({
      p: {
        x: seg.center.x + seg.r * Math.cos(ang),
        y: seg.center.y + seg.r * Math.sin(ang),
      },
      t: { x: -Math.sin(ang) * sign, y: Math.cos(ang) * sign },
      w: seg.w,
    })
  }
  return out
}

function dedupedSamples(segments: TaggedSegment[]): CenterSample[] {
  const samples: CenterSample[] = []
  const epsSq = 1e-12
  for (const seg of segments) {
    const segSamples = sampleSegment(seg)
    for (const s of segSamples) {
      const last = samples[samples.length - 1]
      if (last) {
        const dx = s.p.x - last.p.x
        const dy = s.p.y - last.p.y
        if (dx * dx + dy * dy < epsSq) {
          last.w = (last.w + s.w) * 0.5
          last.t = s.t
          continue
        }
      }
      samples.push({ p: { ...s.p }, t: { ...s.t }, w: s.w })
    }
  }
  return samples
}

function offsetEdges(samples: CenterSample[]): { outer: Vec2[]; inner: Vec2[] } {
  const outer: Vec2[] = []
  const inner: Vec2[] = []
  for (const s of samples) {
    const half = s.w * 0.5
    const px = s.t.y
    const py = -s.t.x
    outer.push({ x: s.p.x + px * half, y: s.p.y + py * half })
    inner.push({ x: s.p.x - px * half, y: s.p.y - py * half })
  }
  return { outer, inner }
}

function polylineD(points: Vec2[], closed: boolean): string {
  if (points.length < 2) return ''
  const cmds: string[] = []
  cmds.push(`M ${pt(points[0])}`)
  for (let i = 1; i < points.length; i++) cmds.push(`L ${pt(points[i])}`)
  if (closed) cmds.push('Z')
  return cmds.join(' ')
}

function bodyClosedD(outer: Vec2[], inner: Vec2[]): string {
  if (outer.length < 2 || inner.length < 2) return ''
  const cmds: string[] = []
  cmds.push(`M ${pt(outer[0])}`)
  for (let i = 1; i < outer.length; i++) cmds.push(`L ${pt(outer[i])}`)
  cmds.push('Z')
  cmds.push(`M ${pt(inner[0])}`)
  for (let i = 1; i < inner.length; i++) cmds.push(`L ${pt(inner[i])}`)
  cmds.push('Z')
  return cmds.join(' ')
}

function bodyOpenD(outer: Vec2[], inner: Vec2[]): string {
  if (outer.length < 2 || inner.length < 2) return ''
  const cmds: string[] = []
  cmds.push(`M ${pt(outer[0])}`)
  for (let i = 1; i < outer.length; i++) cmds.push(`L ${pt(outer[i])}`)
  // round cap at the end: arc from last outer to last inner
  const endLast = outer[outer.length - 1]
  const endInner = inner[inner.length - 1]
  const endR =
    Math.hypot(endLast.x - endInner.x, endLast.y - endInner.y) * 0.5
  cmds.push(`A ${fmt(endR)} ${fmt(endR)} 0 0 1 ${pt(endInner)}`)
  for (let i = inner.length - 2; i >= 0; i--) cmds.push(`L ${pt(inner[i])}`)
  // round cap at the start: arc from first inner back to first outer
  const startInner = inner[0]
  const startOuter = outer[0]
  const startR =
    Math.hypot(startInner.x - startOuter.x, startInner.y - startOuter.y) * 0.5
  cmds.push(`A ${fmt(startR)} ${fmt(startR)} 0 0 1 ${pt(startOuter)}`)
  cmds.push('Z')
  return cmds.join(' ')
}

function centerD(samples: CenterSample[], closed: boolean): string {
  if (samples.length < 2) return ''
  const cmds: string[] = []
  cmds.push(`M ${pt(samples[0].p)}`)
  for (let i = 1; i < samples.length; i++) cmds.push(`L ${pt(samples[i].p)}`)
  if (closed) cmds.push('Z')
  return cmds.join(' ')
}

export function buildRibbon(design: TrackDesign): RibbonResult | null {
  const segments = buildTaggedSegments(design)
  if (segments.length === 0) return null
  const samples = dedupedSamples(segments)
  if (samples.length < 2) return null
  const { outer, inner } = offsetEdges(samples)
  const closed = design.closed
  const bodyD = closed ? bodyClosedD(outer, inner) : bodyOpenD(outer, inner)
  const outerD = polylineD(outer, closed)
  const innerD = closed ? polylineD(inner, closed) : ''
  return {
    samples,
    outer,
    inner,
    closed,
    bodyD,
    outerD,
    innerD,
    centerD: centerD(samples, closed),
  }
}

export function ribbonExtent(r: RibbonResult): {
  minX: number
  maxX: number
  minY: number
  maxY: number
} {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  const visit = (p: Vec2) => {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  r.outer.forEach(visit)
  r.inner.forEach(visit)
  return { minX, maxX, minY, maxY }
}
