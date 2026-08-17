import { buildRibbon } from '../../../lib/track-design/ribbon'
import { validateBounds } from '../../../lib/track-design/bounds'
import type { TrackDesign, Vec2 } from '../../../lib/track-design/types'

function orient(a: Vec2, b: Vec2, c: Vec2): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

function strictCross(a: Vec2, b: Vec2, c: Vec2, d: Vec2): boolean {
  return orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0
}

function countPolylineCrossings(points: Vec2[], closed: boolean): number {
  const segmentCount = closed ? points.length : points.length - 1
  let count = 0
  for (let i = 0; i < segmentCount; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    for (let j = i + 1; j < segmentCount; j++) {
      if (j === i + 1 || (closed && i === 0 && j === segmentCount - 1)) continue
      const c = points[j]
      const d = points[(j + 1) % points.length]
      if (strictCross(a, b, c, d)) count++
    }
  }
  return count
}

const bowTie: TrackDesign = {
  version: 1,
  bboxW: 2,
  bboxH: 2,
  strokeW: 0.1,
  closed: true,
  anchors: [
    { id: 'a', x: 0.3, y: 0.3, r: 0 },
    { id: 'b', x: 1.7, y: 1.7, r: 0 },
    { id: 'c', x: 0.3, y: 1.7, r: 0 },
    { id: 'd', x: 1.7, y: 0.3, r: 0 },
  ],
}

const ribbon = buildRibbon(bowTie)
console.log(JSON.stringify({
  case: 'bow-tie centerline',
  boundsValidatorAccepts: validateBounds(bowTie).ok,
  anchorPolylineCrossings: countPolylineCrossings(bowTie.anchors, true),
  sampledCenterlineStrictCrossings: ribbon ? countPolylineCrossings(ribbon.samples.map((sample) => sample.p), true) : null,
  outerBoundaryCrossings: ribbon ? countPolylineCrossings(ribbon.outer, true) : null,
  innerBoundaryCrossings: ribbon ? countPolylineCrossings(ribbon.inner, true) : null,
}, null, 2))

const tightCorner: TrackDesign = {
  version: 1,
  bboxW: 2,
  bboxH: 2,
  strokeW: 0.4,
  closed: false,
  anchors: [
    { id: 'a', x: 0.2, y: 0.2, r: 0 },
    { id: 'b', x: 1, y: 0.2, r: 0.05 },
    { id: 'c', x: 1, y: 1.5, r: 0 },
  ],
}
const tightRibbon = buildRibbon(tightCorner)
console.log(JSON.stringify({
  case: 'requested width wider than tight fillet',
  requestedWidth: tightCorner.strokeW,
  renderedMinWidth: tightRibbon ? Math.min(...tightRibbon.samples.map((sample) => sample.w)) : null,
  boundsValidatorAccepts: validateBounds(tightCorner).ok,
}, null, 2))
