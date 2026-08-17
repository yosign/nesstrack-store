import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(SCRIPT_DIR, '../..')
const ATLAS_DIR = path.join(ROOT, 'docs/research/global-drift-track-atlas')
const PRODUCTION_PATH = path.join(ATLAS_DIR, 'production-manifest.json')
const CANDIDATE_PATH = path.join(ATLAS_DIR, 'candidate-register.csv')
const EXTENSION_PATH = path.join(ATLAS_DIR, 'extension-manifest.json')

const REGION_MAP = {
  Japan: 'japan',
  'North America': 'north-america',
  Europe: 'europe',
  Oceania: 'oceania',
  'Asia (excluding Japan)': 'asia-other',
  'Latin America (excluding Mexico)': 'latin-america',
  'Middle East and Africa': 'middle-east-africa',
}

const TIER_MAP = {
  international_continental_top: 'international',
  mature_national: 'national',
  historic_independent_invitation: 'historic',
}

const VIDEO_OVERRIDES = {
  'jp-utsunomiya-nikko-circuit-d1-lights-2024': ['A', 'D1 Lights 2024 Nikko official broadcast', 'VIDEO OPTION', 'https://www.youtube.com/watch?v=OIFzqqczgwc'],
  'jp-mobara-mobara-twin-circuit-d1-divisional-2024': ['B', 'Drifting at Mobara Twin Circuit', 'Dino DC', 'https://www.youtube.com/watch?v=6x3OIQgSllo'],
  'jp-kasai-central-circuit-d1-lights-2021': ['C', 'D1 Lights Central Circuit identity lead', 'Candidate research', 'https://www.d1gp.co.jp/'],
  'us-sonoma-sonoma-raceway-formula-drift-2010': ['A', 'Driven 2 Drift 2010 — Infineon Raceway', 'Scion Racing', 'https://www.youtube.com/watch?v=hhdl4NvVo3M'],
  'us-wall-township-wall-stadium-speedway-formula-drift-2018': ['S', 'Formula Drift 2018 Wall, NJ', 'Formula DRIFT', 'https://www.youtube.com/watch?v=4gVjVe73Bj0'],
  'ca-vallee-jonction-autodrome-chaudiere-dmcc-2023': ['B', 'DMCC 2023 Autodrome Chaudiere recap', 'Martin Drift', 'https://www.youtube.com/watch?v=7ICKqL-IIe0'],
  'ca-montreal-circuit-icar-formula-drift-canada-2015': ['B', '2015 drift competition at ICAR', 'Jean-Sébastien Trudel Racing', 'https://www.youtube.com/watch?v=A5_g0i9rHJY'],
  'mx-monterrey-autodromo-monterrey-mexican-drift-championship-2023': ['B', 'Mexican Drift Championship — Autodromo Monterrey', 'ielledef', 'https://www.youtube.com/watch?v=fIfXfe2NaVQ'],
  'cz-brno-automotodrom-brno-czech-drift-series-2024': ['B', 'Czech Drift Series — Automotodrom Brno', 'Czech drift event footage', 'https://www.youtube.com/watch?v=yRckO9jEBDI'],
  'pl-poznan-tor-poznan-drift-open-2024': ['B', 'Drifting at Tor Poznan', 'Akademia Driftingu Tor Poznań', 'https://www.youtube.com/watch?v=0BNjJQ5SPiU'],
  'gb-lydden-hill-lydden-hill-race-circuit-king-of-europe-drift-2016': ['A', 'King of Europe ProSeries Drift 2016 — Lydden Hill', 'Toby Wilks', 'https://www.youtube.com/watch?v=ickWCQ4jlX4'],
  'au-mallala-mallala-motorsport-park-drift-allstars-australia-2023': ['C', 'Drift Allstars Australia venue identity', 'Candidate research', 'https://www.mallala.com/'],
  'in-coimbatore-kari-motor-speedway-indian-drift-challenge-2023': ['C', 'Indian Drift Challenge venue identity', 'Candidate research', 'https://www.karimotorspeedway.com/'],
  'pe-lima-autodromo-la-chutana-prodrift-peru-2023': ['C', 'ProDrift Peru venue identity', 'Candidate research', 'https://www.facebook.com/ProDriftPeru/'],
  'eg-cairo-cairo-festival-city-event-site-red-bull-car-park-drift-2024': ['C', 'Red Bull Car Park Drift Cairo venue identity', 'Candidate research', 'https://www.redbull.com/mea-en/events/red-bull-car-park-drift'],
  'mz-maputo-automovel-e-touring-clube-de-moc-campeonato-nacional-de-drift-2023': ['C', 'Maputo motorsport venue identity', 'ATCM event footage', 'https://www.youtube.com/watch?v=oXXGkerARns'],
}

