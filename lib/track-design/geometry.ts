import {
  Anchor,
  Vec2,
  TrackDesign,
  COLLINEAR_EPS,
} from './types'

export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y })
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y })
export const scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s })
export const len = (a: Vec2): number => Math.hypot(a.x, a.y)
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y
export const cross = (a: Vec2, b: Vec2): number => a.x * b.y - a.y * b.x

export const norm = (a: Vec2): Vec2 => {
  const L = len(a)
  return L === 0 ? { x: 0, y: 0 } : { x: a.x / L, y: a.y / L }
}

export type FilletInfo =
  | { kind: 'skip' }
  | {
      kind: 'arc'
      t1: Vec2
      t2: Vec2
      center: Vec2
      r: number
      sweep: 0 | 1
      theta: number
      setback: number
    }

export function computeFillet(
  prev: Vec2,
  here: Vec2,
  next: Vec2,
  r: number,
): FilletInfo {
  if (r <= 1e-6) return { kind: 'skip' }
  const u1 = norm(sub(prev, here))
  const u2 = norm(sub(next, here))
  const cosTheta = Math.max(-1, Math.min(1, dot(u1, u2)))
  const theta = Math.acos(cosTheta)
  if (theta > Math.PI - COLLINEAR_EPS) return { kind: 'skip' }
  if (theta < 1e-6) return { kind: 'skip' }
  const halfTheta = theta / 2
  const setback = r / Math.tan(halfTheta)
  const t1 = add(here, scale(u1, setback))
  const t2 = add(here, scale(u2, setback))
  const bisectorRaw = add(u1, u2)
  const bisector = norm(bisectorRaw)
  const centerDist = r / Math.sin(halfTheta)
  const center = add(here, scale(bisector, centerDist))
  const sweep: 0 | 1 = cross(u1, u2) > 0 ? 0 : 1
  return { kind: 'arc', t1, t2, center, r, sweep, theta, setback }
}

const fmt = (n: number): string => {
  if (Math.abs(n) < 1e-9) return '0'
  return Number(n.toFixed(6)).toString()
}

const point = (p: Vec2): string => `${fmt(p.x)} ${fmt(p.y)}`

function indices(
  count: number,
  closed: boolean,
): { i: number; prev: number; next: number; isFillet: boolean }[] {
  const out: { i: number; prev: number; next: number; isFillet: boolean }[] = []
  for (let i = 0; i < count; i++) {
    if (!closed && (i === 0 || i === count - 1)) {
      out.push({ i, prev: -1, next: -1, isFillet: false })
    } else {
      const prev = (i - 1 + count) % count
      const next = (i + 1) % count
      out.push({ i, prev, next, isFillet: true })
    }
  }
  return out
}

export function buildSvgPath(design: TrackDesign): string {
  const { anchors, closed } = design
  if (anchors.length < 2) return ''
  if (closed && anchors.length < 3) return ''

  const fillets = indices(anchors.length, closed).map((slot) => {
    if (!slot.isFillet) return { kind: 'skip' as const }
    const a = anchors[slot.prev]
    const b = anchors[slot.i]
    const c = anchors[slot.next]
    return computeFillet(a, b, c, b.r)
  })

  type Endpoint = { p: Vec2; arc?: { center: Vec2; r: number; sweep: 0 | 1 } }
  const segments: { from: Endpoint; to: Endpoint }[] = []

  const startEndpoint = (i: number): Vec2 => {
    const f = fillets[i]
    return f.kind === 'arc' ? f.t2 : anchors[i]
  }
  const endEndpoint = (i: number): Vec2 => {
    const f = fillets[i]
    return f.kind === 'arc' ? f.t1 : anchors[i]
  }

  const cmds: string[] = []
  if (closed) {
    const first = fillets[0]
    if (first.kind === 'arc') {
      cmds.push(`M ${point(first.t2)}`)
    } else {
      cmds.push(`M ${point(anchors[0])}`)
    }
    for (let i = 0; i < anchors.length; i++) {
      const nextIdx = (i + 1) % anchors.length
      const f = fillets[nextIdx]
      if (f.kind === 'arc') {
        cmds.push(`L ${point(f.t1)}`)
        cmds.push(`A ${fmt(f.r)} ${fmt(f.r)} 0 0 ${f.sweep} ${point(f.t2)}`)
      } else {
        cmds.push(`L ${point(anchors[nextIdx])}`)
      }
    }
    cmds.push('Z')
  } else {
    cmds.push(`M ${point(anchors[0])}`)
    for (let i = 1; i < anchors.length; i++) {
      const f = fillets[i]
      if (f.kind === 'arc') {
        cmds.push(`L ${point(f.t1)}`)
        cmds.push(`A ${fmt(f.r)} ${fmt(f.r)} 0 0 ${f.sweep} ${point(f.t2)}`)
      } else {
        cmds.push(`L ${point(anchors[i])}`)
      }
    }
  }
  return cmds.join(' ')
}

