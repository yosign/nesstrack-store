import { fetchRemoteTracks, clearTracksCache } from '@/lib/fetch-tracks'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    if (searchParams.get('refresh') === 'true') {
      clearTracksCache()
    }
    const tracks = await fetchRemoteTracks()
    return Response.json({ success: true, data: tracks })
  } catch (err) {
    console.error('Failed to fetch remote tracks:', err)
    return Response.json({ success: false, error: 'Failed to fetch tracks' }, { status: 500 })
  }
}
