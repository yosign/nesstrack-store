import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(SCRIPT_DIR, '../..')
const RESEARCH_DIR = path.join(ROOT, 'docs/research/global-drift-track-atlas')
const PNG_DIR = path.join(ROOT, 'public/images/global-drift-track-atlas/png')
const OUTPUT_DIR = path.join(ROOT, 'public/images/global-drift-track-atlas')
const WIDTH = 2000
const HEIGHT = 3000
const COLS = 5
const ROWS = 10
const CELL_WIDTH = WIDTH / COLS
const CELL_HEIGHT = HEIGHT / ROWS

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

function truncate(value, length = 34) {
  return value.length <= length ? value : `${value.slice(0, length - 1)}…`
}

async function main() {
  const manifest = JSON.parse(await readFile(path.join(RESEARCH_DIR, 'production-manifest.json'), 'utf8'))
  const tracks = manifest.tracks.filter((track) => track.status === 'complete')
  if (tracks.length !== COLS * ROWS) throw new Error(`Contact sheet requires exactly ${COLS * ROWS} complete tracks.`)

  const cards = []
  for (const [index, track] of tracks.entries()) {
    const column = index % COLS
    const row = Math.floor(index / COLS)
    const x = column * CELL_WIDTH
    const y = row * CELL_HEIGHT
    const png = await readFile(path.join(PNG_DIR, `${track.track_id}.png`))
    const image = `data:image/png;base64,${png.toString('base64')}`
    cards.push(`<g transform="translate(${x} ${y})">
      <rect x="10" y="10" width="380" height="280" rx="10" fill="#F1F4F5"/>
      <image href="${image}" x="24" y="20" width="352" height="218" preserveAspectRatio="xMidYMid meet"/>
      <text x="24" y="258" fill="#111827" font-family="Arial, sans-serif" font-size="18" font-weight="700">${escapeXml(String(index + 1).padStart(2, '0'))} · ${escapeXml(truncate(track.display_name))}</text>
      <text x="24" y="279" fill="#52606D" font-family="Arial, sans-serif" font-size="13">${escapeXml(track.country_or_region)} · ${escapeXml(track.event_year)} · ${escapeXml(track.series)}</text>
    </g>`)
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#071012"/>
  ${cards.join('\n  ')}
</svg>`
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng()
  await mkdir(OUTPUT_DIR, { recursive: true })
  await writeFile(path.join(OUTPUT_DIR, 'contact-sheet.svg'), svg)
  await writeFile(path.join(OUTPUT_DIR, 'contact-sheet.png'), png)
  console.log('Generated 5×10 atlas contact sheet.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
