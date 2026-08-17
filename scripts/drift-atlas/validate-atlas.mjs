import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(SCRIPT_DIR, '../..')
const RESEARCH_DIR = path.join(ROOT, 'docs/research/global-drift-track-atlas')
const MANIFEST_PATH = path.join(RESEARCH_DIR, 'production-manifest.json')
const SVG_DIR = path.join(ROOT, 'public/images/global-drift-track-atlas/svg')
const PNG_DIR = path.join(ROOT, 'public/images/global-drift-track-atlas/png')
const QA_DIR = path.join(RESEARCH_DIR, 'qa')

const REGION_QUOTAS = {
  japan: 10,
  'north-america': 10,
  europe: 12,
  oceania: 5,
  'asia-other': 6,
  'latin-america': 4,
  'middle-east-africa': 3,
}
const TIER_QUOTAS = { international: 28, national: 16, historic: 6 }
const REQUIRED_GROUPS = ['background', 'context', 'course', 'zones', 'markers', 'labels']
const TRACK_ID_PATTERN = /^[a-z]{2}-[a-z0-9-]+-[0-9]{4}(?:-[ab])?$/

const countBy = (items, key) => items.reduce((counts, item) => ({ ...counts, [item[key]]: (counts[item[key]] ?? 0) + 1 }), {})
const sameCounts = (actual, expected) => Object.entries(expected).every(([key, value]) => actual[key] === value)
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')

function validateRecord(track, allIds) {
  const errors = []
  const requiredStrings = ['track_id', 'display_name', 'event_name', 'series', 'event_tier', 'venue_name', 'city', 'country_or_region', 'iso_country_code', 'atlas_region', 'venue_type', 'direction', 'evidence_status', 'status']
  for (const key of requiredStrings) if (!track[key] || typeof track[key] !== 'string') errors.push(`${key} is required`)
  if (!TRACK_ID_PATTERN.test(track.track_id ?? '')) errors.push('track_id format is invalid')
  if (allIds.filter((id) => id === track.track_id).length !== 1) errors.push('track_id is duplicated')
  if (!Number.isInteger(track.event_year)) errors.push('event_year must be an integer')
  if (!Array.isArray(track.sources) || track.sources.length === 0) errors.push('sources are required')
  const routeSources = (track.sources ?? []).filter((source) => source.scope === 'course')
  const hasStrongRouteSource = routeSources.some((source) => ['S', 'A'].includes(source.tier))
  const hasTwoIndependentRouteSources = new Set(routeSources.filter((source) => ['A', 'B'].includes(source.tier)).map((source) => source.publisher)).size >= 2
  if (!hasStrongRouteSource && !hasTwoIndependentRouteSources) errors.push('route evidence requires one S/A source or two independent A/B sources')
  if (!Array.isArray(track.geometry?.course) || track.geometry.course.length < 4) errors.push('geometry.course needs at least 4 points')
  for (const [index, point] of (track.geometry?.course ?? []).entries()) {
    if (!Array.isArray(point) || point.length !== 2 || point.some((value) => !Number.isFinite(value))) errors.push(`course point ${index} is invalid`)
  }
  if (track.evidence_status !== 'source-threshold-met') errors.push('evidence_status must confirm the desk-research source threshold')
  if (!['highest', 'high', 'medium'].includes(track.geometry_confidence)) errors.push('geometry_confidence is required')
  if (track.geometry_review_status !== 'editorial-first-pass') errors.push('geometry_review_status must record the editorial first pass')
  if (track.status !== 'complete') errors.push('status must be complete')
  return errors
}

