import { Track } from './types'

let cachedTracks: Track[] | null = null
let cacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function clearTracksCache() {
  cachedTracks = null
  cacheTime = 0
}

export async function fetchRemoteTracks(): Promise<Track[]> {
  const now = Date.now()
  if (cachedTracks && now - cacheTime < CACHE_DURATION) {
    return cachedTracks
  }

  const url = process.env.TRACKS_DATA_URL
  if (!url) throw new Error('TRACKS_DATA_URL is not configured')

  const headers: HeadersInit = {}
  if (process.env.TRACKS_API_SECRET) {
    headers['Authorization'] = `Bearer ${process.env.TRACKS_API_SECRET}`
  }

  const res = await fetch(url, { cache: 'no-store', headers })
  if (!res.ok) throw new Error(`Failed to fetch tracks: ${res.status}`)

  const tracks = await res.json() as Track[]

  cachedTracks = tracks
  cacheTime = now
  return tracks
}
