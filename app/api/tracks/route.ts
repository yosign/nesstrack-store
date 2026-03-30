import { fetchRemoteTracks } from '@/lib/fetch-tracks'

export async function GET() {
  try {
    const tracks = await fetchRemoteTracks()
    return Response.json({ success: true, data: tracks })
  } catch (err) {
    console.error('Failed to fetch remote tracks:', err)
    return Response.json({ success: false, error: 'Failed to fetch tracks' }, { status: 500 })
  }
}