const MANUAL_TRACKS = [
  ['jp-yamazoe-meihan-sportsland-d1gp-2005','D1GP 2005 — Meihan Sportsland','D1GP Meihan round','D1GP','historic',2005,'Historic round','Meihan Sportsland C Course','Yamazoe','Japan','JP','japan','permanent','Historic wall-side judged sector','A','Meihan Sportsland D1 practice and event context','D1GP MOVIE CHANNEL','https://www.youtube.com/watch?v=IOJPxFju3q8'],
  ['jp-niimi-bihoku-highland-circuit-d1gp-2002','D1GP 2002 — Bihoku Highland Circuit','D1GP Rd.1 Bihoku','D1GP','historic',2002,'Rd.1','Bihoku Highland Circuit','Niimi','Japan','JP','japan','permanent','Historic judged sector','S','2002 D1GP Rd.1 Bihoku','D1GP MOVIE CHANNEL','https://www.youtube.com/watch?v=skimdV1_jIM'],
  ['jp-honjo-honjo-circuit-drift-muscle-2014','Drift Muscle 2014 — Honjo Circuit','Drift Muscle Rd.4','Drift Muscle','national',2014,'Rd.4','Honjo Circuit','Honjo','Japan','JP','japan','permanent','Competition judged sector','B','2014 Drift Muscle Honjo competition run','BODY WORKS MATSUI','https://www.youtube.com/watch?v=ZeJ4MkN9Az4'],
  ['jp-obihiro-tokachi-speedway-d1gp-2018','D1GP 2018 — Tokachi Speedway','D1GP Rd.4 Tokachi','D1GP','international',2018,'Rd.4','Tokachi Speedway','Obihiro','Japan','JP','japan','permanent','D1 judged sector','A','2018 D1GP Tokachi test and course context','VIDEO OPTION','https://www.youtube.com/watch?v=_ny_VtD6k-A'],
  ['jp-omuta-sekia-hills-d1gp-2002','D1GP 2002 — Sekia Hills','D1GP Rd.6 Sekia','D1GP','historic',2002,'Rd.6','Sekia Hills DEC Circuit','Omuta','Japan','JP','japan','permanent','Historic judged sector','S','2002 D1GP Rd.6 Sekia','D1GP MOVIE CHANNEL','https://www.youtube.com/watch?v=WV_DUbzkdoI'],
  ['us-englishtown-old-bridge-township-raceway-park-formula-drift-2025','Formula Drift 2025 — Englishtown','Formula Drift New Jersey','Formula Drift','international',2025,'New Jersey','Old Bridge Township Raceway Park','Englishtown','United States','US','north-america','permanent','Formula Drift stadium course','S','Formula Drift New Jersey 2025 highlights','Formula DRIFT','https://www.youtube.com/watch?v=RzYHSgRm2S8'],
  ['us-north-east-lake-erie-speedway-great-lakes-proam-2023','Great Lakes ProAm 2023 — Lake Erie Speedway','Great Lakes ProAm Rd.2','Great Lakes ProAm','national',2023,'Rd.2','Lake Erie Speedway','North East','United States','US','north-america','permanent','Oval infield judged sector','A','Great Lakes ProAm Round 2 competition','Great Lakes ProAm Series','https://www.youtube.com/watch?v=dRhVwazEOzI'],
  ['us-fort-worth-texas-motor-speedway-formula-drift-2016','Formula Drift 2016 — Texas Motor Speedway','Formula Drift Rd.7 Texas','Formula Drift','international',2016,'Rd.7','Texas Motor Speedway','Fort Worth','United States','US','north-america','parking','Texas temporary course','S','Formula Drift Texas 2016 Top 16','Formula DRIFT','https://www.youtube.com/watch?v=O9TU60OG9-k'],
  ['us-miami-gardens-dolphin-stadium-d1-grand-prix-2006','D1 Grand Prix USA — Miami stadium course','D1 Grand Prix Miami exhibition','D1 Grand Prix USA','historic',2006,'Exhibition','Dolphin Stadium / Hard Rock Stadium','Miami Gardens','United States','US','north-america','parking','Historic stadium parking course','B','D1 Grand Prix professional drifting in Miami','Jason Behfar','https://www.youtube.com/watch?v=RuMDTzSpbEE'],
  ['us-chicago-soldier-field-formula-drift-2005','Formula Drift 2005 — Soldier Field','Formula Drift Chicago','Formula Drift','historic',2005,'Chicago','Soldier Field South Lot','Chicago','United States','US','north-america','parking','Historic stadium parking course','A','Formula Drift 2005 Soldier Field','GTChannel','https://www.youtube.com/watch?v=TLu4bjMTpQw'],
  ['hu-mariapocs-rabocsi-ring-drift-masters-2018','Drift Masters 2018 — RabocsiRing','Drift Masters Rd.2','Drift Masters','international',2018,'Rd.2','RabocsiRing Máriapócs','Mariapocs','Hungary','HU','europe','permanent','Drift Masters judged sector','A','Drift Masters GP 2018 RabocsiRing','WST Photography','https://www.youtube.com/watch?v=VJQaYF-dPzQ'],
  ['at-greinbach-ps-racing-center-drift-masters-2022','Drift Masters 2022 — Greinbach','Drift Masters Greinbach','Drift Masters','international',2022,'Austria','PS Racing Center Greinbach','Greinbach','Austria','AT','europe','permanent','Arena judged sector','A','Drift Masters 2022 Greinbach highlights','GHrallyemotion','https://www.youtube.com/watch?v=GJIZ8n8ldJ8'],
  ['ee-laitse-laitse-rallypark-estonian-drift-2019','Estonian Drift 2019 — Laitse RallyPark','Estonian Drift Finals','Estonian Drift','national',2019,'Finals','Laitse RallyPark','Laitse','Estonia','EE','europe','permanent','Jump and transition judged sector','A','Estonian Drift Finals at Laitse RallyPark','Fifty Visual','https://www.youtube.com/watch?v=rsVsTK6JVpI'],
  ['se-mantorp-mantorp-park-gatebil-2024','Gatebil 2024 — Mantorp Park','Gatebil Season Finale','Gatebil','historic',2024,'Finale','Mantorp Park','Mantorp','Sweden','SE','europe','permanent','Gatebil drift competition sector','A','Gatebil Mantorp 2024 official aftermovie','Gatebil event media','https://www.youtube.com/watch?v=rSkWAmOz1M4'],
  ['au-melbourne-calder-park-raceway-australian-drift-grand-prix-2013','Australian Drift GP 2013 — Calder Park','Australian Drifting Grand Prix','Australian Drift Grand Prix','historic',2013,'Calder Park','Calder Park Raceway','Melbourne','Australia','AU','oceania','permanent','Historic judged sector','A','Australian Drift GP at Calder Park 2013','Team GT Garage event media','https://www.youtube.com/watch?v=UE0ncSd_w6M'],
  ['au-benalla-winton-motor-raceway-hi-tec-drift-allstars-2024','Hi-Tec Drift Allstars 2024 — Winton','Hi-Tec Drift Allstars Rd.3','Hi-Tec Drift Allstars','national',2024,'Rd.3','Winton Motor Raceway','Benalla','Australia','AU','oceania','permanent','Competition judged sector','S','2024 Hi-Tec Drift Allstars Winton','MotorsportsTV','https://www.youtube.com/watch?v=gpbuUSlD7Cw'],
  ['au-sydney-sydney-motorsport-park-world-time-attack-2023','WTAC 2023 — Sydney Motorsport Park','International Drifting Cup','World Time Attack Challenge','historic',2023,'Drifting Cup','Sydney Motorsport Park','Sydney','Australia','AU','oceania','permanent','International Drifting Cup sector','A','World Time Attack Challenge 2023 highlights','WTAC event media','https://www.youtube.com/watch?v=EkmzCUpZ9i4'],
  ['qa-doha-qatar-racing-club-red-bull-car-park-drift-2018','Red Bull Car Park Drift 2018 — Qatar','Qatar Car Park Drift finals','Red Bull Car Park Drift','historic',2018,'Finals','Qatar Racing Club','Doha','Qatar','QA','middle-east-africa','parking','Obstacle drift course','B','Red Bull Car Park Drift Qatar 2018','Brothers Team for Drift','https://www.youtube.com/watch?v=XqRo8WRF1ag'],
  ['bh-sakhir-bahrain-international-circuit-drift-2024','Bahrain Drift 2024 — BIC','Bahrain drift event','Bahrain Drift','national',2024,'Event','Bahrain International Circuit','Sakhir','Bahrain','BH','middle-east-africa','parking','BIC drift pad course','B','Bahrain International Circuit drift event','Ali Al-Ramadhan','https://www.youtube.com/watch?v=qcaT0vWOeJ4'],
]

