import { performance } from 'node:perf_hooks'

const dependencyRoot = process.argv[2]
if (!dependencyRoot) throw new Error('usage: node candidate_geometry_probe.mjs <directory-containing-node_modules>')

const Clipper = await import(`${dependencyRoot}/node_modules/clipper2-ts/dist/index.js`)
const Flatten = await import(`${dependencyRoot}/node_modules/@flatten-js/core/dist/main.mjs`)
const { Bezier } = await import(`${dependencyRoot}/node_modules/bezier-js/src/bezier.js`)
const polygonClipping = (await import(`${dependencyRoot}/node_modules/polygon-clipping/dist/polygon-clipping.esm.js`)).default

const subject = [[
  { x: 0, y: 0 }, { x: 10000, y: 0 }, { x: 10000, y: 10000 }, { x: 0, y: 10000 },
]]
const island = [[
  { x: 3000, y: 2000 }, { x: 7000, y: 2000 }, { x: 7000, y: 8000 }, { x: 3000, y: 8000 },
]]
const carved = Clipper.difference(subject, island, Clipper.FillRule.NonZero)
const offset = Clipper.inflatePaths(island, 500, Clipper.JoinType.Round, Clipper.EndType.Polygon)
const bowTie = [[
  { x: 0, y: 0 }, { x: 10000, y: 10000 }, { x: 0, y: 10000 }, { x: 10000, y: 0 },
]]

let started = performance.now()
for (let i = 0; i < 1000; i++) Clipper.difference(subject, island, Clipper.FillRule.NonZero)
const clipperMs = performance.now() - started

const polygon = Flatten.polygon([[0, 0], [100, 0], [100, 100], [0, 100]])
polygon.addFace([[30, 30], [30, 70], [70, 70], [70, 30]])
const bezier = new Bezier(0, 0, 35, 0, 65, 100, 100, 100)

const pcSubject = [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]]
const pcHole = [[[30, 20], [70, 20], [70, 80], [30, 80], [30, 20]]]
started = performance.now()
for (let i = 0; i < 1000; i++) polygonClipping.difference(pcSubject, pcHole)
const polygonClippingMs = performance.now() - started

console.log(JSON.stringify({
  clipper: {
    differencePathCount: carved.length,
    signedAreas: carved.map(Clipper.area),
    roundOffsetPathCount: offset.length,
    roundOffsetPointCount: offset.reduce((count, path) => count + path.length, 0),
    normalizedBowTiePathCount: Clipper.union(bowTie, [], Clipper.FillRule.NonZero).length,
    thousandDifferencesMs: Number(clipperMs.toFixed(2)),
  },
  flatten: {
    valid: polygon.isValid(),
    faceCount: polygon.faces.size,
    area: polygon.area(),
    containsHoleCenter: polygon.contains(Flatten.point(50, 50)),
    containsSurfacePoint: polygon.contains(Flatten.point(10, 10)),
  },
  bezier: {
    length: Number(bezier.length().toFixed(3)),
    reducedSegments: bezier.reduce().length,
    offsetSegments: bezier.offset(10).length,
  },
  polygonClipping: {
    differencePolygonCount: polygonClipping.difference(pcSubject, pcHole).length,
    thousandDifferencesMs: Number(polygonClippingMs.toFixed(2)),
  },
}, null, 2))
