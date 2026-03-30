'use client'

import { use, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { tracks } from '@/lib/tracks'
import { MATERIALS, MaterialType, getTrackDisplayName, ORDER_STATUS_LABELS } from '@/lib/types'

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

const STATUS_BADGE: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: {
    label: 'PENDING',
    color: 'rgba(255,255,255,0.5)',
    bg: 'rgba(255,255,255,0.07)',
  },
  in_production: {
    label: 'IN PRODUCTION',
    color: '#00B4D8',
    bg: 'rgba(0,180,216,0.12)',
  },
  shipped: {
    label: 'SHIPPED',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.1)',
  },
}

function TrackThumb({ src, alt }: { src: string; alt: string }) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [portrait, setPortrait] = useState(false)

  const handleLoad = () => {
    const img = imgRef.current
    if (!img) return
    setPortrait(img.naturalHeight > img.naturalWidth)
  }

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: '16/9',
        background: '#0d0d0d',
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={handleLoad}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: portrait ? 'rotate(-90deg) scale(1.78)' : 'none',
        }}
      />
    </div>
  )
}

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
          setError('Order not found.')
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
        setError('No orders found.')
      } else {
        setOrders(data as Order[])
      }
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff' }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(8,8,8,0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
          <Link href="/">
            <img src="/images/Logo.png" alt="NessRC" style={{ height: 32, width: 'auto' }} />
          </Link>
          <span
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '1.1rem',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            / TRACK ORDER
          </span>
          <div style={{ flex: 1 }} />
          <Link
            href="/"
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'var(--font-dm-sans)',
              textDecoration: 'none',
            }}
          >
            ← BACK
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Search form */}
        <form onSubmit={handleSearch} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Phone number or address keyword"
              style={{
                flex: 1,
                background: '#111',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '12px 16px',
                fontSize: '0.875rem',
                outline: 'none',
                fontFamily: 'var(--font-dm-sans)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#00B4D8')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <button
              type="submit"
              style={{
                background: '#00B4D8',
                color: '#000',
                padding: '12px 20px',
                fontFamily: 'var(--font-bebas)',
                fontSize: '1rem',
                letterSpacing: '0.12em',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              SEARCH →
            </button>
          </div>
        </form>

        {loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 0',
              color: 'rgba(255,255,255,0.3)',
              fontFamily: 'var(--font-bebas)',
              letterSpacing: '0.15em',
              fontSize: '0.9rem',
            }}
          >
            SEARCHING...
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 0',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {!loading && order && <OrderCard order={order} />}

        {!loading && orders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        )}

        {!loading && !error && !order && orders.length === 0 && !tokenParam && (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 0',
              color: 'rgba(255,255,255,0.2)',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '0.875rem',
            }}
          >
            Enter a phone number or address keyword to find your order.
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
  const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending

  return (
    <div
      style={{
        background: '#111',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '1.5rem',
        marginBottom: 0,
      }}
    >
      {/* Header row: order number + badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '1rem',
            fontWeight: 600,
            color: '#fff',
            letterSpacing: '0.04em',
          }}
        >
          {order.order_number}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            color: badge.color,
            background: badge.bg,
            padding: '3px 10px',
          }}
        >
          {badge.label}
        </span>
      </div>

      {/* Progress timeline */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
        {STEPS.map((step, i) => {
          const done = i <= currentStep
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                {/* Square step indicator */}
                <div
                  style={{
                    width: 20,
                    height: 20,
                    background: done ? '#00B4D8' : '#222',
                    border: done ? 'none' : '1px solid rgba(255,255,255,0.15)',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-bebas)',
                    fontSize: '0.62rem',
                    letterSpacing: '0.1em',
                    color: done ? '#00B4D8' : 'rgba(255,255,255,0.25)',
                    marginTop: 6,
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {ORDER_STATUS_LABELS[step]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    height: 1,
                    flex: 1,
                    marginTop: 10,
                    background: i < currentStep ? '#00B4D8' : 'rgba(255,255,255,0.08)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Track thumbnails */}
      {trackList.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            paddingBottom: 4,
            marginBottom: 20,
          }}
        >
          {trackList.map((t) => (
            <div key={t.id} style={{ flexShrink: 0, width: 100 }}>
              <TrackThumb src={t.thumbnailUrl} alt={getTrackDisplayName(t)} />
              <p
                style={{
                  fontFamily: 'var(--font-bebas)',
                  fontSize: '0.85rem',
                  letterSpacing: '0.06em',
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {getTrackDisplayName(t)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-bebas)',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.3)',
              marginRight: 8,
              fontSize: '0.7rem',
            }}
          >
            MATERIAL:
          </span>
          {material?.label ?? order.material}
        </div>

        {order.tracking_number && (
          <div
            style={{
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-bebas)',
                letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.3)',
                marginRight: 8,
                fontSize: '0.7rem',
              }}
            >
              TRACKING:
            </span>
            <span style={{ fontFamily: 'monospace' }}>{order.tracking_number}</span>
          </div>
        )}

        <div
          style={{
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.35)',
            fontFamily: 'var(--font-dm-sans)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-bebas)',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.3)',
              marginRight: 8,
              fontSize: '0.7rem',
            }}
          >
            ADDRESS:
          </span>
          {order.address}
        </div>
      </div>
    </div>
  )
}
