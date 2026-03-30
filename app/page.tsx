import Image from 'next/image'
import Link from 'next/link'
import { tracks } from '@/lib/tracks'
import { getTrackDisplayName } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-widest">赛道堂</h1>
          <Link
            href="/track"
            className="text-sm text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            查询订单
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">RC 赛道垫</h2>
          <p className="text-zinc-400 text-sm">定制打印 · 多种材质可选 · 点击赛道即可下单</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {tracks.map((track) => (
            <Link key={track.id} href={`/order?track=${track.id}`} className="group">
              <Card className="bg-zinc-900 ring-zinc-800 hover:ring-zinc-500 transition-all cursor-pointer overflow-hidden">
                <div className="aspect-[4/3] relative bg-zinc-800">
                  <Image
                    src={track.thumbnailUrl}
                    alt={getTrackDisplayName(track)}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                </div>
                <CardContent className="py-2 px-3">
                  <p className="text-sm font-semibold text-white leading-tight">
                    {getTrackDisplayName(track)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">点击下单</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
