import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(SCRIPT_DIR, '../..')
const ATLAS_DIR = path.join(ROOT, 'docs/research/global-drift-track-atlas')
const OUTPUT = path.join(ATLAS_DIR, 'original-media-manifest.json')
const SOURCE = path.join(ATLAS_DIR, 'production-manifest.json')
const USER_AGENT = 'NessRC-Drift-Atlas/1.0 (https://www.nessrc.net/drift-atlas)'
const QUERY_OVERRIDES = {
  'jp-maibara-okuibuki-motor-park-d1gp-2024': '奥伊吹モーターパーク, 米原市, 滋賀県',
  'jp-shimotsuma-tsukuba-circuit-d1gp-2024': '筑波サーキット, 下妻市, 茨城県',
  'jp-nihonmatsu-ebisu-circuit-west-course-d1gp-2024': 'エビスサーキット, 二本松市, 福島県',
  'jp-tokyo-odaiba-special-venue-d1gp-2024': 'お台場, 東京都',
  'jp-suzuka-suzuka-twin-circuit-formula-drift-japan-2024': '鈴鹿ツインサーキット, 三重県',
  'jp-nihonmatsu-ebisu-circuit-west-course-formula-drift-japan-2024': 'エビスサーキット, 二本松市, 福島県',
  'us-long-beach-grand-prix-of-long-beach-street-super-drift-challenge-2024': 'Long Beach Convention Center, Long Beach, California',
  'us-braselton-michelin-raceway-road-atlanta-formula-drift-2026': 'Road Atlanta, Braselton, Georgia',
  'us-stafford-springs-stafford-motor-speedway-formula-drift-2026': 'Stafford Motor Speedway, Connecticut',
  'mx-queretaro-autodromo-de-queretaro-mexican-drift-championship-2024': 'Autódromo de Querétaro, Querétaro, Mexico',
  'es-madrid-circuito-de-madrid-jarama-race-drift-masters-2026': 'Circuito del Jarama, Madrid, Spain',
  'lv-riga-bikernieki-circuit-drift-masters-2026': 'Biķernieku trase, Riga, Latvia',
  'gb-liverpool-liverpool-waterfront-temporary-c-red-bull-drift-shifters-2018': 'Royal Albert Dock, Liverpool, United Kingdom',
  'de-nurburg-nurburgring-mullenbachschleife-nurburgring-drift-cup-2026': 'Müllenbachschleife, Nürburgring, Germany',
  'ar-buenos-aires-autodromo-juan-y-oscar-galvez-drift-sudamerica-2017': 'Autódromo Oscar y Juan Gálvez, Buenos Aires, Argentina',
  'cr-alajuela-parque-viva-circuito-starcars-campeonato-nacional-de-drift-cos-2018': 'Parque Viva, Alajuela, Costa Rica',
  'om-muscat-muscat-drift-arena-oman-international-drift-champio-2024': 'Oman Automobile Association, Muscat, Oman',
  'sa-jeddah-jeddah-corniche-event-site-red-bull-car-park-drift-2022': 'Jeddah Corniche Circuit, Jeddah, Saudi Arabia',
  'za-port-shepstone-dezzi-raceway-supadrift-2016': 'Dezzi South Coast Raceway, Port Shepstone, South Africa',
}
const COORDINATE_OVERRIDES = {
  'jp-maibara-okuibuki-motor-park-d1gp-2024': [35.521111, 136.383056, 'Okuibuki Motor Park — Parking Area 4 precinct'],
  'jp-suzuka-suzuka-twin-circuit-formula-drift-japan-2024': [34.801667, 136.493056, 'Suzuka Twin Circuit'],
  'us-braselton-michelin-raceway-road-atlanta-formula-drift-2026': [34.146667, -83.817778, 'Michelin Raceway Road Atlanta'],
  'us-stafford-springs-stafford-motor-speedway-formula-drift-2026': [41.95709, -72.32137, 'Stafford Motor Speedway'],
  'mx-queretaro-autodromo-de-queretaro-mexican-drift-championship-2024': [20.585614, -100.328905, 'Autódromo de Querétaro'],
  'de-nurburg-nurburgring-mullenbachschleife-nurburgring-drift-cup-2026': [50.326639, 6.935083, 'Nürburgring Müllenbachschleife'],
  'za-port-shepstone-dezzi-raceway-supadrift-2016': [-30.7704, 30.4256, 'Dezzi Raceway'],
  'it-prato-prato-event-car-park-campionato-italiano-drifting-2026': [43.8586707, 11.1235004, 'Ex parcheggio TIR, Viale Guglielmo Marconi, Prato'],
  'my-kuala-lumpur-speed-city-kl-formula-drift-asia-2012': [3.0294634, 101.7176331, 'Speed City at The Mines / MIECC precinct'],
  'th-bangkok-bangkok-temporary-drift-venue-formula-drift-asia-2012': [13.82118, 100.67732, 'Wonder World Special Venue, Ramintra, Bangkok'],
  'cn-beijing-beijing-d1-special-venue-d1-grand-prix-china-2016': [40.09716, 116.64214, '北京亚袖汽车运动基地, Shunyi, Beijing'],
  'jp-maibara-okuibuki-motor-park-formula-drift-japan-2024': [35.521111, 136.383056, 'Okuibuki Motor Park — Parking Area 4 precinct'],
  'eg-cairo-cairo-festival-city-event-site-red-bull-car-park-drift-2021': [30.0281356, 31.4076706, 'Cairo Festival City event precinct'],
  'se-fallfors-drivecenter-arena-drift-masters-2023': [65.1140278, 20.75725, 'Drivecenter Arena'],
  'br-piracicaba-ecpa-ultimate-drift-2023': [-22.73907, -47.53248, 'Esporte Clube Piracicabano de Automobilismo'],
  'ca-mirabel-icar-route-66-dmcc-2024': [45.6802937, -74.0233092, 'Circuit ICAR'],
  'th-bangkok-d1-thailand-temporary-venue-d1-grand-prix-thailand-2012': [13.82118, 100.67732, 'Wonder World Special Venue, Ramintra, Bangkok'],
  'gb-lochgelly-driftland-drift-league-gb-2024': [56.1274, -3.2795, 'Driftland, Lochgelly Motorsports Complex'],
  'ph-manila-quirino-grandstand-event-site-formula-drift-asia-2011': [14.5795523, 120.9744064, 'Quirino Grandstand event precinct'],
  'jp-kasai-central-circuit-d1-lights-2021': [35.0258032, 134.9222408, 'Central Circuit'],
  'ca-montreal-circuit-icar-formula-drift-canada-2015': [45.6802937, -74.0233092, 'Circuit ICAR'],
  'mx-monterrey-autodromo-monterrey-mexican-drift-championship-2023': [25.8529333, -100.2179499, 'Autódromo Monterrey'],
  'gb-lydden-hill-lydden-hill-race-circuit-king-of-europe-drift-2016': [51.1782173, 1.1988257, 'Lydden Hill Race Circuit'],
  'au-mallala-mallala-motorsport-park-drift-allstars-australia-2023': [-34.41439, 138.50535, 'Mallala Motorsport Park'],
  'eg-cairo-cairo-festival-city-event-site-red-bull-car-park-drift-2024': [30.0281356, 31.4076706, 'Cairo Festival City event precinct'],
  'mz-maputo-automovel-e-touring-clube-de-moc-campeonato-nacional-de-drift-2023': [-25.93974, 32.62226, 'Automóvel & Touring Clube de Moçambique'],
  'jp-yamazoe-meihan-sportsland-d1gp-2005': [34.6344184, 135.9956669, 'Meihan Sportsland'],
  'jp-niimi-bihoku-highland-circuit-d1gp-2002': [34.9761161, 133.6127482, 'Bihoku Highland Circuit'],
  'jp-obihiro-tokachi-speedway-d1gp-2018': [42.63006, 143.2903561, 'Tokachi Speedway'],
  'jp-omuta-sekia-hills-d1gp-2002': [33.0597742, 130.5116882, 'Sekia Hills DEC Circuit precinct'],
  'us-englishtown-old-bridge-township-raceway-park-formula-drift-2025': [40.33633, -74.35057, 'Old Bridge Township Raceway Park'],
  'us-miami-gardens-dolphin-stadium-d1-grand-prix-2006': [25.9579032, -80.2388497, 'Hard Rock Stadium'],
  'us-chicago-soldier-field-formula-drift-2005': [41.8623356, -87.6176477, 'Soldier Field South Lot'],
  'ee-laitse-laitse-rallypark-estonian-drift-2019': [59.174168, 24.366112, 'Laitse RallyPark'],
  'au-benalla-winton-motor-raceway-hi-tec-drift-allstars-2024': [-36.5184805, 146.08718, 'Winton Motor Raceway'],
  'qa-doha-qatar-racing-club-red-bull-car-park-drift-2018': [25.176657, 51.481572, 'Qatar Racing Club'],
  'bh-sakhir-bahrain-international-circuit-drift-2024': [26.0311459, 50.5143663, 'Bahrain International Circuit'],
}
const EVENT_MEDIA_FALLBACKS = {
  'it-prato-prato-event-car-park-campionato-italiano-drifting-2026': {
    url: 'https://i.ytimg.com/vi/typk96v-TKQ/hqdefault.jpg',
    label: '赛事来源画面',
  },
  'my-kuala-lumpur-speed-city-kl-formula-drift-asia-2012': {
    url: 'https://i.ytimg.com/vi/Kfi4f_bOAqU/hqdefault.jpg',
    label: '赛事来源画面',
  },
  'th-bangkok-bangkok-temporary-drift-venue-formula-drift-asia-2012': {
    url: 'https://i.ytimg.com/vi/5hY23ZyKQIc/hqdefault.jpg',
    label: '赛事来源画面',
  },
  'cn-beijing-beijing-d1-special-venue-d1-grand-prix-china-2016': {
    url: 'https://i.ytimg.com/vi/wLvxZJlic4w/hqdefault.jpg',
    label: '赛事来源画面',
  },
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

function queryFor(track) {
  if (QUERY_OVERRIDES[track.track_id]) return QUERY_OVERRIDES[track.track_id]
  const venueSource = track.sources.find((source) => source.scope === 'venue')
  try {
    const url = new URL(venueSource?.url ?? '')
    const query = url.searchParams.get('query')
    if (query) return query
  } catch {}
  return `${track.venue_name}, ${track.city}, ${track.country_or_region}`
}

function aerialUrl(latitude, longitude, venueType) {
  const lat = Number(latitude)
  const lon = Number(longitude)
  const span = ['parking', 'street', 'stadium'].includes(venueType) ? 0.0032 : 0.005
  const lonSpan = span / Math.max(Math.cos(lat * Math.PI / 180), 0.35)
  const bbox = [lon - lonSpan, lat - span, lon + lonSpan, lat + span].map((value) => value.toFixed(7)).join(',')
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=1200,900&format=jpg&f=image`
}

async function geocode(track) {
  const coordinateOverride = COORDINATE_OVERRIDES[track.track_id]
  if (coordinateOverride) return {
    query: queryFor(track),
    latitude: coordinateOverride[0],
    longitude: coordinateOverride[1],
    display_name: coordinateOverride[2],
    result_type: 'manual-primary-source-coordinate',
    precision: 'venue',
  }
  const query = queryFor(track)
  const endpoint = new URL('https://nominatim.openstreetmap.org/search')
  endpoint.searchParams.set('q', query)
  endpoint.searchParams.set('format', 'jsonv2')
  endpoint.searchParams.set('limit', '1')
  endpoint.searchParams.set('addressdetails', '1')
  const response = await fetch(endpoint, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Nominatim ${response.status} for ${query}`)
  const [result] = await response.json()
  return result ? {
    query,
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    display_name: result.display_name,
    osm_type: result.osm_type,
    osm_id: result.osm_id,
    result_type: result.type,
    precision: result.type === 'city' || result.type === 'administrative' ? 'city' : 'venue',
  } : { query, precision: 'unresolved' }
}

