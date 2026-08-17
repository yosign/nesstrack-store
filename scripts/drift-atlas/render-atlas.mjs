import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(SCRIPT_DIR, '../..')
const RESEARCH_DIR = path.join(ROOT, 'docs/research/global-drift-track-atlas')
const args = new Map(process.argv.slice(2).reduce((pairs, value, index, values) => {
  if (!value.startsWith('--')) return pairs
  pairs.push([value.slice(2), values[index + 1] && !values[index + 1].startsWith('--') ? values[index + 1] : 'true'])
  return pairs
}, []))
const MANIFEST_PATH = path.resolve(ROOT, args.get('manifest') ?? path.relative(ROOT, path.join(RESEARCH_DIR, 'production-manifest.json')))
const OUTPUT_ROOT = args.get('output-root') ? path.resolve(args.get('output-root')) : ROOT
const SVG_DIR = path.join(OUTPUT_ROOT, 'public/images/global-drift-track-atlas/svg')
const PNG_DIR = path.join(OUTPUT_ROOT, 'public/images/global-drift-track-atlas/png')
const QA_DIR = path.join(OUTPUT_ROOT, 'docs/research/global-drift-track-atlas/qa')
const INCLUDED_STATUS = args.get('status') ?? 'complete'

const WIDTH = 1600
const HEIGHT = 1200
const PAD = 132
const COURSE_COLOR = '#111827'
const CENTER_COLOR = '#F8FAFC'
const CONTEXT_COLOR = '#CBD2D9'
const START_COLOR = '#22C55E'
const FINISH_COLOR = '#EF4444'
const INNER_ZONE_COLOR = '#F59E0B'
const OUTER_ZONE_COLOR = '#A855F7'

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const sha256 = (value) => createHash('sha256').update(value).digest('hex')

function bounds(polylines) {
  const points = polylines.flat().filter(Boolean)
  return points.reduce((box, [x, y]) => ({
    minX: Math.min(box.minX, x),
    minY: Math.min(box.minY, y),
    maxX: Math.max(box.maxX, x),
    maxY: Math.max(box.maxY, y),
  }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity })
}

function projectGeometry(track) {
  const context = track.geometry.context ?? []
  const all = [track.geometry.course, ...context]
  const box = bounds(all)
  const sourceWidth = Math.max(box.maxX - box.minX, 0.0001)
  const sourceHeight = Math.max(box.maxY - box.minY, 0.0001)
  const scale = Math.min((WIDTH - PAD * 2) / sourceWidth, (HEIGHT - PAD * 2) / sourceHeight)
  const offsetX = (WIDTH - sourceWidth * scale) / 2
  const offsetY = (HEIGHT - sourceHeight * scale) / 2
  const project = ([x, y]) => [
    Number((offsetX + (x - box.minX) * scale).toFixed(2)),
    Number((offsetY + (y - box.minY) * scale).toFixed(2)),
  ]

  return {
    course: track.geometry.course.map(project),
    context: context.map((line) => line.map(project)),
    project,
  }
}

function polylineD(points, smoothing = 0) {
  if (smoothing <= 0 || points.length < 3) {
    return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
  }
  const tension = Math.max(0, Math.min(1.2, smoothing)) / 6
  const segments = points.slice(0, -1).map((start, index) => {
    const previous = points[Math.max(0, index - 1)]
    const end = points[index + 1]
    const next = points[Math.min(points.length - 1, index + 2)]
    const c1 = [start[0] + (end[0] - previous[0]) * tension, start[1] + (end[1] - previous[1]) * tension]
    const c2 = [end[0] - (next[0] - start[0]) * tension, end[1] - (next[1] - start[1]) * tension]
    return `C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${end[0]} ${end[1]}`
  })
  return `M ${points[0][0]} ${points[0][1]} ${segments.join(' ')}`
}

function markerAt(points, requestedIndex, fallbackIndex) {
  const index = Math.max(0, Math.min(points.length - 1, requestedIndex ?? fallbackIndex))
  return { point: points[index], index }
}

function arrowAt(points, requestedIndex) {
  const { point: [x, y], index } = markerAt(points, requestedIndex, Math.floor(points.length / 2))
  const before = points[Math.max(0, index - 1)]
  const after = points[Math.min(points.length - 1, index + 1)]
  const angle = Math.atan2(after[1] - before[1], after[0] - before[0])
  const size = 28
  const back = 20
  const left = [x - Math.cos(angle) * back + Math.cos(angle + Math.PI / 2) * size, y - Math.sin(angle) * back + Math.sin(angle + Math.PI / 2) * size]
  const right = [x - Math.cos(angle) * back + Math.cos(angle - Math.PI / 2) * size, y - Math.sin(angle) * back + Math.sin(angle - Math.PI / 2) * size]
  const tip = [x + Math.cos(angle) * size, y + Math.sin(angle) * size]
  return `${tip[0]},${tip[1]} ${left[0]},${left[1]} ${right[0]},${right[1]}`
}