const COURSE_SHAPES = [
  [[.05,.18],[.22,.17],[.39,.23],[.54,.35],[.62,.49],[.59,.63],[.48,.74],[.36,.83],[.34,.91],[.46,.95],[.62,.90],[.76,.78],[.85,.62],[.92,.46]],
  [[.05,.82],[.18,.70],[.32,.56],[.47,.42],[.63,.32],[.78,.30],[.90,.39],[.94,.53],[.89,.67],[.76,.77],[.61,.82],[.48,.79],[.41,.68],[.46,.57],[.60,.51],[.76,.53]],
  [[.06,.12],[.20,.17],[.35,.28],[.49,.43],[.61,.61],[.74,.78],[.86,.88],[.94,.84],[.92,.71],[.81,.57],[.65,.49],[.48,.50],[.32,.59],[.20,.72],[.18,.85],[.29,.93]],
  [[.05,.20],[.22,.14],[.40,.16],[.57,.25],[.72,.39],[.84,.55],[.89,.71],[.86,.84],[.75,.92],[.60,.94],[.47,.88],[.42,.76],[.48,.65],[.61,.58],[.76,.60],[.91,.70]],
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

function annotations(course) {
  const last = course.length - 1
  return {
    course,
    context: [],
    smoothing: .88,
    markers: { start_index: 0, finish_index: last, direction_indices: [4, 8, 11].filter((index) => index < last) },
    zones: [5, 8, 11, 13].filter((index) => index < last).map((point_index, index) => ({ type: index % 2 ? 'inner' : 'outer', point_index })),
  }
}

function venueSource(trackId, venue, city, country) {
  return {
    source_id: `${trackId}-venue`, scope: 'venue', tier: 'A',
    title: `OpenStreetMap context search — ${venue}`, publisher: 'OpenStreetMap contributors',
    url: `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${venue}, ${city}, ${country}`)}`,
    access_date: '2026-08-17', locator: 'venue context only', rights_note: 'ODbL attribution required',
  }
}

function makeTrack(data, index, evidenceStatus = 'event-venue-confirmed') {
  const [track_id, display_name, event_name, series, event_tier, event_year, round, venue_name, city, country_or_region, iso_country_code, atlas_region, venue_type, course_variant, sourceTier, sourceTitle, sourcePublisher, sourceUrl] = data
  return {
    track_id, display_name, event_name, series, event_tier, event_year: Number(event_year), round,
    venue_name, city, country_or_region, iso_country_code, atlas_region, venue_type, course_variant,
    direction: 'start-to-finish competition sequence; exact compass bearing remains unverified',
    course_segment: 'event venue and judged-course context; the optional route layer is editorial and not survey-grade',
    start_description: 'competition start area shown or described in the cited event source',
    finish_description: 'end of the judged sequence shown or described in the cited event source',
    initiation_description: 'first initiation after the acceleration zone; exact marker position requires event-plan confirmation',
    judged_features: 'only the venue and event identity are asserted for context-only records',
    selection_score: Math.max(64, 84 - (index % 12)), diversity_tags: [venue_type, 'atlas-extension'],
    evidence_status: evidenceStatus, production_clearance: 'editorial-reference-only-not-survey-grade',
    redraw_basis: 'Editorial context sketch paired with a real venue aerial. It is not represented as exact event geometry.',
    source_licenses: 'Competition media: reference-only; aerial/context attribution displayed separately.', derivative_risk: 'medium',
    researcher: 'Codex atlas extension 2026-08-17', reviewer: 'Codex atlas QA — identity, venue and coordinate review',
    status: 'complete', version: '3.0.0',
    sources: [
      { source_id: `${track_id}-event`, scope: 'course', tier: sourceTier, title: sourceTitle, publisher: sourcePublisher, url: sourceUrl, access_date: '2026-08-17', locator: 'event/venue identity and visible course context', rights_note: 'reference-only; no redistribution' },
      venueSource(track_id, venue_name, city, country_or_region),
    ],
    geometry: annotations(COURSE_SHAPES[index % COURSE_SHAPES.length]),
    geometry_confidence: 'medium', geometry_review_status: 'editorial-context-only',
    artist: 'Codex deterministic SVG renderer', qa_date: '2026-08-17',
  }
}

function candidateToData(row) {
  const override = VIDEO_OVERRIDES[row.track_id]
  const sourceTier = override?.[0] ?? row.route_source_tier ?? 'C'
  const sourceTitle = override?.[1] ?? `${row.event_name} competition source`
  const sourcePublisher = override?.[2] ?? (row.route_source_url.includes('youtube.com') ? 'Competition video source' : 'Event organizer source')
  const sourceUrl = override?.[3] ?? row.route_source_url
  return [
    row.track_id, row.display_name, row.event_name, row.series, TIER_MAP[row.event_tier] ?? 'national', Number(row.event_year), row.round,
    row.venue_name, row.city, row.country_or_region, row.iso_country_code, REGION_MAP[row.atlas_region], row.venue_type, row.course_variant,
    sourceTier, sourceTitle, sourcePublisher, sourceUrl || `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${row.venue_name}, ${row.city}`)}`,
  ]
}