async function validateFiles(track, renderResults) {
  const errors = []
  const svgPath = path.join(SVG_DIR, `${track.track_id}.svg`)
  const pngPath = path.join(PNG_DIR, `${track.track_id}.png`)
  try {
    const svg = await readFile(svgPath, 'utf8')
    if (!svg.includes('width="1600" height="1200" viewBox="0 0 1600 1200"')) errors.push('SVG dimensions/viewBox are invalid')
    for (const group of REQUIRED_GROUPS) if (!svg.includes(`id="${group}"`)) errors.push(`SVG group ${group} missing`)
    if (/(<script|foreignObject|<image|https?:\/\/)/i.test(svg.replace('http://www.w3.org/2000/svg', ''))) errors.push('SVG contains prohibited external or executable content')
    const render = renderResults.get(track.track_id)
    if (!render || render.svg_sha256 !== sha256(svg)) errors.push('SVG hash does not match render results')
  } catch {
    errors.push('SVG file missing or unreadable')
  }
  try {
    const png = await readFile(pngPath)
    const signature = png.subarray(0, 8).toString('hex')
    if (signature !== '89504e470d0a1a0a') errors.push('PNG signature is invalid')
    if (png.readUInt32BE(16) !== 1600 || png.readUInt32BE(20) !== 1200) errors.push('PNG dimensions are invalid')
    const render = renderResults.get(track.track_id)
    if (!render || render.png_sha256 !== sha256(png)) errors.push('PNG hash does not match render results')
  } catch {
    errors.push('PNG file missing or unreadable')
  }
  return errors
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'))
  const tracks = manifest.tracks.filter((track) => track.status === 'complete')
  const allIds = tracks.map((track) => track.track_id)
  const report = { checked_at: new Date().toISOString(), errors: [], warnings: [], tracks: [] }
  const renderData = JSON.parse(await readFile(path.join(QA_DIR, 'render-results.json'), 'utf8'))
  const renderResults = new Map(renderData.tracks.map((record) => [record.track_id, record]))

  if (tracks.length !== 50) report.errors.push(`Expected 50 complete tracks, received ${tracks.length}`)
  const regions = countBy(tracks, 'atlas_region')
  const tiers = countBy(tracks, 'event_tier')
  if (!sameCounts(regions, REGION_QUOTAS)) report.errors.push(`Regional quotas do not match: ${JSON.stringify(regions)}`)
  if (!sameCounts(tiers, TIER_QUOTAS)) report.errors.push(`Event-tier quotas do not match: ${JSON.stringify(tiers)}`)
  if (new Set(tracks.map((track) => track.iso_country_code)).size < 20) report.errors.push('Fewer than 20 countries/regions')
  if (new Set(tracks.map((track) => track.venue_name)).size < 30) report.errors.push('Fewer than 30 distinct venues')
  if (tracks.filter((track) => ['street', 'parking'].includes(track.venue_type)).length < 10) report.errors.push('Fewer than 10 temporary/street/parking courses')
  for (const [series, count] of Object.entries(countBy(tracks, 'series'))) if (count > 10) report.errors.push(`Series ${series} exceeds 10 entries`)
  for (const [country, count] of Object.entries(countBy(tracks, 'iso_country_code'))) if (count > 10) report.errors.push(`Country ${country} exceeds 10 entries`)
  for (const [venue, count] of Object.entries(countBy(tracks, 'venue_name'))) if (count > 2) report.errors.push(`Venue ${venue} exceeds 2 entries`)

  for (const track of tracks) {
    const errors = [...validateRecord(track, allIds), ...await validateFiles(track, renderResults)]
    report.tracks.push({ track_id: track.track_id, errors })
    for (const error of errors) report.errors.push(`${track.track_id}: ${error}`)
  }

  const [svgFiles, pngFiles] = await Promise.all([readdir(SVG_DIR), readdir(PNG_DIR)])
  if (svgFiles.filter((file) => file.endsWith('.svg')).length !== 50) report.errors.push('SVG directory does not contain exactly 50 SVG files')
  if (pngFiles.filter((file) => file.endsWith('.png')).length !== 50) report.errors.push('PNG directory does not contain exactly 50 PNG files')

  await writeFile(path.join(QA_DIR, 'technical-validation.json'), `${JSON.stringify(report, null, 2)}\n`)
  if (report.errors.length > 0) {
    console.error(`Atlas validation failed with ${report.errors.length} error(s).`)
    process.exitCode = 1
  } else {
    console.log('Atlas validation passed: 50 verified SVG/PNG pairs and all quotas satisfied.')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
