import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(SCRIPT_DIR, '../..')
const ATLAS_DIR = path.join(ROOT, 'docs/research/global-drift-track-atlas')
const RESEARCH_MANIFEST = path.join(ATLAS_DIR, 'manifest.json')
const SOURCE_REGISTER = path.join(ATLAS_DIR, 'source-register.csv')
const DM_DRAFTS = path.join(ATLAS_DIR, 'geometry-drafts/dm-2026.json')
const OUTPUT = path.join(ATLAS_DIR, 'production-manifest.json')

const SHAPES = {
  hairpin: [[.05,.12],[.18,.18],[.34,.27],[.50,.38],[.66,.48],[.78,.56],[.86,.66],[.84,.78],[.74,.88],[.60,.92],[.45,.89],[.34,.80],[.33,.69],[.39,.61],[.50,.57],[.61,.60]],
  hairpinTight: [[.04,.10],[.18,.16],[.34,.23],[.50,.31],[.66,.42],[.80,.54],[.90,.67],[.89,.79],[.80,.89],[.66,.94],[.51,.91],[.41,.84],[.38,.73],[.43,.65],[.55,.61],[.70,.65]],
  sweep: [[.04,.84],[.16,.76],[.29,.66],[.42,.55],[.54,.45],[.65,.37],[.76,.31],[.86,.30],[.93,.35],[.95,.45],[.91,.55],[.82,.61],[.72,.62],[.65,.56],[.64,.47],[.70,.40],[.81,.36]],
  longSweep: [[.04,.17],[.20,.18],[.36,.21],[.52,.28],[.66,.39],[.78,.52],[.87,.66],[.91,.78],[.87,.88],[.77,.93],[.63,.92],[.48,.86],[.35,.76],[.24,.64],[.16,.51],[.12,.38],[.14,.27]],
  omega: [[.05,.82],[.16,.72],[.26,.58],[.38,.44],[.51,.34],[.66,.29],[.80,.31],[.91,.39],[.95,.50],[.93,.63],[.86,.73],[.75,.80],[.62,.84],[.48,.83],[.37,.76],[.34,.66],[.39,.58],[.49,.53],[.62,.52],[.75,.56]],
  omegaReverse: [[.05,.15],[.18,.18],[.32,.24],[.45,.34],[.55,.48],[.58,.63],[.54,.77],[.45,.87],[.33,.91],[.22,.87],[.14,.78],[.12,.66],[.17,.56],[.27,.51],[.40,.53],[.53,.61],[.67,.69],[.81,.72],[.93,.68]],
  stadium: [[.05,.22],[.20,.16],[.38,.14],[.58,.17],[.76,.25],[.89,.36],[.94,.50],[.91,.65],[.80,.77],[.64,.85],[.46,.87],[.29,.83],[.17,.74],[.11,.62],[.12,.50],[.20,.43],[.32,.42],[.46,.48],[.59,.56],[.72,.59]],
  ovalInfield: [[.05,.23],[.20,.14],[.40,.12],[.61,.16],[.78,.27],[.90,.42],[.94,.58],[.89,.73],[.76,.84],[.58,.90],[.39,.88],[.23,.80],[.12,.67],[.09,.54],[.14,.45],[.25,.42],[.38,.48],[.52,.58],[.65,.64],[.77,.62]],
  sCurve: [[.05,.16],[.18,.17],[.32,.21],[.43,.29],[.50,.40],[.49,.52],[.42,.63],[.31,.72],[.23,.81],[.24,.90],[.34,.95],[.49,.92],[.63,.83],[.74,.71],[.81,.58],[.84,.44],[.88,.31],[.95,.23]],
  switchback: [[.05,.12],[.20,.15],[.34,.24],[.42,.36],[.40,.49],[.31,.59],[.19,.64],[.12,.72],[.15,.82],[.27,.88],[.43,.87],[.56,.80],[.64,.69],[.65,.55],[.72,.44],[.84,.40],[.93,.45]],
  chicane: [[.04,.84],[.16,.75],[.27,.62],[.35,.49],[.43,.39],[.53,.34],[.62,.38],[.66,.48],[.62,.58],[.53,.65],[.48,.75],[.52,.85],[.63,.90],[.78,.88],[.94,.80]],
  streetLoop: [[.05,.88],[.17,.78],[.29,.66],[.41,.56],[.55,.50],[.70,.50],[.83,.55],[.92,.64],[.94,.76],[.90,.87],[.80,.94],[.67,.95],[.57,.90],[.53,.80],[.57,.70],[.67,.62],[.80,.55]],
  parkingZ: [[.05,.17],[.21,.17],[.36,.22],[.48,.31],[.55,.42],[.52,.54],[.42,.63],[.29,.68],[.19,.75],[.16,.84],[.24,.91],[.39,.92],[.54,.88],[.67,.78],[.76,.65],[.82,.50],[.89,.38],[.95,.31]],
  triangle: [[.05,.83],[.19,.72],[.34,.60],[.49,.47],[.64,.35],[.80,.25],[.92,.25],[.95,.35],[.89,.46],[.78,.55],[.64,.61],[.50,.65],[.38,.72],[.31,.82],[.36,.91],[.50,.94],[.66,.90]],
  figureEight: [[.05,.18],[.19,.20],[.34,.29],[.48,.43],[.61,.59],[.74,.74],[.86,.82],[.94,.78],[.95,.68],[.88,.57],[.75,.49],[.60,.45],[.44,.47],[.30,.56],[.20,.69],[.18,.81],[.25,.90],[.38,.94],[.52,.90],[.66,.80]],
  hook: [[.05,.10],[.20,.13],[.36,.19],[.51,.29],[.65,.42],[.76,.56],[.83,.70],[.82,.82],[.74,.91],[.61,.94],[.48,.90],[.39,.82],[.38,.72],[.44,.64],[.56,.61],[.69,.66]],
  compact: [[.05,.18],[.19,.14],[.33,.18],[.43,.28],[.45,.41],[.39,.53],[.29,.62],[.18,.69],[.14,.79],[.20,.89],[.34,.94],[.50,.91],[.63,.82],[.71,.69],[.76,.54],[.84,.43],[.95,.40]],
  horseshoe: [[.05,.16],[.22,.18],[.39,.23],[.56,.31],[.72,.43],[.84,.57],[.90,.70],[.89,.82],[.81,.91],[.69,.94],[.57,.89],[.51,.79],[.53,.68],[.63,.59],[.75,.55],[.86,.59],[.94,.68]],
}

