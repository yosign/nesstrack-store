'use client'

import { use, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { tracks } from '@/lib/tracks'
import { MATERIALS, MaterialType, getTrackDisplayName } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export default function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = use(searchParams)
  const trackParam = params.track
  const trackIds = Array.isArray(trackParam)
    ? trackParam
    : trackParam
    ? [trackParam]
    : []
  const selectedTracks = trackIds
    .map((id) => tracks.find((t) => t.id === id))
    .filter(Boolean) as (typeof tracks)[number][]

  const router = useRouter()
  const [material, setMaterial] = useState<MaterialType>('pvc')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (selectedTracks.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-zinc-400">请先选择赛道</p>
          <Link
            href="/"
            className="inline-block bg-white text-zinc-950 font-medium px-6 py-2.5 rounded-xl hover:bg-zinc-100 transition-colors text-sm"
          >
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) {
      setError('请填写收件信息')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      const rand = Math.floor(Math.random() * 9000) + 1000
      const orderNumber = `NST${y}${m}${d}-${rand}`

      const dealerToken = crypto.randomUUID()
      const supplierToken = crypto.randomUUID()

      const { error: dbError } = await supabase.from('orders').insert({
        order_number: orderNumber,
        address,
        track_id: selectedTracks[0].id,
        track_ids: trackIds,
        material,
        status: 'pending',
        production_status: 'pending',
        dealer_token: dealerToken,
        supplier_token: supplierToken,
        pending_at: new Date().toISOString(),
        notes: notes || null,
      })

      if (dbError) throw dbError

      router.push(`/order/success?token=${dealerToken}`)
    } catch (err) {
      console.error(err)
      setError('提交失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="text-zinc-400 hover:text-white text-sm">
            ← 返回
          </Link>
          <h1 className="text-base font-bold">确认订单</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Selected tracks */}
        <section>
          <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">已选赛道</h2>
          <div className="grid grid-cols-2 gap-3">
            {selectedTracks.map((track) => (
              <div key={track.id} className="bg-zinc-900 rounded-xl overflow-hidden">
                <div className="aspect-[4/3] relative bg-zinc-800">
                  <Image
                    src={track.thumbnailUrl}
                    alt={getTrackDisplayName(track)}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                </div>
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold">{getTrackDisplayName(track)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Material selection */}
          <section>
            <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">选择材质</h2>
            <div className="grid grid-cols-3 gap-2">
              {(
                Object.entries(MATERIALS) as [
                  MaterialType,
                  { label: string; factoryLabel: string },
                ][]
              ).map(([key, mat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMaterial(key)}
                  className={`py-3 px-2 rounded-xl border text-sm font-medium transition-all ${
                    material === key
                      ? 'border-white bg-white text-zinc-950'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {mat.label}
                </button>
              ))}
            </div>
          </section>

          {/* Address */}
          <section>
            <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">收件信息</h2>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="姓名 手机号 详细地址（如：张三 13800138000 广东省深圳市南山区XXX路XXX号）"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 resize-none"
              rows={3}
              required
            />
          </section>

          {/* Notes */}
          <section>
            <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">备注（可选）</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="其他要求..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 resize-none"
              rows={2}
            />
          </section>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-zinc-950 font-semibold py-4 rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {isSubmitting ? '提交中...' : '确认下单'}
          </button>
        </form>
      </div>
    </div>
  )
}