export function getMaxFilletRadius(
  anchors: Anchor[],
  i: number,
  closed: boolean,
): number {
  const n = anchors.length
  if (!closed && (i === 0 || i === n - 1)) return 0
  if (n < 3) return 0
  const prev = anchors[(i - 1 + n) % n]
  const here = anchors[i]
  const next = anchors[(i + 1) % n]
  const u1 = norm(sub(prev, here))
  const u2 = norm(sub(next, here))
  const cosTheta = Math.max(-1, Math.min(1, dot(u1, u2)))
  const theta = Math.acos(cosTheta)
  if (theta > Math.PI - COLLINEAR_EPS) return 1e6
  if (theta < 1e-6) return 0
  const halfTheta = theta / 2
  const tanH = Math.tan(halfTheta)
  const dPrev = len(sub(prev, here)) / 2
  const dNext = len(sub(next, here)) / 2
  return Math.min(dPrev, dNext) * tanH
}

export function clampAnchorRadii(
  anchors: Anchor[],
  closed: boolean,
): Anchor[] {
  return anchors.map((a, i) => {
    const max = getMaxFilletRadius(anchors, i, closed)
    if (a.r > max) return { ...a, r: Math.max(0, max) }
    return a
  })
}

export type Segment =
  | { kind: 'line'; a: Vec2; b: Vec2 }
  | {
      kind: 'arc'
      center: Vec2
      r: number
      a1: number
      a2: number
      sweep: 0 | 1
    }

export function getSegments(design: TrackDesign): Segment[] {
  const { anchors, closed } = design
  if (anchors.length < 2) return []
  if (closed && anchors.length < 3) return []

  const fillets = indices(anchors.length, closed).map((slot) => {
    if (!slot.isFillet) return { kind: 'skip' as const }
    const a = anchors[slot.prev]
    const b = anchors[slot.i]
    const c = anchors[slot.next]
    return computeFillet(a, b, c, b.r)
  })

  const segments: Segment[] = []
  const n = anchors.length

  const lineEnd = (i: number): Vec2 => {
    const f = fillets[i]
    return f.kind === 'arc' ? f.t1 : anchors[i]
  }
  const lineStart = (i: number): Vec2 => {
    const f = fillets[i]
    return f.kind === 'arc' ? f.t2 : anchors[i]
  }

  const range = closed ? n : n - 1
  for (let i = 0; i < range; i++) {
    const a = lineStart(i)
    const b = lineEnd((i + 1) % n)
    segments.push({ kind: 'line', a, b })
    const fNext = fillets[(i + 1) % n]
    if (fNext.kind === 'arc') {
      const a1 = Math.atan2(fNext.t1.y - fNext.center.y, fNext.t1.x - fNext.center.x)
      const a2 = Math.atan2(fNext.t2.y - fNext.center.y, fNext.t2.x - fNext.center.x)
      segments.push({
        kind: 'arc',
        center: fNext.center,
        r: fNext.r,
        a1,
        a2,
        sweep: fNext.sweep,
      })
    }
  }
  return segments
}