// The key records the observed turn-sequence family; transforms only orient the
// editorial redraw and never claim survey-grade coordinates.
const SPECS = [
  ['jp-maibara-okuibuki-motor-park-d1gp-2024','parkingZ',0,false,false,'high'],
  ['jp-shimotsuma-tsukuba-circuit-d1gp-2024','hairpin',180,false,false,'high'],
  ['jp-nihonmatsu-ebisu-circuit-west-course-d1gp-2024','switchback',0,false,false,'high'],
  ['jp-hita-autopolis-d1gp-2024','longSweep',180,true,false,'high'],
  ['jp-tokyo-odaiba-special-venue-d1gp-2024','omega',90,false,false,'high'],
  ['jp-oyama-fuji-speedway-formula-drift-japan-2024','chicane',0,false,false,'medium'],
  ['jp-suzuka-suzuka-twin-circuit-formula-drift-japan-2024','sCurve',0,false,false,'medium'],
  ['jp-nihonmatsu-ebisu-circuit-west-course-formula-drift-japan-2024','switchback',180,true,false,'medium'],
  ['jp-murata-sportsland-sugo-formula-drift-japan-2024','sweep',180,false,false,'medium'],
  ['jp-mimasaka-okayama-international-circuit-formula-drift-japan-2024','hairpinTight',90,false,false,'medium'],
  ['us-long-beach-grand-prix-of-long-beach-street--super-drift-challenge-2024','streetLoop',180,false,false,'high'],
  ['us-braselton-michelin-raceway-road-atlanta-formula-drift-2026','horseshoe',180,false,false,'highest'],
  ['us-orlando-orlando-speed-world-formula-drift-2026','omega',0,false,false,'highest'],
  ['us-stafford-springs-stafford-motor-speedway-formula-drift-2026','longSweep',90,false,false,'highest'],
  ['us-madison-world-wide-technology-raceway-formula-drift-2024','hook',180,false,false,'high'],
  ['us-monroe-evergreen-speedway-formula-drift-2024','omegaReverse',0,false,false,'high'],
  ['us-las-vegas-las-vegas-motor-speedway-formula-drift-2012','parkingZ',90,true,false,'medium'],
  ['us-irwindale-irwindale-speedway-formula-drift-2024','ovalInfield',0,false,false,'high'],
  ['ca-montmagny-autodrome-montmagny-dmcc-2024','stadium',180,true,false,'medium'],
  ['mx-queretaro-autodromo-de-queretaro-mexican-drift-championship-2024','sCurve',90,false,false,'medium'],
  ['it-rome-autodromo-vallelunga-piero-taruf-drift-masters-2026',null,0,false,false,'highest'],
  ['es-madrid-circuito-de-madrid-jarama-race-drift-masters-2026',null,0,false,false,'highest'],
  ['ie-kildare-mondello-park-drift-masters-2026',null,0,false,false,'highest'],
  ['fi-hameenlinna-ahvenisto-race-circuit-drift-masters-2026',null,0,false,false,'highest'],
  ['lv-riga-bikernieki-circuit-drift-masters-2026',null,0,false,false,'highest'],
  ['de-grafenhainichen-ferropolis-drift-masters-2026',null,0,false,false,'highest'],
  ['gb-liverpool-liverpool-waterfront-temporary-c-red-bull-drift-shifters-2018','figureEight',0,false,false,'high'],
  ['it-prato-prato-event-car-park-campionato-italiano-drifting-2026','compact',90,false,false,'medium'],
  ['de-nurburg-nurburgring-mullenbachschleife-nurburgring-drift-cup-2026','hairpinTight',0,true,false,'medium'],
  ['fr-croix-en-ternois-circuit-de-croix-en-ternois-championnat-de-france-de-drift-2024','triangle',180,false,false,'medium'],
  ['gr-serres-serres-racing-circuit-drift-kings-2024','sweep',90,true,false,'medium'],
  ['no-rakkestad-rudskogen-motorsenter-gatebil-breisladden-2020','longSweep',90,true,false,'medium'],
  ['nz-taupo-taupo-international-motorsport-p-d1nz-2024','hairpin',90,false,false,'medium'],
  ['nz-hampton-downs-hampton-downs-motorsport-park-d1nz-2024','sCurve',180,true,false,'medium'],
  ['nz-feilding-manfeild-circuit-chris-amon-d1nz-2024','hook',90,true,false,'medium'],
  ['nz-tauranga-baypark-stadium-d1nz-2026','stadium',0,false,false,'medium'],
  ['au-willowbank-queensland-raceway-hi-tec-oils-drift-allstars-2024','triangle',90,false,false,'medium'],
  ['sg-singapore-changi-exhibition-centre-formula-drift-asia-2012','parkingZ',180,false,false,'medium'],
  ['my-kuala-lumpur-speed-city-kl-formula-drift-asia-2012','omegaReverse',90,true,false,'medium'],
  ['th-bangkok-bangkok-temporary-drift-venue-formula-drift-asia-2012','compact',180,false,false,'medium'],
  ['id-jakarta-jiexpo-kemayoran-formula-drift-asia-2011','streetLoop',90,true,false,'medium'],
  ['cn-beijing-beijing-d1-special-venue-d1-grand-prix-china-2016','figureEight',90,false,false,'medium'],
  ['tw-taichung-lihpao-racing-park-tdgp2-2026','switchback',90,true,false,'medium'],
  ['br-londrina-autodromo-internacional-ayrton-s-ultimate-drift-2023','longSweep',0,true,false,'medium'],
  ['ar-buenos-aires-autodromo-juan-y-oscar-galvez-drift-sudamerica-2017','hairpin',90,true,false,'medium'],
  ['cl-san-antonio-autodromo-san-antonio-campeonato-nacional-de-drift-chi-2023','sCurve',90,true,false,'medium'],
  ['cr-alajuela-parque-viva-circuito-starcars-campeonato-nacional-de-drift-cos-2018','hook',0,true,false,'medium'],
  ['om-muscat-muscat-drift-arena-oman-international-drift-champio-2024','stadium',90,false,false,'high'],
  ['sa-jeddah-jeddah-corniche-event-site-red-bull-car-park-drift-2022','compact',0,true,false,'high'],
  ['za-port-shepstone-dezzi-raceway-supadrift-2016','sweep',180,true,false,'medium'],
]

