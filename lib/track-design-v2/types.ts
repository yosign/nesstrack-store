export type PointV2 = { x: number; y: number }

export type BoundaryPathV2 = {
  id: string
  name: string
  closed: true
  nodes: PointV2[]
  smoothing: number
  curbSegments: number[]
  fill: 'concrete' | 'grass' | 'painted'
}

export type SurfaceRegionV2 = {
  id: string
  class: 'asphalt'
  outer: 'canvas'
  holes: string[]
}

export type MarkingKindV2 = 'start-grid' | 'parking' | 'direction-arrow'

export type MarkingV2 = {
  id: string
  kind: MarkingKindV2
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export type DriveRouteV2 = {
  id: string
  name: string
  closed: boolean
  points: PointV2[]
}

export type TrackDocumentV2 = {
  schema: 'nessrc.track-design'
  version: 2
  name: string
  units: 'm'
  canvas: {
    width: number
    height: number
    bleed: number
  }
  paths: BoundaryPathV2[]
  regions: SurfaceRegionV2[]
  markings: MarkingV2[]
  driveRoutes: DriveRouteV2[]
  theme: {
    asphalt: 'charcoal' | 'graphite'
    curbColors: [string, string]
  }
  constraints: {
    minGap: number
    minFeature: number
    profileId: string
  }
  provenance: {
    origin: 'template' | 'blank' | 'prototype'
    sourceId?: string
  }
}

export type ValidationIssueV2 = {
  id: string
  severity: 'error' | 'warning'
  message: string
  boundaryId?: string
}

export type ValidationResultV2 = {
  valid: boolean
  issues: ValidationIssueV2[]
  asphaltArea: number
  normalizedPathCount: number
}

