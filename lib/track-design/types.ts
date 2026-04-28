export type Vec2 = { x: number; y: number }

export type Anchor = {
  id: string
  x: number
  y: number
  r: number
  rAuto?: boolean
  w?: number
  wAuto?: boolean
}

export const TRACK_DESIGN_VERSION = 1 as const

export type TrackDesign = {
  version: typeof TRACK_DESIGN_VERSION
  bboxW: number
  bboxH: number
  anchors: Anchor[]
  closed: boolean
  strokeW: number
  templateId?: string
}

export const STROKE_W_MIN = 0.06
export const STROKE_W_MAX = 0.4
export const ANCHOR_W_MIN = 0.06
export const ANCHOR_W_MAX = 0.4
export const BBOX_MIN = 0.5
export const BBOX_MAX = 4
export const COLLINEAR_EPS = 0.01
export const MIN_ANGLE = (30 * Math.PI) / 180
export const R_AUTO_MARGIN = 0.995
