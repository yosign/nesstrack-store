'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getTrackDisplayName } from '@/lib/types'
import type { Track } from '@/lib/types'
import { translations } from '@/lib/i18n'
import { useLocale } from '@/lib/use-locale'

const ACCENT = '#00B4D8'

// ─── Size filter logic ────────────────────────────────────────────────────────
type SizeFilter = 'all' | 'small' | 'medium' | 'large'
type MaterialFilter = 'all' | 'PVC' | 'CLOTH' | 'BRICK-A'

function getShortSide(trackName: string): number | null {
  const m = trackName.match(/^(\d+\.?\d*)[xX×](\d+\.?\d*)/)
  if (!m) return null
  const a = parseFloat(m[1])
  const b = parseFloat(m[2])
  return Math.min(a, b)
}

function getFirstDim(trackName: string): number {
  const m = trackName.match(/(\d+\.?\d*)/)
  if (!m) return 0
  return parseFloat(m[1])
}

function matchesSizeFilter(track: Track, filter: SizeFilter): boolean {
  if (filter === 'all') return true
  const s = getShortSide(track.name)
  if (s === null) return true
  if (filter === 'small') return s < 1.0
  if (filter === 'medium') return s >= 1.0 && s <= 1.5
  if (filter === 'large') return s > 1.5
  return true
}

function groupByWidth(tracks: Track[]): { width: number; items: Track[] }[] {
  const map = new Map<number, Track[]>()
  for (const track of tracks) {
    const w = getFirstDim(track.name)
    if (!map.has(w)) map.set(w, [])
    map.get(w)!.push(track)
  }
  const WIDTH_ORDER: number[] = [1.5, 1.6, 2.0]
  return [...map.entries()]
    .sort((a, b) => {
      const ai = WIDTH_ORDER.indexOf(a[0])
      const bi = WIDTH_ORDER.indexOf(b[0])
      // 都在优先列表里，按列表顺序
      if (ai !== -1 && bi !== -1) return ai - bi
      // 只有一个在列表里，列表内的排前面
      if (ai !== -1) return -1
      if (bi !== -1) return 1
      // 都不在列表里，按宽度升序
      return a[0] - b[0]
    })
    .map(([width, items]) => ({ width, items }))
}

// ─── Noise overlay ────────────────────────────────────────────────────────────
function NoiseSvg() {
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.035,
        zIndex: 1,
      }}
    >
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  )
}

// ─── Grid pattern background ──────────────────────────────────────────────────
function GridBg({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity,
        zIndex: 0,
      }}
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  )
}

// ─── Track spec sizes ─────────────────────────────────────────────────────────
const TRACK_SPECS = [
  { w: 0.6, h: 1.2 },
  { w: 1.0, h: 1.5 },
  { w: 1.5, h: 2.2 },
  { w: 2.0, h: 3.0 },
]

