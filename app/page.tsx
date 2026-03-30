'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getTrackDisplayName } from '@/lib/types'
import type { Track } from '@/lib/types'

const ORANGE = '#FF4500'

function TrackGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden animate-pulse"
          style={{ background: '#1a1a1a' }}
        >
          <div className="aspect-video" style={{ background: '#252525' }} />
          <div className="p-4">
            <div className="h-5 rounded w-3/4 mb-2" style={{ background: '#2a2a2a' }} />
            <div className="h-3 rounded w-1/3" style={{ background: '#252525' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

const MATERIALS = [
  {
    id: 'pvc',
    name: 'PVC',
    tagline: '轻薄 · 耐磨 · 易卷收',
    desc: '弹性塑料材质，表面光滑，轻量便携，适合室内轻量练习赛。',
  },
  {
    id: 'cloth',
    name: '比赛布',
    tagline: '色彩 · 纹理 · 专业级',
    desc: '细密编织油画布，色彩还原度极高，专业赛场标准选材。',
  },
  {
    id: 'brick_a',
    name: 'A 砖',
    tagline: '厚实 · 防滑 · 真实感',
    desc: '5mm 厚 PVC 发泡，重量感扎实，还原颗粒赛道真实手感。',
  },
]

// ─── Hover card helper ────────────────────────────────────────────────────────
function TrackCard({ track }: { track: Track }) {
  const ref = useRef<HTMLAnchorElement>(null)

  return (
    <Link
      ref={ref}
      href={`/order?track=${track.id}`}
      className="group block rounded-xl overflow-hidden"
      style={{
        background: '#1a1a1a',
        transition: 'box-shadow 0.3s, outline 0.3s',
        outline: '1.5px solid transparent',
      }}
      onMouseEnter={() => {
        if (ref.current) {
          ref.current.style.boxShadow = '0 0 20px rgba(255,69,0,0.4)'
          ref.current.style.outline = `1.5px solid ${ORANGE}`
        }
      }}
      onMouseLeave={() => {
        if (ref.current) {
          ref.current.style.boxShadow = 'none'
          ref.current.style.outline = '1.5px solid transparent'
        }
      }}
    >
      <div className="aspect-video relative overflow-hidden">
        <Image
          src={track.thumbnailUrl}
          alt={getTrackDisplayName(track)}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized
        />
      </div>
      <div className="px-4 py-3 flex items-end justify-between">
        <span
          style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: '1.45rem',
            letterSpacing: '0.04em',
            color: '#fff',
            lineHeight: 1,
          }}
        >
          {getTrackDisplayName(track)}
        </span>
        <span
          className="text-lg font-bold transition-all duration-300"
          style={{
            color: ORANGE,
            opacity: 0.5,
          }}
        >
          &#8594;
        </span>
      </div>
    </Link>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/tracks')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setTracks(data.data)
        } else {
          setError('赛道数据加载失败')
        }
      })
      .catch(() => setError('网络错误，请刷新重试'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>

      {/* ═══ Sticky Header ══════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '1.7rem',
              letterSpacing: '0.07em',
              lineHeight: 1,
            }}
          >
            赛道堂
            <span style={{ color: ORANGE }}>&nbsp;TRACK HALL</span>
          </div>

          <OrderButton />
        </div>
      </header>

      {/* ═══ Hero ══════════════════════════════════════════════════════════ */}
      <section className="relative flex items-center overflow-hidden" style={{ minHeight: '100svh' }}>
        <Image
          src="/images/hero.jpg"
          alt="RC racing track"
          fill
          className="object-cover"
          sizes="100vw"
          unoptimized
          priority
        />
        {/* Dark gradient – heavier on left */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.75) 55%, rgba(10,10,10,0.25) 100%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-24 flex items-center justify-between gap-12">
          {/* Left content */}
          <div className="max-w-lg">
            <p
              className="mb-5 text-xs font-semibold tracking-[0.28em] uppercase"
              style={{ color: ORANGE }}
            >
              RC Track Mats · Custom Printed
            </p>

            <h1
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(4rem, 10vw, 7.5rem)',
                lineHeight: 0.9,
                letterSpacing: '0.02em',
                color: '#fff',
              }}
            >
              定制你的
              <br />
              <span style={{ color: ORANGE }}>赛道</span>
            </h1>

            <p
              className="mt-7 text-base leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              专业级赛道垫，PVC / 比赛布 / A砖三种材质
              <br />
              多种尺寸选购，全彩定制打印，直发到家
            </p>

            <div className="mt-9 flex items-center gap-4 flex-wrap">
              <HeroCtaPrimary />
              <HeroCtaSecondary />
            </div>
          </div>

          {/* Right — drift card */}
          <div
            className="hidden lg:block relative rounded-2xl overflow-hidden flex-shrink-0"
            style={{
              width: 300,
              height: 210,
              boxShadow: `0 0 0 2px rgba(255,69,0,0.55), 0 0 50px rgba(255,69,0,0.3)`,
            }}
          >
            <Image
              src="/images/drift.jpg"
              alt="RC drift shot"
              fill
              className="object-cover"
              sizes="300px"
              unoptimized
            />
          </div>
        </div>
      </section>

      {/* ═══ Materials ═════════════════════════════════════════════════════ */}
      <section id="materials" className="relative py-28 overflow-hidden">
        {/* Faint texture background */}
        <Image
          src="/images/detail.jpg"
          alt=""
          fill
          className="object-cover pointer-events-none select-none"
          style={{ opacity: 0.05 }}
          sizes="100vw"
          unoptimized
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center">
            <p
              className="text-xs font-semibold tracking-[0.22em] uppercase mb-4"
              style={{ color: ORANGE }}
            >
              Materials
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                letterSpacing: '0.04em',
                color: '#fff',
              }}
            >
              三种材质，各有专属
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {MATERIALS.map((mat) => (
              <MaterialCard key={mat.id} mat={mat} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Track Grid ════════════════════════════════════════════════════ */}
      <section id="tracks" className="py-24" style={{ background: '#0a0a0a' }}>
        <div className="max-w-7xl mx-auto px-6">
          {/* Section header */}
          <div className="flex items-end gap-4 mb-10">
            <div>
              <p
                className="text-xs font-semibold tracking-[0.22em] uppercase mb-2"
                style={{ color: ORANGE }}
              >
                Shop
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-bebas)',
                  fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)',
                  letterSpacing: '0.04em',
                  color: '#fff',
                  lineHeight: 1,
                }}
              >
                选择你的赛道
              </h2>
            </div>
            {!loading && tracks.length > 0 && (
              <span
                className="mb-0.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  background: 'rgba(255,69,0,0.12)',
                  color: ORANGE,
                  border: '1px solid rgba(255,69,0,0.3)',
                }}
              >
                {tracks.length} 款
              </span>
            )}
          </div>

          {loading && <TrackGridSkeleton />}

          {error && (
            <div
              className="text-center py-24"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              <p className="text-lg mb-3">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm underline transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                点击刷新
              </button>
            </div>
          )}

          {!loading && !error && tracks.length === 0 && (
            <div
              className="text-center py-24"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              暂无可购买的赛道
            </div>
          )}

          {!loading && tracks.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tracks.map((track) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ Footer ════════════════════════════════════════════════════════ */}
      <footer
        className="py-8"
        style={{
          background: '#0a0a0a',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: '1.3rem',
                letterSpacing: '0.08em',
                lineHeight: 1,
              }}
            >
              赛道堂
              <span style={{ color: ORANGE }}>&nbsp;TRACK HALL</span>
            </div>
            <p
              className="text-xs mt-1.5"
              style={{ color: 'rgba(255,255,255,0.28)' }}
            >
              专业RC赛车道具
            </p>
          </div>
          <FooterOrderLink />
        </div>
      </footer>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OrderButton() {
  const ref = useRef<HTMLAnchorElement>(null)
  return (
    <Link
      ref={ref}
      href="/track"
      className="text-sm px-5 py-2 rounded-lg font-medium"
      style={{
        border: `1.5px solid ${ORANGE}`,
        color: ORANGE,
        transition: 'background 0.25s, color 0.25s',
      }}
      onMouseEnter={() => {
        if (ref.current) {
          ref.current.style.background = ORANGE
          ref.current.style.color = '#000'
        }
      }}
      onMouseLeave={() => {
        if (ref.current) {
          ref.current.style.background = 'transparent'
          ref.current.style.color = ORANGE
        }
      }}
    >
      查询订单
    </Link>
  )
}

function HeroCtaPrimary() {
  const ref = useRef<HTMLAnchorElement>(null)
  return (
    <Link
      ref={ref}
      href="#tracks"
      className="px-8 py-3 rounded-lg text-sm font-bold"
      style={{
        background: ORANGE,
        color: '#000',
        transition: 'box-shadow 0.25s, transform 0.25s',
      }}
      onMouseEnter={() => {
        if (ref.current) {
          ref.current.style.boxShadow = '0 0 30px rgba(255,69,0,0.55)'
          ref.current.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={() => {
        if (ref.current) {
          ref.current.style.boxShadow = 'none'
          ref.current.style.transform = 'none'
        }
      }}
    >
      立即选购
    </Link>
  )
}

function HeroCtaSecondary() {
  const ref = useRef<HTMLAnchorElement>(null)
  return (
    <Link
      ref={ref}
      href="#materials"
      className="px-8 py-3 rounded-lg text-sm font-semibold"
      style={{
        border: '1.5px solid rgba(255,255,255,0.28)',
        color: 'rgba(255,255,255,0.85)',
        transition: 'border-color 0.25s, color 0.25s',
      }}
      onMouseEnter={() => {
        if (ref.current) {
          ref.current.style.borderColor = 'rgba(255,255,255,0.7)'
          ref.current.style.color = '#fff'
        }
      }}
      onMouseLeave={() => {
        if (ref.current) {
          ref.current.style.borderColor = 'rgba(255,255,255,0.28)'
          ref.current.style.color = 'rgba(255,255,255,0.85)'
        }
      }}
    >
      了解材质
    </Link>
  )
}

function MaterialCard({ mat }: { mat: (typeof MATERIALS)[number] }) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      className="rounded-2xl p-8"
      style={{
        background: '#1a1a1a',
        transition: 'box-shadow 0.3s',
      }}
      onMouseEnter={() => {
        if (ref.current)
          ref.current.style.boxShadow = '0 0 20px rgba(255,69,0,0.4)'
      }}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.boxShadow = 'none'
      }}
    >
      <div
        className="h-0.5 w-10 rounded mb-7"
        style={{ background: ORANGE }}
      />
      <h3
        style={{
          fontFamily: 'var(--font-bebas)',
          fontSize: '2.4rem',
          letterSpacing: '0.06em',
          color: '#fff',
          lineHeight: 1,
        }}
      >
        {mat.name}
      </h3>
      <p
        className="mt-1 text-xs font-semibold tracking-widest uppercase"
        style={{ color: ORANGE }}
      >
        {mat.tagline}
      </p>
      <p
        className="mt-4 text-sm leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        {mat.desc}
      </p>
    </div>
  )
}

function FooterOrderLink() {
  const ref = useRef<HTMLAnchorElement>(null)
  return (
    <Link
      ref={ref}
      href="/track"
      className="text-sm"
      style={{
        color: 'rgba(255,255,255,0.35)',
        transition: 'color 0.25s',
      }}
      onMouseEnter={() => {
        if (ref.current) ref.current.style.color = ORANGE
      }}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.color = 'rgba(255,255,255,0.35)'
      }}
    >
      查询订单
    </Link>
  )
}
