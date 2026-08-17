import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(SCRIPT_DIR, '../..')
const MANIFEST = path.join(ROOT, 'docs/research/global-drift-track-atlas/original-media-manifest.json')
const OUTPUT_DIR = path.join(ROOT, 'public/images/global-drift-track-atlas/original')

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'))
  await mkdir(OUTPUT_DIR, { recursive: true })

  let completed = 0
  for (const track of manifest.tracks) {
    if (!track.original_url || !track.local_path) continue
    const output = path.join(ROOT, 'public', track.local_path.replace(/^\//, '').replace(/^images\//, 'images/'))
    try {
      await access(output)
      completed += 1
      console.log(`${String(completed).padStart(2, '0')}/50 ${track.track_id} cached`)
      continue
    } catch {}
    let response
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        response = await fetch(track.original_url, {
          headers: { 'User-Agent': 'NessRC-Drift-Atlas/1.0 (https://www.nessrc.net/drift-atlas)' },
        })
        if (response.ok) break
      } catch (error) {
        if (attempt === 3) throw error
      }
    }
    if (!response?.ok) throw new Error(`${response?.status ?? 'network'} ${track.track_id}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    await writeFile(output, bytes)
    completed += 1
    console.log(`${String(completed).padStart(2, '0')}/50 ${track.track_id} ${Math.round(bytes.length / 1024)}KB`)
  }

  console.log(`Downloaded ${completed} original-media images.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