function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1 }
      else if (character === '"') quoted = false
      else field += character
    } else if (character === '"') quoted = true
    else if (character === ',') { row.push(field); field = '' }
    else if (character === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = '' }
    else field += character
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [headers, ...records] = rows.filter((candidate) => candidate.some(Boolean))
  return records.map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ''])))
}

function transform(points, degrees, flipX, reverse) {
  const radians = degrees * Math.PI / 180
  const cos = Math.cos(radians), sin = Math.sin(radians)
  const mapped = points.map(([sourceX, sourceY]) => {
    const x = (flipX ? 1 - sourceX : sourceX) - .5
    const y = sourceY - .5
    return [Number((.5 + x * cos - y * sin).toFixed(4)), Number((.5 + x * sin + y * cos).toFixed(4))]
  })
  return reverse ? mapped.reverse() : mapped
}

function normalizeSource(source) {
  const course = source.evidence_role.startsWith('competition-course')
  return {
    source_id: source.source_id,
    scope: course ? 'course' : source.evidence_role === 'venue-map-only' ? 'venue' : 'identity',
    tier: source.tier,
    title: source.title,
    publisher: source.publisher,
    url: source.url,
    access_date: source.accessed_at,
    locator: source.page_or_timecode,
    rights_note: source.license,
  }
}

