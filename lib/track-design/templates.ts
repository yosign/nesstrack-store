import { TrackDesign, TRACK_DESIGN_VERSION } from './types'
import { clampAnchorRadii } from './geometry'

const v = TRACK_DESIGN_VERSION

export type Template = TrackDesign & { displayName: string; sourceTrackId?: string }

const rawTemplates: Record<string, Template> = {
  oval: {
    version: v,
    displayName: 'Oval',
    bboxW: 1.5,
    bboxH: 2.2,
    strokeW: 0.18,
    closed: true,
    anchors: [
      { id: 'o1', x: 0.4, y: 0.4, r: 0.6 },
      { id: 'o2', x: 1.1, y: 0.4, r: 0.6 },
      { id: 'o3', x: 1.1, y: 1.8, r: 0.6 },
      { id: 'o4', x: 0.4, y: 1.8, r: 0.6 },
    ],
  },
  'rounded-rect': {
    version: v,
    displayName: 'Rounded Rectangle',
    bboxW: 1.5,
    bboxH: 2.2,
    strokeW: 0.18,
    closed: true,
    anchors: [
      { id: 'r1', x: 0.3, y: 0.3, r: 0.2 },
      { id: 'r2', x: 1.2, y: 0.3, r: 0.2 },
      { id: 'r3', x: 1.2, y: 1.9, r: 0.2 },
      { id: 'r4', x: 0.3, y: 1.9, r: 0.2 },
    ],
  },
  peanut: {
    version: v,
    displayName: 'Peanut',
    bboxW: 1.5,
    bboxH: 2.2,
    strokeW: 0.18,
    closed: true,
    anchors: [
      { id: 'p1', x: 0.35, y: 0.4, r: 0.35 },
      { id: 'p2', x: 1.15, y: 0.4, r: 0.35 },
      { id: 'p3', x: 1.0, y: 1.1, r: 0.18 },
      { id: 'p4', x: 1.15, y: 1.8, r: 0.35 },
      { id: 'p5', x: 0.35, y: 1.8, r: 0.35 },
      { id: 'p6', x: 0.5, y: 1.1, r: 0.18 },
    ],
  },
  's-curve': {
    version: v,
    displayName: 'S-Curve',
    bboxW: 1.5,
    bboxH: 2.2,
    strokeW: 0.18,
    closed: false,
    anchors: [
      { id: 's1', x: 0.3, y: 0.3, r: 0 },
      { id: 's2', x: 1.2, y: 0.7, r: 0.35 },
      { id: 's3', x: 0.3, y: 1.5, r: 0.35 },
      { id: 's4', x: 1.2, y: 1.9, r: 0 },
    ],
  },
}

export const handcraftedTemplates: Record<string, Template> = Object.fromEntries(
  Object.entries(rawTemplates).map(([key, t]) => [
    key,
    { ...t, anchors: clampAnchorRadii(t.anchors, t.closed) },
  ]),
)

export const handcraftedTemplateIds = Object.keys(handcraftedTemplates)