// ─── Hero track diagram card ───────────────────────────────────────────────────
function HeroDataPanel({ specLabels, title }: { specLabels: string[]; title: string }) {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % TRACK_SPECS.length)
        setVisible(true)
      }, 400)
    }, 2800)
    return () => clearInterval(timer)
  }, [])

  const spec = TRACK_SPECS[idx]
  // SVG canvas: 560 x 400, pad 48px each side
  const PAD = 52
  const CW = 560, CH = 400
  const maxW = spec.w, maxH = spec.h
  const scale = Math.min((CW - PAD * 2) / maxW, (CH - PAD * 2) / maxH)
  const rw = maxW * scale, rh = maxH * scale
  const rx = (CW - rw) / 2, ry = (CH - rh) / 2
  const r = 0 // no corner radius - sharp track outline

  return (
    <div
      className="hidden lg:flex flex-col flex-shrink-0"
      style={{
        width: 560,
        background: '#0d0d0d',
        border: `1.5px solid rgba(0,180,216,0.45)`,
        boxShadow: `0 0 60px rgba(0,180,216,0.2)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* top-right corner cut */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 0, height: 0,
        borderStyle: 'solid', borderWidth: '0 24px 24px 0',
        borderColor: `transparent rgba(0,180,216,0.7) transparent transparent`,
        zIndex: 2,
      }} />

      {/* header bar */}
      <div style={{
        padding: '10px 14px 6px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '0.75rem', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)' }}>
          {title}
        </span>
        <div style={{ display: 'flex', gap: 5 }}>
          {TRACK_SPECS.map((_, i) => (
            <div key={i} style={{
              width: i === idx ? 16 : 5, height: 5,
              background: i === idx ? ACCENT : 'rgba(255,255,255,0.15)',
              transition: 'width 0.4s, background 0.4s',
            }} />
          ))}
        </div>
      </div>

      {/* SVG diagram */}
      <div style={{
        flex: 1,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease',
      }}>
        <svg width={CW} height={CH} viewBox={`0 0 ${CW} ${CH}`}>
          {/* grid */}
          <defs>
            <pattern id="hgrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width={CW} height={CH} fill="url(#hgrid)" />

          {/* track outline */}
          <rect x={rx} y={ry} width={rw} height={rh} rx={r} ry={r}
            fill="rgba(0,180,216,0.07)" stroke={ACCENT} strokeWidth="1.5"
            strokeDasharray="0"
          />
          {/* inner track lane */}
          <rect x={rx + 12} y={ry + 12} width={rw - 24} height={rh - 24} rx={r * 0.6} ry={r * 0.6}
            fill="none" stroke="rgba(0,180,216,0.25)" strokeWidth="0.8" strokeDasharray="4 3"
          />

          {/* width dimension line */}
          <line x1={rx} y1={ry - 14} x2={rx + rw} y2={ry - 14} stroke={ACCENT} strokeWidth="0.8" opacity="0.7"/>
          <line x1={rx} y1={ry - 19} x2={rx} y2={ry - 9} stroke={ACCENT} strokeWidth="0.8" opacity="0.7"/>
          <line x1={rx + rw} y1={ry - 19} x2={rx + rw} y2={ry - 9} stroke={ACCENT} strokeWidth="0.8" opacity="0.7"/>
          <text x={rx + rw / 2} y={ry - 22} textAnchor="middle"
            fill={ACCENT} fontSize="12" fontFamily="monospace" letterSpacing="0.5">
            {spec.w.toFixed(1)} m
          </text>

          {/* height dimension line */}
          <line x1={rx + rw + 18} y1={ry} x2={rx + rw + 18} y2={ry + rh} stroke={ACCENT} strokeWidth="0.8" opacity="0.7"/>
          <line x1={rx + rw + 12} y1={ry} x2={rx + rw + 24} y2={ry} stroke={ACCENT} strokeWidth="0.8" opacity="0.7"/>
          <line x1={rx + rw + 12} y1={ry + rh} x2={rx + rw + 24} y2={ry + rh} stroke={ACCENT} strokeWidth="0.8" opacity="0.7"/>
          <text x={rx + rw + 28} y={ry + rh / 2 + 5} textAnchor="start"
            fill={ACCENT} fontSize="12" fontFamily="monospace" letterSpacing="0.5">
            {spec.h.toFixed(1)} m
          </text>

          {/* corner dot */}
          <circle cx={rx + rw / 2} cy={ry + rh / 2} r="3" fill="rgba(0,180,216,0.3)" stroke={ACCENT} strokeWidth="1"/>
        </svg>
      </div>

      {/* footer label */}
      <div style={{
        padding: '6px 14px 10px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1rem', letterSpacing: '0.12em', color: '#fff' }}>
          {specLabels[idx]}
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: ACCENT, letterSpacing: '0.08em' }}>
          {spec.w.toFixed(1)} × {spec.h.toFixed(1)} m
        </span>
      </div>

    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TrackGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded overflow-hidden animate-pulse"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="aspect-video" style={{ background: '#1e1e1e' }} />
          <div className="p-4">
            <div className="h-6 rounded w-2/3 mb-2" style={{ background: '#222' }} />
            <div className="h-3 rounded w-1/3" style={{ background: '#1e1e1e' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Track card ───────────────────────────────────────────────────────────────
function TrackCard({ track, orderLabel }: { track: Track; orderLabel: string }) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const displayName = getTrackDisplayName(track)
  const [imageState, setImageState] = useState({ isPortrait: false, isThin: false })

  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    const check = () => {
      const { naturalWidth: w, naturalHeight: h } = img
      if (!w || !h) return
      setImageState({ isPortrait: h > w, isThin: h / w > 16 / 9 })
    }
    if (img.complete) check()
    img.addEventListener('load', check)
    return () => img.removeEventListener('load', check)
  }, [track.thumbnailUrl])

  const imgClass = imageState.isPortrait
    ? imageState.isThin
      ? '-rotate-90 w-auto h-[177.78%]'
      : '-rotate-90 w-[56.25%] h-auto'
    : 'w-full h-auto'

  return (
    <Link
      ref={cardRef}
      href={`/order?track=${track.id}`}
      className="group block overflow-hidden"
      style={{
        background: '#161616',
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
      onMouseEnter={() => {
        if (cardRef.current) {
          cardRef.current.style.borderColor = 'rgba(0,180,216,0.5)'
          cardRef.current.style.boxShadow = '0 0 24px rgba(0,180,216,0.2)'
        }
      }}
      onMouseLeave={() => {
        if (cardRef.current) {
          cardRef.current.style.borderColor = 'rgba(255,255,255,0.06)'
          cardRef.current.style.boxShadow = 'none'
        }
      }}
    >
      {/* Thumbnail */}
      <div
        className="aspect-video overflow-hidden flex items-center justify-center"
        style={{ background: '#0d0d0d', position: 'relative' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={track.thumbnailUrl}
          alt={displayName}
          className={`transition-transform duration-400 group-hover:scale-105 ${imgClass}`}
        />

      </div>

      {/* Info bar */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div>
          <span
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '1.5rem',
              letterSpacing: '0.04em',
              color: '#fff',
              lineHeight: 1,
            }}
          >
            {displayName}
          </span>
          <div className="flex gap-1.5 mt-1.5">
            {['PVC', 'CLOTH', 'BRICK'].map((m) => (
              <span
                key={m}
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-dm-sans)',
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.35)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '1px 5px',
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: '1.1rem',
            letterSpacing: '0.08em',
            color: ACCENT,
          }}
        >
          {orderLabel}
        </span>
      </div>
    </Link>
  )
}

// ─── Width group ──────────────────────────────────────────────────────────────
function WidthGroup({ width, tracks, widthLabel, orderLabel }: { width: number; tracks: Track[]; widthLabel: (w: number) => string; orderLabel: string }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: '1rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: '1.4rem',
            letterSpacing: '0.08em',
            color: ACCENT,
          }}
        >
          {widthLabel(width)}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: '0.8rem',
            letterSpacing: '0.1em',
            color: ACCENT,
            background: 'rgba(0,180,216,0.1)',
            border: '1px solid rgba(0,180,216,0.25)',
            padding: '1px 8px',
          }}
        >
          {tracks.length}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {tracks.map((track) => (
          <TrackCard key={track.id} track={track} orderLabel={orderLabel} />
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const locale = useLocale()
  const t = translations[locale]

  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all')
  const [materialFilter, setMaterialFilter] = useState<MaterialFilter>('all')
  const [showAllGroups, setShowAllGroups] = useState(true)

  useEffect(() => {
    fetch('/api/tracks')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setTracks(data.data)
        } else {
          setError('Failed to load track data')
        }
      })
      .catch(() => setError('Network error — please refresh'))
      .finally(() => setLoading(false))
  }, [])

  const filteredTracks = tracks.filter((t) => matchesSizeFilter(t, sizeFilter))
  const groups = groupByWidth(filteredTracks)
  const visibleGroups = showAllGroups ? groups : groups.slice(0, 2)

  return (
    <div style={{ background: '#080808', color: '#fff', minHeight: '100vh', fontFamily: 'var(--font-dm-sans), sans-serif' }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(8,8,8,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/Logo.png"
              alt="NessRC"
              style={{ height: 36, width: 'auto', display: 'block' }}
            />
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: t.nav.tracks, href: '#tracks' },
              { label: t.nav.materials, href: '#materials' },
              { label: t.nav.orderStatus, href: '/track' },
            ].map(({ label, href }) => (
              <NavLink key={label} href={href} label={label} />
            ))}
          </nav>

          {/* CTA */}
          <HeaderOrderBtn label={t.nav.trackMyOrder} />
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: '28svh', display: 'flex', alignItems: 'center' }}
      >
        {/* Background layers */}
        <GridBg opacity={0.035} />
        <NoiseSvg />

        {/* Cyan glow — bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-5%',
            width: '50vw',
            height: '50vw',
            background: `radial-gradient(circle, rgba(0,180,216,0.08) 0%, transparent 70%)`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* Watermark "01" */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            right: '2%',
            fontFamily: 'var(--font-bebas)',
            fontSize: 'clamp(6rem, 18vw, 16rem)',
            lineHeight: 1,
            color: 'rgba(0,180,216,0.03)',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 1,
            letterSpacing: '-0.02em',
          }}
        >
          01
        </div>

        <div
          className="relative w-full max-w-7xl mx-auto px-6 py-10"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '4rem',
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          {/* Left — Content */}
          <div>
            {/* Tag */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: '1.5rem',
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 1,
                  background: ACCENT,
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.28em',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                }}
              >
                {t.hero.tag}
              </span>
            </div>

            {/* Main title */}
            <h1
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(3.5rem, 9vw, 7rem)',
                lineHeight: 0.85,
                letterSpacing: '0.01em',
                margin: 0,
              }}
            >
              <span style={{ display: 'block', color: '#fff' }}>{t.hero.line1}</span>
              <span style={{ display: 'block', color: ACCENT }}>{t.hero.line2}</span>
            </h1>

            {/* Sub */}
            <p
              style={{
                marginTop: '1.75rem',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.5)',
                maxWidth: '420px',
              }}
            >
              {t.hero.subtitle}
            </p>

            {/* Buttons */}
            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <HeroCtaPrimary label={t.hero.shopTracks} />
              <HeroCtaSecondary label={t.hero.learnMore} />
            </div>

            {/* Spec strip */}
            <div
              style={{
                marginTop: '3rem',
                display: 'flex',
                gap: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {[
                { label: t.hero.stats.materialsLabel, value: '3' },
                { label: t.hero.stats.maxSizeLabel, value: '3m' },
                { label: t.hero.stats.leadTimeLabel, value: '7–14d' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div
                    style={{
                      fontFamily: 'var(--font-bebas)',
                      fontSize: '1.8rem',
                      color: '#fff',
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      fontSize: '0.6rem',
                      letterSpacing: '0.18em',
                      color: 'rgba(255,255,255,0.35)',
                      marginTop: 3,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Data panel */}
          <HeroDataPanel specLabels={t.specViewer.specLabels} title={t.specViewer.title} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TRACK CATALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="tracks" className="py-24" style={{ background: '#080808' }}>
        <div className="max-w-7xl mx-auto px-6">

          {/* Control bar */}
          <div
            className="mb-10"
            style={{ paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Title row */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-bebas)',
                    fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                    letterSpacing: '0.04em',
                    color: '#fff',
                    lineHeight: 1,
                    margin: 0,
                  }}
                >
                  {t.catalog.title}
                </h2>
                {!loading && tracks.length > 0 && (
                  <span
                    style={{
                      fontFamily: 'var(--font-bebas)',
                      fontSize: '0.85rem',
                      letterSpacing: '0.1em',
                      color: ACCENT,
                      background: 'rgba(0,180,216,0.1)',
                      border: '1px solid rgba(0,180,216,0.3)',
                      padding: '2px 10px',
                    }}
                  >
                    {filteredTracks.length}/{tracks.length}
                  </span>
                )}
              </div>
            </div>

            {/* Size filter row */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.18em',
                  color: 'rgba(255,255,255,0.3)',
                  fontFamily: 'var(--font-dm-sans)',
                  minWidth: 52,
                }}
              >
                {t.catalog.sizeLabel}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {([
                  { key: 'all', label: 'ALL' },
                  { key: 'small', label: 'SMALL' },
                  { key: 'medium', label: 'MEDIUM' },
                  { key: 'large', label: 'LARGE' },
                ] as { key: SizeFilter; label: string }[]).map(({ key, label: _label }) => {
                  const label = key === 'all' ? t.catalog.all : key === 'small' ? t.catalog.small : key === 'medium' ? t.catalog.medium : t.catalog.large
                  return (
                    <FilterBtn
                      key={key}
                      label={label}
                      active={sizeFilter === key}
                      onClick={() => setSizeFilter(key)}
                    />
                  )
                })}
              </div>
            </div>

            {/* Material filter row */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.18em',
                  color: 'rgba(255,255,255,0.3)',
                  fontFamily: 'var(--font-dm-sans)',
                  minWidth: 52,
                }}
              >
                {t.catalog.materialLabel}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {([
                  { key: 'all', label: 'ALL' },
                  { key: 'PVC', label: 'PVC' },
                  { key: 'CLOTH', label: 'CLOTH' },
                  { key: 'BRICK-A', label: 'BRICK-A' },
                ] as { key: MaterialFilter; label: string }[]).map(({ key, label: _label }) => {
                  const label = key === 'all' ? t.catalog.all : key === 'CLOTH' ? t.catalog.cloth : key
                  return (
                    <FilterBtn
                      key={key}
                      label={label}
                      active={materialFilter === key}
                      onClick={() => setMaterialFilter(key)}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {loading && <TrackGridSkeleton />}

          {error && (
            <div className="text-center py-24" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <p className="text-base mb-3">{error}</p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  fontSize: '0.8rem',
                  color: ACCENT,
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t.catalog.retry}
              </button>
            </div>
          )}

          {!loading && !error && tracks.length === 0 && (
            <div className="text-center py-24" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-bebas)', letterSpacing: '0.1em' }}>
              {t.catalog.noTracks}
            </div>
          )}

          {!loading && !error && tracks.length > 0 && filteredTracks.length === 0 && (
            <div className="text-center py-24" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-bebas)', letterSpacing: '0.1em' }}>
              {t.catalog.noMatch}
            </div>
          )}

          {!loading && filteredTracks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              {visibleGroups.map(({ width, items }) => (
                <WidthGroup key={width} width={width} tracks={items} widthLabel={t.catalog.widthGroup} orderLabel={t.catalog.order} />
              ))}

              {groups.length > 2 && (
                <div className="text-center" style={{ paddingTop: '1rem' }}>
                  <button
                    onClick={() => setShowAllGroups((v) => !v)}
                    style={{
                      fontFamily: 'var(--font-bebas)',
                      fontSize: '0.85rem',
                      letterSpacing: '0.16em',
                      color: ACCENT,
                      background: 'transparent',
                      border: `1px solid rgba(0,180,216,0.35)`,
                      padding: '8px 28px',
                      cursor: 'pointer',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      const t = e.currentTarget
                      t.style.background = 'rgba(0,180,216,0.12)'
                    }}
                    onMouseLeave={(e) => {
                      const t = e.currentTarget
                      t.style.background = 'transparent'
                    }}
                  >
                    {showAllGroups ? t.catalog.showLess : t.catalog.showAll(groups.length - 2)}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          MATERIALS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        id="materials"
        className="relative py-28 overflow-hidden"
        style={{
          background: '#111',
          borderTop: `2px solid ${ACCENT}`,
        }}
      >
        <GridBg opacity={0.025} />
        <NoiseSvg />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Section header */}
          <div className="mb-16">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ width: 28, height: 2, background: ACCENT, display: 'inline-block' }} />
              <span
                style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.25em',
                  color: ACCENT,
                  textTransform: 'uppercase',
                }}
              >
                {t.materials.sectionTag}
              </span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                letterSpacing: '0.04em',
                color: '#fff',
                lineHeight: 1,
              }}
            >
              {t.materials.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {t.materials.items.map((mat) => (
              <MaterialCard key={mat.num} mat={mat} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════════ */}
      <footer
        style={{
          background: '#080808',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '2rem 0',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: '1.2rem',
                letterSpacing: '0.1em',
                lineHeight: 1,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/Logo.png" alt="NessRC" style={{ height: 28, width: 'auto', display: 'block' }} />
            </div>
            <p
              style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.25)',
                marginTop: 6,
                letterSpacing: '0.12em',
              }}
            >
              {t.footer.tagline}
            </p>
            <p
              style={{
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.18)',
                marginTop: 4,
                letterSpacing: '0.1em',
              }}
            >
              © 2025 NessRC.net
            </p>
          </div>
          <FooterLinks />
        </div>
      </footer>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavLink({ href, label }: { href: string; label: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  return (
    <Link
      ref={ref}
      href={href}
      style={{
        fontFamily: 'var(--font-dm-sans)',
        fontSize: '0.72rem',
        letterSpacing: '0.18em',
        color: 'rgba(255,255,255,0.55)',
        textTransform: 'uppercase' as const,
        transition: 'color 0.2s',
        textDecoration: 'none',
      }}
      onMouseEnter={() => { if (ref.current) ref.current.style.color = '#fff' }}
      onMouseLeave={() => { if (ref.current) ref.current.style.color = 'rgba(255,255,255,0.55)' }}
    >
      {label}
    </Link>
  )
}

function HeaderOrderBtn({ label }: { label: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  return (
    <Link
      ref={ref}
      href="/track"
      style={{
        fontFamily: 'var(--font-dm-sans)',
        fontSize: '0.72rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
        padding: '7px 18px',
        border: `1.5px solid ${ACCENT}`,
        color: ACCENT,
        transition: 'background 0.2s, color 0.2s',
        textDecoration: 'none',
        flexShrink: 0,
      }}
      onMouseEnter={() => {
        if (ref.current) { ref.current.style.background = ACCENT; ref.current.style.color = '#000' }
      }}
      onMouseLeave={() => {
        if (ref.current) { ref.current.style.background = 'transparent'; ref.current.style.color = ACCENT }
      }}
    >
      {label}
    </Link>
  )
}

function HeroCtaPrimary({ label }: { label: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  return (
    <Link
      ref={ref}
      href="#tracks"
      style={{
        fontFamily: 'var(--font-dm-sans)',
        fontSize: '0.8rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
        padding: '13px 32px',
        background: ACCENT,
        color: '#000',
        fontWeight: 700,
        transition: 'box-shadow 0.25s, transform 0.2s',
        textDecoration: 'none',
      }}
      onMouseEnter={() => {
        if (ref.current) { ref.current.style.boxShadow = '0 0 32px rgba(0,180,216,0.4)'; ref.current.style.transform = 'translateY(-2px)' }
      }}
      onMouseLeave={() => {
        if (ref.current) { ref.current.style.boxShadow = 'none'; ref.current.style.transform = 'none' }
      }}
    >
      {label}
    </Link>
  )
}

function HeroCtaSecondary({ label }: { label: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  return (
    <Link
      ref={ref}
      href="#materials"
      style={{
        fontFamily: 'var(--font-dm-sans)',
        fontSize: '0.8rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
        padding: '13px 32px',
        border: '1.5px solid rgba(255,255,255,0.25)',
        color: 'rgba(255,255,255,0.8)',
        transition: 'border-color 0.25s, color 0.25s',
        textDecoration: 'none',
      }}
      onMouseEnter={() => {
        if (ref.current) { ref.current.style.borderColor = 'rgba(255,255,255,0.7)'; ref.current.style.color = '#fff' }
      }}
      onMouseLeave={() => {
        if (ref.current) { ref.current.style.borderColor = 'rgba(255,255,255,0.25)'; ref.current.style.color = 'rgba(255,255,255,0.8)' }
      }}
    >
      {label}
    </Link>
  )
}

function MaterialCard({
  mat,
}: {
  mat: { num: string; name: string; specs: string; badges: string[]; desc: string }
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      style={{
        background: '#161616',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '2rem',
        position: 'relative',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
      onMouseEnter={() => {
        if (ref.current) {
          ref.current.style.borderColor = 'rgba(0,180,216,0.3)'
          ref.current.style.boxShadow = '0 0 20px rgba(0,180,216,0.08)'
        }
      }}
      onMouseLeave={() => {
        if (ref.current) {
          ref.current.style.borderColor = 'rgba(255,255,255,0.06)'
          ref.current.style.boxShadow = 'none'
        }
      }}
    >
      {/* Number */}
      <div
        style={{
          fontFamily: 'var(--font-bebas)',
          fontSize: '3rem',
          color: ACCENT,
          lineHeight: 1,
          marginBottom: '0.5rem',
        }}
      >
        {mat.num}
      </div>

      {/* Name */}
      <h3
        style={{
          fontFamily: 'var(--font-bebas)',
          fontSize: '2rem',
          letterSpacing: '0.06em',
          color: '#fff',
          lineHeight: 1,
          margin: 0,
        }}
      >
        {mat.name}
      </h3>

      {/* Specs */}
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.06em',
          marginTop: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        {mat.specs}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.25rem' }}>
        {mat.badges.map((b) => (
          <span
            key={b}
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '2px 8px',
              textTransform: 'uppercase' as const,
            }}
          >
            {b}
          </span>
        ))}
      </div>

      {/* Desc */}
      <p
        style={{
          fontSize: '0.82rem',
          lineHeight: 1.65,
          color: 'rgba(255,255,255,0.38)',
          margin: 0,
        }}
      >
        {mat.desc}
      </p>

      {/* Bottom accent line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${ACCENT} 0%, transparent 100%)`,
          opacity: 0.5,
        }}
      />
    </div>
  )
}

