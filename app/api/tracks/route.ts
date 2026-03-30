import { tracks } from '@/lib/tracks'

export async function GET() {
  return Response.json(tracks)
}