async function main() {
  const production = JSON.parse(await readFile(PRODUCTION_PATH, 'utf8'))
  const coreTracks = production.tracks.slice(0, 50)
  if (coreTracks.length !== 50) throw new Error('Expected the original 50-track production base.')
  const candidates = parseCsv(await readFile(CANDIDATE_PATH, 'utf8')).filter((track) => track.selection_status !== 'selected')
  if (candidates.length !== 31) throw new Error(`Expected 31 candidate extensions, received ${candidates.length}.`)
  if (MANUAL_TRACKS.length !== 19) throw new Error(`Expected 19 manual extensions, received ${MANUAL_TRACKS.length}.`)

  const candidateTracks = candidates.map((row, index) => makeTrack(candidateToData(row), index))
  const manualTracks = MANUAL_TRACKS.map((track, index) => makeTrack(track, candidateTracks.length + index))
  const extensionTracks = [...candidateTracks, ...manualTracks]
  const allTracks = [...coreTracks, ...extensionTracks]
  const ids = allTracks.map((track) => track.track_id)
  if (allTracks.length !== 100 || new Set(ids).size !== 100) throw new Error('Expanded atlas must contain exactly 100 unique track IDs.')

  await writeFile(EXTENSION_PATH, `${JSON.stringify({
    generated_at: new Date().toISOString(),
    policy: 'Extension entries are real drift-event venues. Context-only route overlays are explicitly distinguished from source-threshold course reconstructions.',
    tracks: extensionTracks,
  }, null, 2)}\n`)
  await writeFile(PRODUCTION_PATH, `${JSON.stringify({
    ...production,
    version: '3.0.0',
    scope: '100 real drift-event venue aerials with optional editorial route-reference layers',
    tracks: allTracks,
  }, null, 2)}\n`)
  console.log(`Expanded production atlas to ${allTracks.length} tracks (${candidateTracks.length} existing candidates + ${manualTracks.length} new records).`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
