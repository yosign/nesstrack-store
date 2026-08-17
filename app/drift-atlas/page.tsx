import type { Metadata } from 'next'
import atlasManifest from '@/docs/research/global-drift-track-atlas/production-manifest.json'
import originalMediaManifest from '@/docs/research/global-drift-track-atlas/original-media-manifest.json'
import DriftAtlasClient, { type AtlasTrack } from './DriftAtlasClient'

export const metadata: Metadata = {
  title: 'Global Drift Atlas — 100 Real Track Views | NessRC',
  description: '全球 100 条知名漂移赛事赛道的真实卫星与航拍俯视图档案，覆盖 42 个国家和地区。',
}

export default function DriftAtlasPage() {
  const mediaById = new Map(originalMediaManifest.tracks.map((media) => [media.track_id, media]))
  const mediaVersion = originalMediaManifest.generated_at.replace(/\D/g, '').slice(0, 14)
  const tracks: AtlasTrack[] = atlasManifest.tracks.map((track) => {
    const media = mediaById.get(track.track_id)
    return {
      id: track.track_id,
      year: track.event_year,
      venue: track.venue_name,
      city: track.city,
      country: track.country_or_region,
      countryCode: track.iso_country_code,
      region: track.atlas_region,
      originalImage: media?.local_path ? `${media.local_path}?v=${mediaVersion}` : null,
      mediaAttribution: media?.attribution ?? '',
    }
  })

  return <DriftAtlasClient tracks={tracks} />
}
