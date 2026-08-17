import { BoundaryPathV2, MarkingKindV2, PointV2, TrackDocumentV2 } from './types'

const boundary = (
  id: string,
  name: string,
  nodes: PointV2[],
  curbSegments: number[],
  fill: BoundaryPathV2['fill'] = 'concrete',
): BoundaryPathV2 => ({ id, name, closed: true, nodes, smoothing: 0.92, curbSegments, fill })

const baseDocument = (name: string, width: number, height: number, sourceId: string): TrackDocumentV2 => ({
  schema: 'nessrc.track-design',
  version: 2,
  name,
  units: 'm',
  canvas: { width, height, bleed: 0 },
  paths: [],
  regions: [{ id: 'asphalt', class: 'asphalt', outer: 'canvas', holes: [] }],
  markings: [],
  driveRoutes: [],
  theme: { asphalt: 'charcoal', curbColors: ['#f4f5f0', '#00a8d0'] },
  constraints: { minGap: 0.12, minFeature: 0.08, profileId: 'prototype-unconfirmed' },
  provenance: { origin: 'template', sourceId },
})

function technicalPark(): TrackDocumentV2 {
  const document = baseDocument('TECHNICAL PARK', 3, 4.9, 'track-100-inspired-v2')
  document.paths = [
    boundary('island-top', '上部回转岛', [
      { x: 0.42, y: 0.54 }, { x: 1.18, y: 0.28 }, { x: 1.62, y: 0.72 },
      { x: 1.36, y: 1.42 }, { x: 0.68, y: 1.54 }, { x: 0.30, y: 1.04 },
    ], [0, 1, 4, 5]),
    boundary('island-mid', '中央 S 岛', [
      { x: 1.74, y: 1.46 }, { x: 2.46, y: 1.26 }, { x: 2.68, y: 1.92 },
      { x: 2.28, y: 2.46 }, { x: 1.72, y: 2.30 }, { x: 1.36, y: 1.90 },
    ], [0, 1, 2]),
    boundary('island-bottom', '下部发夹岛', [
      { x: 0.50, y: 2.70 }, { x: 1.12, y: 2.42 }, { x: 1.78, y: 2.72 },
      { x: 2.14, y: 3.50 }, { x: 1.70, y: 4.12 }, { x: 0.92, y: 4.18 },
      { x: 0.42, y: 3.66 },
    ], [2, 3, 4, 5], 'grass'),
  ]
  document.regions[0].holes = document.paths.map((path) => path.id)
  document.markings = [
    { id: 'parking-1', kind: 'parking', x: 1.95, y: 0.42, width: 0.72, height: 0.56, rotation: 0 },
    { id: 'start-1', kind: 'start-grid', x: 0.24, y: 2.28, width: 0.58, height: 0.09, rotation: -0.08 },
  ]
  document.driveRoutes = [{
    id: 'route-main', name: '主路线参考', closed: true, points: [
      { x: 0.20, y: 0.35 }, { x: 2.12, y: 0.20 }, { x: 2.82, y: 1.14 },
      { x: 2.72, y: 2.88 }, { x: 2.44, y: 4.54 }, { x: 0.52, y: 4.62 },
      { x: 0.16, y: 3.42 }, { x: 1.42, y: 2.56 }, { x: 0.18, y: 1.82 },
    ],
  }]
  return document
}

function figureEight(): TrackDocumentV2 {
  const document = baseDocument('EIGHT DISTRICT', 2, 3, 'track-3-90-inspired-v2')
  document.paths = [
    boundary('loop-top', '上回转岛', [
      { x: 0.48, y: 0.46 }, { x: 1.00, y: 0.26 }, { x: 1.52, y: 0.46 },
      { x: 1.62, y: 0.98 }, { x: 1.00, y: 1.22 }, { x: 0.38, y: 0.98 },
    ], [0, 1, 2]),
    boundary('loop-bottom', '下回转岛', [
      { x: 0.38, y: 2.02 }, { x: 1.00, y: 1.78 }, { x: 1.62, y: 2.02 },
      { x: 1.52, y: 2.54 }, { x: 1.00, y: 2.74 }, { x: 0.48, y: 2.54 },
    ], [3, 4, 5]),
  ]
  document.regions[0].holes = document.paths.map((path) => path.id)
  document.markings = [{ id: 'start-eight', kind: 'start-grid', x: 0.72, y: 1.47, width: 0.56, height: 0.08, rotation: 0 }]
  document.driveRoutes = [{
    id: 'route-eight', name: '8 字路线', closed: true, points: [
      { x: 0.22, y: 0.40 }, { x: 1.76, y: 0.40 }, { x: 1.72, y: 1.16 },
      { x: 0.28, y: 1.84 }, { x: 0.24, y: 2.58 }, { x: 1.76, y: 2.58 },
      { x: 1.72, y: 1.84 }, { x: 0.28, y: 1.16 },
    ],
  }]
  return document
}

