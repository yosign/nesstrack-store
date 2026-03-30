import { Track } from './types'

let cachedTracks: Track[] | null = null
let cacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function fetchRemoteTracks(): Promise<Track[]> {
  const now = Date.now()
  if (cachedTracks && now - cacheTime < CACHE_DURATION) {
    return cachedTracks
  }

  const res = await fetch('https://work.nesslabs.cn/tracks.ts', { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch tracks: ${res.status}`)
  const text = await res.text()

  // Find the start of the array via bracket matching
  const exportIdx = text.search(/export\s+const\s+tracks[^=]*=\s*\[/)
  if (exportIdx === -1) throw new Error('Could not find tracks export')

  const startIdx = text.indexOf('[', exportIdx)
  let depth = 0
  let endIdx = -1
  for (let i = startIdx; i < text.length; i++) {
    if (text[i] === '[') depth++
    else if (text[i] === ']') {
      depth--
      if (depth === 0) {
        endIdx = i
        break
      }
    }
  }
  if (endIdx === -1) throw new Error('Could not parse tracks array')

  // Re-parse with string-aware bracket matching
  let bracketCount = 0
  let realEndIdx = startIdx
  let inString = false
  let stringChar = ''
  let escaped = false

  for (let i = startIdx; i < text.length; i++) {
    const char = text[i]
    if (escaped) { escaped = false; continue }
    if (char === '\\') { escaped = true; continue }
    if (char === '"' || char === "'" || char === '`') {
      if (!inString) { inString = true; stringChar = char }
      else if (char === stringChar) { inString = false; stringChar = '' }
      continue
    }
    if (!inString) {
      if (char === '[') bracketCount++
      else if (char === ']') {
        bracketCount--
        if (bracketCount === 0) { realEndIdx = i; break }
      }
    }
  }

  const arrayStr = text.slice(startIdx, realEndIdx + 1)
  // eslint-disable-next-line no-new-func
  const tracks = new Function(`return ${arrayStr}`)() as Track[]

  cachedTracks = tracks
  cacheTime = now
  return tracks
}