function pointMarker([x, y], color, label) {
  return `<circle cx="${x}" cy="${y}" r="18" fill="${color}" stroke="#FFFFFF" stroke-width="5"/><text x="${x}" y="${y + 8}" fill="#FFFFFF" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700">${label}</text>`
}

function renderSvg(track) {
  const projected = projectGeometry(track)
  const start = markerAt(projected.course, track.geometry.markers?.start_index, 0).point
  const finish = markerAt(projected.course, track.geometry.markers?.finish_index, projected.course.length - 1).point
  const directionIndices = track.geometry.markers?.direction_indices?.length
    ? track.geometry.markers.direction_indices
    : [Math.floor(projected.course.length * 0.35), Math.floor(projected.course.length * 0.7)]
  const context = projected.context.map((line) => `<path d="${polylineD(line)}"/>`).join('')
  const zones = (track.geometry.zones ?? []).map((zone) => {
    const point = markerAt(projected.course, zone.point_index, 0).point
    const color = zone.type === 'inner' ? INNER_ZONE_COLOR : OUTER_ZONE_COLOR
    return `<circle cx="${point[0]}" cy="${point[1]}" r="29" fill="none" stroke="${color}" stroke-width="10"/>`
  }).join('')
  const arrows = directionIndices.map((index) => `<polygon points="${arrowAt(projected.course, index)}" fill="${START_COLOR}" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round"/>`).join('')
  const metadata = escapeXml(JSON.stringify({
    track_id: track.track_id,
    event: track.event_name,
    year: track.event_year,
    venue: track.venue_name,
    evidence_status: track.evidence_status,
    source_ids: (track.sources ?? [{ source_id: track.source_id }]).map((source) => typeof source === 'string' ? source : source.source_id),
  }))

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(track.display_name ?? track.track_id)}</title>
  <desc id="description">Original evidence-based redraw of the ${escapeXml(track.event_year ?? 'draft')} ${escapeXml(track.event_name ?? 'drift competition')} course at ${escapeXml(track.venue_name ?? track.track_id)}.</desc>
  <metadata>${metadata}</metadata>
  <g id="background"></g>
  <g id="context" fill="none" stroke="${CONTEXT_COLOR}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity="0.4">${context}</g>
  <g id="course" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="${polylineD(projected.course, track.geometry.smoothing ?? 0.9)}" stroke="${COURSE_COLOR}" stroke-width="52"/>
    <path d="${polylineD(projected.course, track.geometry.smoothing ?? 0.9)}" stroke="${CENTER_COLOR}" stroke-width="4" opacity="0.6"/>
  </g>
  <g id="zones">${zones}</g>
  <g id="markers">${arrows}${pointMarker(start, START_COLOR, 'S')}${pointMarker(finish, FINISH_COLOR, 'F')}</g>
  <g id="labels"></g>
</svg>`
}

function renderPng(svg) {
  return new Resvg(svg, {
    background: 'rgba(0, 0, 0, 0)',
    fitTo: { mode: 'width', value: WIDTH },
  }).render().asPng()
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'))
  const tracks = manifest.tracks.filter((track) => track.status === INCLUDED_STATUS)
  await Promise.all([SVG_DIR, PNG_DIR, QA_DIR].map((directory) => mkdir(directory, { recursive: true })))

  const results = []
  for (const track of tracks) {
    const svg = renderSvg(track)
    const png = renderPng(svg)
    const svgPath = path.join(SVG_DIR, `${track.track_id}.svg`)
    const pngPath = path.join(PNG_DIR, `${track.track_id}.png`)
    await writeFile(svgPath, svg)
    await writeFile(pngPath, png)
    results.push({
      track_id: track.track_id,
      svg_sha256: sha256(svg),
      png_sha256: sha256(png),
      svg_bytes: Buffer.byteLength(svg),
      png_bytes: png.byteLength,
    })
  }

  await writeFile(path.join(QA_DIR, 'render-results.json'), `${JSON.stringify({ generated_at: new Date().toISOString(), tracks: results }, null, 2)}\n`)
  console.log(`Rendered ${results.length} drift course SVG/PNG pairs.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
