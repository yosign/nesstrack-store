import { fetchRemoteTracks, clearTracksCache } from '@/lib/fetch-tracks'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    if (searchParams.get('refresh') === 'true') {
      clearTracksCache()
    }
    const tracks = await fetchRemoteTracks()
    // 剥掉 originalUrl，避免原始文件路径泄露给前端
    const publicTracks = tracks.map(({ originalUrl: _, ...t }) => t)
    return Response.json({ success: true, data: publicTracks })
  } catch (err) {
    console.error('Failed to fetch remote tracks:', err)
    return Response.json({ success: false, error: 'Failed to fetch tracks' }, { status: 500 })
  }
}
