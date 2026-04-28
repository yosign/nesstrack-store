import {
  TrackDesign,
  TRACK_DESIGN_VERSION,
  STROKE_W_MIN,
  STROKE_W_MAX,
  BBOX_MIN,
  BBOX_MAX,
} from './types'

export function serializeDesign(design: TrackDesign): string {
  return JSON.stringify(design)
}

export class DesignParseError extends Error {}

export function parseDesign(input: unknown): TrackDesign {
  const raw = typeof input === 'string' ? safeJsonParse(input) : input
  if (!raw || typeof raw !== 'object') throw new DesignParseError('not an object')
  const obj = raw as Record<string, unknown>
  if (obj.version !== TRACK_DESIGN_VERSION) {
    throw new DesignParseError(`unsupported version ${String(obj.version)}`)
  }
  const bboxW = num(obj.bboxW, 'bboxW')
  const bboxH = num(obj.bboxH, 'bboxH')
  const strokeW = num(obj.strokeW, 'strokeW')
  if (bboxW < BBOX_MIN || bboxW > BBOX_MAX) throw new DesignParseError(`bboxW out of range`)
  if (bboxH < BBOX_MIN || bboxH > BBOX_MAX) throw new DesignParseError(`bboxH out of range`)
  if (strokeW < STROKE_W_MIN || strokeW > STROKE_W_MAX) throw new DesignParseError(`strokeW out of range`)
  if (typeof obj.closed !== 'boolean') throw new DesignParseError('closed missing')
  if (!Array.isArray(obj.anchors)) throw new DesignParseError('anchors missing')
  const anchors = obj.anchors.map((a, i) => {
    if (!a || typeof a !== 'object') throw new DesignParseError(`anchor[${i}] not object`)
    const ar = a as Record<string, unknown>
    const w = ar.w
    const rAuto = ar.rAuto
    const wAuto = ar.wAuto
    return {
      id: String(ar.id ?? `a${i}`),
      x: num(ar.x, `anchor[${i}].x`),
      y: num(ar.y, `anchor[${i}].y`),
      r: num(ar.r, `anchor[${i}].r`),
      ...(typeof w === 'number' && isFinite(w) ? { w } : {}),
      ...(rAuto === true ? { rAuto: true as const } : {}),
      ...(wAuto === true ? { wAuto: true as const } : {}),
    }
  })
  if (obj.closed && anchors.length < 3) throw new DesignParseError('closed needs ≥3 anchors')
  if (!obj.closed && anchors.length < 2) throw new DesignParseError('open needs ≥2 anchors')
  return {
    version: TRACK_DESIGN_VERSION,
    bboxW,
    bboxH,
    anchors,
    closed: obj.closed,
    strokeW,
    templateId: typeof obj.templateId === 'string' ? obj.templateId : undefined,
  }
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    throw new DesignParseError('invalid JSON')
  }
}

function num(v: unknown, label: string): number {
  if (typeof v !== 'number' || !isFinite(v)) {
    throw new DesignParseError(`${label} not a finite number`)
  }
  return v
}
