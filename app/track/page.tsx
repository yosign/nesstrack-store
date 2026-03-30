'use client'

import { use, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { tracks } from '@/lib/tracks'
import {
  MATERIALS,
  MaterialType,
  getTrackDisplayName,
  ORDER_STATUS_LABELS,
} from '@/lib/types'

type OrderStatus = 'pending' | 'in_production' | 'shipped'

interface Order {
  id: string
  order_number: string
  address: string
  track_id: string
  track_ids: string[] | null
  material: MaterialType
  status: OrderStatus
  production_status: string
  dealer_token: string
  tracking_number?: string | null
  created_at?: string
  pending_at?: string
  notes?: string | null
}

const STEPS: OrderStatus[] = ['pending', 'in_production', 'shipped']

export default function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = use(searchParams)
  const tokenParam = params.token as string | undefined

  const [searchQuery, setSearchQuery] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tokenParam) return

    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('orders')
      .select('*')
      .eq('dealer_token', tokenParam)
      .single()
      .then(({ data, error: dbError }) => {
        if (cancelled) return
        if (dbError || !data) {
          setError('未找到该订单')
        } else {
          setOrder(data as Order)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tokenParam])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setError(null)
    setOrder(null)
    setOrders([])

    try {
      const { data, error: dbError } = await supabase
        .from('orders')
        .select('*')
        .ilike('address', `%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(10)

      if (dbError) throw dbError

      if (!data || data.length === 0) {
        setError('未找到相关订单')
      } else {
        setOrders(data as Order[])
      }
    } catch {
      setError('查询失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="text-zinc-400 hover:text-white text-sm">
            ← 首页
          </Link>
          <h1 className="text-base font-bold">查询订单</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入手机号或地址关键词查询"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
            />
            <button
              type="submit"
              className="bg-white text-zinc-950 font-medium px-4 py-3 rounded-xl hover:bg-zinc-100 transition-colors text-sm whitespace-nowrap"
            >
              搜索
            </button>
          </div>
        </form>

        {loading && (
          <div className="text-center py-16 text-zinc-500">查询中...</div>
        )}

        {!loading && error && (
          <div className="text-center py-16 text-zinc-500">{error}</div>
        )}

        {!loading && order && <OrderCard order={order} />}

        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        )}

        {!loading && !error && !order && orders.length === 0 && !tokenParam && (
          <div className="text-center py-16 text-zinc-600 text-sm">
            输入手机号或地址关键词查询您的订单
          </div>
        )}
      </div>
    </div>
  )
}

function OrderCard({ order }: { order: Order }) {
  const trackList = (
    order.track_ids
      ? order.track_ids.map((id) => tracks.find((t) => t.id === id)).filter(Boolean)
      : [tracks.find((t) => t.id === order.track_id)].filter(Boolean)
  ) as (typeof tracks)[number][]

  const currentStep = STEPS.indexOf(order.status)
  const material = MATERIALS[order.material]

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 space-y-4">
      {/* Order number and address */}
      <div>
        <p className="font-mono text-sm font-semibold text-white">{order.order_number}</p>
        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{order.address}</p>
      </div>

      {/* Progress timeline */}
      <div className="flex items-start">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-start flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= currentStep
                    ? 'bg-white text-zinc-950'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-500'
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs mt-1 text-center leading-tight ${
                  i <= currentStep ? 'text-white' : 'text-zinc-600'
                }`}
              >
                {ORDER_STATUS_LABELS[step]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-none w-10 mt-4 mx-1 ${
                  i < currentStep ? 'bg-white' : 'bg-zinc-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Track thumbnails */}
      {trackList.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {trackList.map((t) => (
            <div key={t.id} className="flex-none w-24">
              <div className="aspect-[4/3] relative bg-zinc-800 rounded-lg overflow-hidden">
                <Image
                  src={t.thumbnailUrl}
                  alt={getTrackDisplayName(t)}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <p className="text-xs text-zinc-400 mt-1 text-center">{getTrackDisplayName(t)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-zinc-500 text-xs mb-0.5">材质</p>
          <p className="text-white">{material?.label ?? order.material}</p>
        </div>
        {order.tracking_number && (
          <div>
            <p className="text-zinc-500 text-xs mb-0.5">快递单号</p>
            <p className="text-white font-mono text-xs">{order.tracking_number}</p>
          </div>
        )}
      </div>
    </div>
  )
}