function trainingGround(): TrackDocumentV2 {
  const document = baseDocument('TRAINING GROUND', 2.4, 4, 'track-70-inspired-v2')
  document.paths = [
    boundary('hairpin-a', '上发夹岛', [
      { x: 0.42, y: 0.48 }, { x: 1.14, y: 0.24 }, { x: 1.86, y: 0.48 },
      { x: 1.72, y: 1.04 }, { x: 1.16, y: 1.20 }, { x: 0.54, y: 0.98 },
    ], [0, 1, 2]),
    boundary('divider', '中央分流岛', [
      { x: 0.92, y: 1.48 }, { x: 1.50, y: 1.34 }, { x: 1.72, y: 1.82 },
      { x: 1.42, y: 2.24 }, { x: 0.82, y: 2.10 }, { x: 0.68, y: 1.72 },
    ], [2, 3]),
    boundary('hairpin-b', '下发夹岛', [
      { x: 0.36, y: 2.68 }, { x: 1.02, y: 2.42 }, { x: 1.76, y: 2.72 },
      { x: 1.88, y: 3.36 }, { x: 1.18, y: 3.68 }, { x: 0.48, y: 3.40 },
    ], [3, 4, 5]),
  ]
  document.regions[0].holes = document.paths.map((path) => path.id)
  document.markings = [
    { id: 'parking-training', kind: 'parking', x: 0.12, y: 1.52, width: 0.48, height: 0.58, rotation: 0 },
    { id: 'arrow-training', kind: 'direction-arrow', x: 1.92, y: 1.36, width: 0.20, height: 0.38, rotation: 0 },
  ]
  return document
}

export const V2_TEMPLATES = {
  technical: { label: 'Technical Park', subtitle: '多内岛 · S 区 · 发夹', create: technicalPark },
  eight: { label: 'Eight District', subtitle: '合法交汇 · 双环路线', create: figureEight },
  training: { label: 'Training Ground', subtitle: '模块化发夹 · 教学布局', create: trainingGround },
} as const

export type V2TemplateId = keyof typeof V2_TEMPLATES

export function createV2Template(id: V2TemplateId): TrackDocumentV2 {
  return structuredClone(V2_TEMPLATES[id].create())
}

export type BoundaryModuleKind = 'round' | 'hairpin' | 'divider'

export function createBoundaryModule(kind: BoundaryModuleKind, document: TrackDocumentV2): BoundaryPathV2 {
  const index = document.paths.length + 1
  const cx = document.canvas.width * (0.45 + ((index % 3) - 1) * 0.08)
  const cy = document.canvas.height * (0.42 + ((index % 4) - 1.5) * 0.07)
  const id = `island-${Date.now().toString(36)}-${index}`
  if (kind === 'divider') {
    return boundary(id, `分流岛 ${index}`, [
      { x: cx - 0.34, y: cy - 0.16 }, { x: cx + 0.20, y: cy - 0.22 },
      { x: cx + 0.36, y: cy + 0.10 }, { x: cx, y: cy + 0.22 },
    ], [1, 2], 'painted')
  }
  if (kind === 'hairpin') {
    return boundary(id, `发夹岛 ${index}`, [
      { x: cx - 0.42, y: cy - 0.18 }, { x: cx, y: cy - 0.30 }, { x: cx + 0.42, y: cy - 0.16 },
      { x: cx + 0.30, y: cy + 0.24 }, { x: cx, y: cy + 0.30 }, { x: cx - 0.34, y: cy + 0.18 },
    ], [0, 1, 2])
  }
  return boundary(id, `圆形岛 ${index}`, [
    { x: cx, y: cy - 0.30 }, { x: cx + 0.28, y: cy - 0.16 }, { x: cx + 0.30, y: cy + 0.16 },
    { x: cx, y: cy + 0.30 }, { x: cx - 0.28, y: cy + 0.16 }, { x: cx - 0.30, y: cy - 0.16 },
  ], [0, 1, 2, 3, 4, 5])
}

export function createMarking(kind: MarkingKindV2, document: TrackDocumentV2) {
  const index = document.markings.length + 1
  return {
    id: `${kind}-${Date.now().toString(36)}-${index}`,
    kind,
    x: document.canvas.width * 0.5,
    y: document.canvas.height * 0.5,
    width: kind === 'parking' ? 0.65 : 0.45,
    height: kind === 'parking' ? 0.52 : kind === 'direction-arrow' ? 0.30 : 0.08,
    rotation: 0,
  }
}