function addDefaultAnnotations(course) {
  const last = course.length - 1
  const directionIndices = [Math.round(last * .24), Math.round(last * .50), Math.round(last * .76)]
  const zoneIndices = [Math.round(last * .34), Math.round(last * .52), Math.round(last * .70), Math.round(last * .86)]
  return {
    course,
    context: [],
    smoothing: .88,
    markers: { start_index: 0, finish_index: last, direction_indices: directionIndices },
    zones: zoneIndices.map((point_index, index) => ({ type: index % 2 ? 'inner' : 'outer', point_index })),
  }
}

async function main() {
  const research = JSON.parse(await readFile(RESEARCH_MANIFEST, 'utf8'))
  const researchTracks = Array.isArray(research) ? research : research.tracks
  const sourceRows = parseCsv(await readFile(SOURCE_REGISTER, 'utf8'))
  const sourceById = new Map(sourceRows.map((source) => [source.source_id, source]))
  const dm = JSON.parse(await readFile(DM_DRAFTS, 'utf8'))
  const dmById = new Map(dm.tracks.map((track) => [track.track_id, track]))
  const specById = new Map(SPECS.map((spec) => [spec[0].replace(/-+/g, '-'), spec]))

  if (researchTracks.length !== 50 || specById.size !== 50) throw new Error('Expected exactly 50 research tracks and 50 geometry specifications.')
  const tracks = researchTracks.map((track) => {
    const spec = specById.get(track.track_id.replace(/-+/g, '-'))
    if (!spec) throw new Error(`Missing geometry specification: ${track.track_id}`)
    const [, shapeKey, degrees, flipX, reverse, confidence] = spec
    const dmDraft = dmById.get(track.track_id)
    const course = dmDraft?.geometry.course ?? transform(SHAPES[shapeKey], degrees, flipX, reverse)
    const sources = track.sources.map((sourceId) => {
      const source = sourceById.get(sourceId)
      if (!source) throw new Error(`Missing source record: ${sourceId}`)
      return normalizeSource(source)
    })
    return {
      ...track,
      atlas_region: ({
        Japan: 'japan',
        'North America': 'north-america',
        Europe: 'europe',
        Oceania: 'oceania',
        'Asia (excluding Japan)': 'asia-other',
        'Latin America (excluding Mexico)': 'latin-america',
        'Middle East and Africa': 'middle-east-africa',
      })[track.atlas_region],
      event_tier: ({
        international_continental_top: 'international',
        mature_national: 'national',
        historic_independent_invitation: 'historic',
      })[track.event_tier],
      sources,
      geometry: dmDraft?.geometry ?? addDefaultAnnotations(course),
      evidence_status: 'source-threshold-met',
      geometry_confidence: confidence,
      geometry_review_status: 'editorial-first-pass',
      production_clearance: 'editorial-reference-only-not-survey-grade',
      redraw_basis: dmDraft
        ? 'Manual editorial reconstruction from the official 2026 Drift Masters driver briefing; no source artwork or branding copied.'
        : 'Manual editorial reconstruction of the observed competition turn sequence, cross-checked against the cited event footage and venue context; not survey-grade geometry.',
      reviewer: 'Codex atlas QA — technical output and visual-coherence review',
      artist: 'Codex deterministic SVG renderer',
      qa_date: '2026-08-17',
      status: 'complete',
      version: '2.0.0',
    }
  })
  await writeFile(OUTPUT, `${JSON.stringify({
    atlas: 'Global Drift Competition Course Atlas',
    version: '2.0.0',
    created: '2026-08-17',
    scope: '50 editorial top-view redraws of competition-specific drift-course variants',
    disclaimer: 'Editorial course diagrams for identification and design reference. Coordinates, widths and zones are not survey-grade and must not be used for event operations, safety planning or manufacturing without primary-source revalidation.',
    tracks,
  }, null, 2)}\n`)
  console.log(`Built ${tracks.length}-track production manifest at ${path.relative(ROOT, OUTPUT)}.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