function FilterBtn({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-dm-sans)',
        fontSize: '0.65rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
        padding: '6px 14px',
        background: active ? ACCENT : 'transparent',
        color: active ? '#000' : 'rgba(255,255,255,0.45)',
        border: active ? `1px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.12)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontWeight: active ? 700 : 400,
      }}
    >
      {label}
    </button>
  )
}

function FooterLinks() {
  const t = translations[useLocale()]
  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      {[
        { label: t.nav.tracks, href: '#tracks' },
        { label: t.nav.materials, href: '#materials' },
        { label: t.nav.orderStatus, href: '/track' },
      ].map(({ label, href }) => (
        <FooterLink key={label} label={label} href={href} />
      ))}
    </div>
  )
}

function FooterLink({ label, href }: { label: string; href: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  return (
    <Link
      ref={ref}
      href={href}
      style={{
        fontFamily: 'var(--font-dm-sans)',
        fontSize: '0.65rem',
        letterSpacing: '0.16em',
        color: 'rgba(255,255,255,0.3)',
        textDecoration: 'none',
        transition: 'color 0.2s',
      }}
      onMouseEnter={() => { if (ref.current) ref.current.style.color = ACCENT }}
      onMouseLeave={() => { if (ref.current) ref.current.style.color = 'rgba(255,255,255,0.3)' }}
    >
      {label}
    </Link>
  )
}