async function main() {
  const atlas = JSON.parse(await readFile(SOURCE, 'utf8'))
  let previous = { tracks: [] }
  try { previous = JSON.parse(await readFile(OUTPUT, 'utf8')) } catch {}
  const previousById = new Map(previous.tracks.map((track) => [track.track_id, track]))
  const tracks = []
  await mkdir(ATLAS_DIR, { recursive: true })

  for (const [index, track] of atlas.tracks.entries()) {
    const cached = previousById.get(track.track_id)
    let location = COORDINATE_OVERRIDES[track.track_id]
      ? await geocode(track)
      : cached?.location
    if (!location || location.precision === 'unresolved') {
      location = await geocode(track)
      if (index < atlas.tracks.length - 1) await delay(1100)
    }
    const courseSource = track.sources.find((source) => source.scope === 'course')
    const eventFallback = EVENT_MEDIA_FALLBACKS[track.track_id]
    const isVenueAerial = location.precision === 'venue'
    const originalUrl = isVenueAerial
      ? aerialUrl(location.latitude, location.longitude, track.venue_type)
      : eventFallback?.url ?? null
    tracks.push({
      track_id: track.track_id,
      venue_name: track.venue_name,
      source_url: courseSource?.url ?? null,
      source_publisher: courseSource?.publisher ?? null,
      source_tier: courseSource?.tier ?? null,
      location,
      media_type: isVenueAerial ? 'venue-aerial' : 'source-event-frame',
      media_label: isVenueAerial ? '真实场地俯视图' : (eventFallback?.label ?? '原始画面待补'),
      original_url: originalUrl,
      local_path: originalUrl ? `/images/global-drift-track-atlas/original/${track.track_id}.jpg` : null,
      aerial_url: isVenueAerial ? originalUrl : null,
      attribution: isVenueAerial
        ? 'Esri, Maxar, Earthstar Geographics, and the GIS User Community'
        : courseSource?.publisher ?? null,
      aerial_attribution: 'Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      media_status: originalUrl ? 'original-media-ready' : 'needs-event-frame',
    })
    console.log(`${String(index + 1).padStart(3, '0')}/${atlas.tracks.length} ${track.track_id}: ${location.precision}`)
  }

  await writeFile(OUTPUT, `${JSON.stringify({
    generated_at: new Date().toISOString(),
    policy: 'Default gallery media must be a real venue aerial/satellite image or an official event aerial/map frame. Abstract redraws are secondary overlays only.',
    tracks,
  }, null, 2)}\n`)
  console.log(`Wrote ${tracks.length} original-media records.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
