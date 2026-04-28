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
  circle: {
    version: v,
    displayName: 'Circle',
    bboxW: 1.5,
    bboxH: 1.5,
    strokeW: 0.18,
    closed: true,
    anchors: [
      { id: 'c1', x: 0.30, y: 0.30, r: 0.6 },
      { id: 'c2', x: 1.20, y: 0.30, r: 0.6 },
      { id: 'c3', x: 1.20, y: 1.20, r: 0.6 },
      { id: 'c4', x: 0.30, y: 1.20, r: 0.6 },
    ],
  },
  triangle: {
    version: v,
    displayName: 'Triangle',
    bboxW: 1.5,
    bboxH: 2.2,
    strokeW: 0.18,
    closed: true,
    anchors: [
      { id: 'tri1', x: 0.75, y: 0.30, r: 0.30 },
      { id: 'tri2', x: 1.30, y: 1.90, r: 0.30 },
      { id: 'tri3', x: 0.20, y: 1.90, r: 0.30 },
    ],
  },
  pentagon: {
    version: v,
    displayName: 'Pentagon',
    bboxW: 1.5,
    bboxH: 2.2,
    strokeW: 0.18,
    closed: true,
    anchors: [
      { id: 'pe1', x: 0.75, y: 0.20, r: 0.25 },
      { id: 'pe2', x: 1.30, y: 0.95, r: 0.25 },
      { id: 'pe3', x: 1.10, y: 2.00, r: 0.25 },
      { id: 'pe4', x: 0.40, y: 2.00, r: 0.25 },
      { id: 'pe5', x: 0.20, y: 0.95, r: 0.25 },
    ],
  },
  diamond: {
    version: v,
    displayName: 'Diamond',
    bboxW: 1.5,
    bboxH: 2.2,
    strokeW: 0.18,
    closed: true,
    anchors: [
      { id: 'di1', x: 0.75, y: 0.20, r: 0.22 },
      { id: 'di2', x: 1.35, y: 1.10, r: 0.30 },
      { id: 'di3', x: 0.75, y: 2.00, r: 0.22 },
      { id: 'di4', x: 0.15, y: 1.10, r: 0.30 },
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
  kidney: {
    version: v,
    displayName: 'Kidney',
    bboxW: 1.5,
    bboxH: 2.2,
    strokeW: 0.18,
    closed: true,
    anchors: [
      { id: 'k1', x: 0.30, y: 0.30, r: 0.4 },
      { id: 'k2', x: 1.20, y: 0.30, r: 0.4 },
      { id: 'k3', x: 1.20, y: 1.90, r: 0.4 },
      { id: 'k4', x: 0.30, y: 1.90, r: 0.4 },
      { id: 'k5', x: 0.55, y: 1.40, r: 0.12 },
      { id: 'k6', x: 0.55, y: 0.80, r: 0.12 },
    ],
  },
  dumbbell: {
    version: v,
    displayName: 'Dumbbell',
    bboxW: 1.5,
    bboxH: 2.2,
    strokeW: 0.16,
    closed: true,
    anchors: [
      { id: 'db1', x: 0.75, y: 0.18, r: 0.5 },
      { id: 'db2', x: 1.32, y: 0.55, r: 0.4 },
      { id: 'db3', x: 0.95, y: 1.10, r: 0.06 },
      { id: 'db4', x: 1.32, y: 1.65, r: 0.4 },
      { id: 'db5', x: 0.75, y: 2.02, r: 0.5 },
      { id: 'db6', x: 0.18, y: 1.65, r: 0.4 },
      { id: 'db7', x: 0.55, y: 1.10, r: 0.06 },
      { id: 'db8', x: 0.18, y: 0.55, r: 0.4 },
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
  wave: {
    version: v,
    displayName: 'Wave',
    bboxW: 1.5,
    bboxH: 2.2,
    strokeW: 0.16,
    closed: false,
    anchors: [
      { id: 'w1', x: 0.30, y: 0.25, r: 0 },
      { id: 'w2', x: 1.20, y: 0.65, r: 0.30 },
      { id: 'w3', x: 0.30, y: 1.10, r: 0.30 },
      { id: 'w4', x: 1.20, y: 1.55, r: 0.30 },
      { id: 'w5', x: 0.30, y: 1.95, r: 0 },
    ],
  },
  'u-curve': {
    version: v,
    displayName: 'U-Curve',
    bboxW: 1.5,
    bboxH: 2.2,
    strokeW: 0.18,
    closed: false,
    anchors: [
      { id: 'u1', x: 0.30, y: 0.20, r: 0 },
      { id: 'u2', x: 0.30, y: 1.85, r: 0.45 },
      { id: 'u3', x: 1.20, y: 1.85, r: 0.45 },
      { id: 'u4', x: 1.20, y: 0.20, r: 0 },
    ],
  },
}

export const handcraftedTemplates: Record<string, Template> = Object.fromEntries(
  Object.entries(rawTemplates).map(([key, t]) => [
    key,
    {
      ...t,
      anchors: clampAnchorRadii(
        t.anchors.map((a) => ({ ...a, wAuto: true })),
        t.closed,
      ),
    },
  ]),
)

export const handcraftedTemplateIds = Object.keys(handcraftedTemplates)
