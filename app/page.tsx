'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getTrackDisplayName } from '@/lib/types'
import type { Track } from '@/lib/types'

const ORANGE = '#FF4500'

// ─── Size filter logic ────────────────────────────────────────────────────────
type SizeFilter = 'all' | 'small' | 'medium' | 'large'

function getShortSide(trackName: string): number | null {
  const m = trackName.match(/^(\d+\.?\d*)[xX×](\d+\.?\d*)/)
  if (!m) return null
  const a = parseFloat(m[1])
  const b = parseFloat(m[2])
  return Math.min(a, b)
}

function matchesFilter(track: Track, filter: SizeFilter): boolean {
  if (filter === 'all') return true
  const s = getShortSide(track.name)
  if (s === null) return true
  if (filter === 'small') return s < 1.0
  if (filter === 'medium') return s >= 1.0 && s <= 1.5
  if (filter === 'large') return s > 1.5
  return true
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

// ─── RC circuit SVG ───────────────────────────────────────────────────────────
function CircuitDiagram() {
  return (
    <div
      className="relative w-full h-full rounded-lg overflow-hidden"
      style={{
        background: '#0d0d0d',
        border: `1px solid rgba(255,69,0,0.35)`,
        boxShadow: `0 0 40px rgba(255,69,0,0.12), inset 0 0 60px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Corner label */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          fontFamily: 'var(--font-bebas)',
          fontSize: '0.7rem',
          letterSpacing: '0.15em',
          color: ORANGE,
          border: `1px solid rgba(255,69,0,0.4)`,
          padding: '2px 8px',
          zIndex: 10,
        }}
      >
        1:24 SCALE
      </div>

      {/* Size data bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          fontFamily: 'var(--font-bebas)',
          fontSize: '1rem',
          letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.55)',
          zIndex: 10,
        }}
      >
        1.5 × 2.2 m
      </div>

      {/* Grid */}
      <GridBg opacity={0.06} />

      {/* Circuit SVG */}
      <svg
        viewBox="0 0 400 300"
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        fill="none"
      >
        {/* Outer track boundary */}
        <path
          d="M 60 80 Q 60 40 100 40 L 300 40 Q 340 40 340 80 L 340 220 Q 340 260 300 260 L 100 260 Q 60 260 60 220 Z"
          stroke="rgba(255,69,0,0.25)"
          strokeWidth="1"
          fill="none"
        />
        {/* Inner track boundary */}
        <path
          d="M 110 100 Q 110 80 130 80 L 270 80 Q 290 80 290 100 L 290 200 Q 290 220 270 220 L 130 220 Q 110 220 110 200 Z"
          stroke="rgba(255,69,0,0.15)"
          strokeWidth="0.5"
          fill="none"
        />
        {/* Race line */}
        <path
          d="M 85 80 Q 85 58 108 58 L 292 58 Q 315 58 315 82 L 315 218 Q 315 242 292 242 L 108 242 Q 85 242 85 218 Z"
          stroke={ORANGE}
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="0"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Start/finish line */}
        <line x1="85" y1="150" x2="60" y2="150" stroke={ORANGE} strokeWidth="2" />
        <rect x="60" y="142" width="10" height="16" fill="rgba(255,69,0,0.2)" stroke={ORANGE} strokeWidth="0.5" />
        {/* Apex markers */}
        <circle cx="200" cy="58" r="3" fill="rgba(255,69,0,0.5)" />
        <circle cx="315" cy="150" r="3" fill="rgba(255,69,0,0.5)" />
        <circle cx="200" cy="242" r="3" fill="rgba(255,69,0,0.5)" />
        <circle cx="85" cy="150" r="3" fill={ORANGE} />
        {/* Dimension lines */}
        <line x1="60" y1="280" x2="340" y2="280" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <line x1="60" y1="275" x2="60" y2="285" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <line x1="340" y1="275" x2="340" y2="285" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <line x1="360" y1="40" x2="360" y2="260" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <line x1="355" y1="40" x2="365" y2="40" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <line x1="355" y1="260" x2="365" y2="260" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      </svg>
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
function TrackCard({ track }: { track: Track }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const displayName = getTrackDisplayName(track)

  return (
    <Link
      ref={ref}
      href={`/order?track=${track.id}`}
      className="group block overflow-hidden"
      style={{
        background: '#161616',
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
      onMouseEnter={() => {
        if (ref.current) {
          ref.current.style.borderColor = 'rgba(255,69,0,0.5)'
          ref.current.style.boxShadow = '0 0 24px rgba(255,69,0,0.2)'
        }
      }}
      onMouseLeave={() => {
        if (ref.current) {
          ref.current.style.borderColor = 'rgba(255,255,255,0.06)'
          ref.current.style.boxShadow = 'none'
        }
      }}
    >
      {/* Thumbnail */}
      <div className="aspect-video relative overflow-hidden" style={{ background: '#0d0d0d' }}>
        <Image
          src={track.thumbnailUrl}
          alt={displayName}
          fill
          className="object-cover transition-transform duration-400 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized
        />
        {/* Diagonal cut top-right */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: '0 24px 24px 0',
            borderColor: `transparent rgba(255,69,0,0.6) transparent transparent`,
          }}
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
            color: ORANGE,
          }}
        >
          ORDER →
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
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all')

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

  const filteredTracks = tracks.filter((t) => matchesFilter(t, sizeFilter))

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
          <div
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '1.6rem',
              letterSpacing: '0.08em',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            TRACK HALL<span style={{ color: ORANGE }}>.</span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: 'TRACKS', href: '#tracks' },
              { label: 'MATERIALS', href: '#materials' },
              { label: 'ORDER STATUS', href: '/track' },
            ].map(({ label, href }) => (
              <NavLink key={label} href={href} label={label} />
            ))}
          </nav>

          {/* CTA */}
          <HeaderOrderBtn />
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: '100svh', display: 'flex', alignItems: 'center' }}
      >
        {/* Background layers */}
        <GridBg opacity={0.035} />
        <NoiseSvg />

        {/* Orange glow — bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-5%',
            width: '50vw',
            height: '50vw',
            background: `radial-gradient(circle, rgba(255,69,0,0.08) 0%, transparent 70%)`,
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
            color: 'rgba(255,69,0,0.03)',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 1,
            letterSpacing: '-0.02em',
          }}
        >
          01
        </div>

        <div
          className="relative w-full max-w-7xl mx-auto px-6 py-28"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
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
                  background: ORANGE,
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
                RC TRACK MATS · EST. 2025
              </span>
            </div>

            {/* Main title */}
            <h1
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(5rem, 12vw, 10rem)',
                lineHeight: 0.85,
                letterSpacing: '0.01em',
                margin: 0,
              }}
            >
              <span style={{ display: 'block', color: '#fff' }}>CUSTOM</span>
              <span style={{ display: 'block', color: '#fff' }}>RACE</span>
              <span style={{ display: 'block', color: '#fff' }}>TRACK</span>
              <span style={{ display: 'block', color: ORANGE }}>MATS</span>
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
              Professional-grade custom-printed track mats for RC drift &amp; racing.
              PVC · Race Cloth · Brick-A materials.
            </p>

            {/* Buttons */}
            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <HeroCtaPrimary />
              <HeroCtaSecondary />
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
                { label: 'MATERIALS', value: '3' },
                { label: 'MAX SIZE', value: '3m' },
                { label: 'LEAD TIME', value: '7–14d' },
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

          {/* Right — Circuit diagram */}
          <div
            className="hidden lg:block"
            style={{ height: '480px', position: 'relative' }}
          >
            <CircuitDiagram />
          </div>
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
          borderTop: `2px solid ${ORANGE}`,
        }}
      >
        <GridBg opacity={0.025} />
        <NoiseSvg />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Section header */}
          <div className="mb-16">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ width: 28, height: 2, background: ORANGE, display: 'inline-block' }} />
              <span
                style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.25em',
                  color: ORANGE,
                  textTransform: 'uppercase',
                }}
              >
                SPECIFICATIONS
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
              MATERIAL SPECS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                num: '01',
                name: 'PVC',
                specs: '0.3mm · Smooth Surface · 380g/m²',
                badges: ['Lightweight', 'Portable', 'Indoor'],
                desc: 'Elastic PVC sheet, smooth surface. Lightweight and easy to roll up for storage.',
              },
              {
                num: '02',
                name: 'RACE CLOTH',
                specs: '0.8mm · Woven Texture · 620g/m²',
                badges: ['Professional', 'High Fidelity', 'Race-Grade'],
                desc: 'Fine-woven canvas with exceptional color accuracy. Professional circuit standard.',
              },
              {
                num: '03',
                name: 'BRICK-A',
                specs: '5mm · Granular Surface · 1800g/m²',
                badges: ['Anti-slip', 'Thick', 'Realistic'],
                desc: '5mm PVC foam with granular top. Heavy, stable, with authentic track feel underfoot.',
              },
            ].map((mat) => (
              <MaterialCard key={mat.num} mat={mat} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TRACK CATALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="tracks" className="py-24" style={{ background: '#080808' }}>
        <div className="max-w-7xl mx-auto px-6">

          {/* Control bar */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 mb-10"
            style={{ paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Left: title + count */}
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
                TRACK CATALOG
              </h2>
              {!loading && tracks.length > 0 && (
                <span
                  style={{
                    fontFamily: 'var(--font-bebas)',
                    fontSize: '0.85rem',
                    letterSpacing: '0.1em',
                    color: ORANGE,
                    background: 'rgba(255,69,0,0.1)',
                    border: '1px solid rgba(255,69,0,0.3)',
                    padding: '2px 10px',
                  }}
                >
                  {filteredTracks.length}/{tracks.length}
                </span>
              )}
            </div>

            {/* Right: filter buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              {([
                { key: 'all', label: 'ALL' },
                { key: 'small', label: 'SMALL' },
                { key: 'medium', label: 'MEDIUM' },
                { key: 'large', label: 'LARGE' },
              ] as { key: SizeFilter; label: string }[]).map(({ key, label }) => (
                <FilterBtn
                  key={key}
                  label={label}
                  active={sizeFilter === key}
                  onClick={() => setSizeFilter(key)}
                />
              ))}
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
                  color: ORANGE,
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                RETRY
              </button>
            </div>
          )}

          {!loading && !error && tracks.length === 0 && (
            <div className="text-center py-24" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-bebas)', letterSpacing: '0.1em' }}>
              NO TRACKS AVAILABLE
            </div>
          )}

          {!loading && !error && tracks.length > 0 && filteredTracks.length === 0 && (
            <div className="text-center py-24" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-bebas)', letterSpacing: '0.1em' }}>
              NO TRACKS MATCH THIS FILTER
            </div>
          )}

          {!loading && filteredTracks.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTracks.map((track) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          )}
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
              TRACK HALL<span style={{ color: ORANGE }}>.</span>
            </div>
            <p
              style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.25)',
                marginTop: 6,
                letterSpacing: '0.12em',
              }}
            >
              RC TRACK MATS · CUSTOM PRINTED
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

function HeaderOrderBtn() {
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
        border: `1.5px solid ${ORANGE}`,
        color: ORANGE,
        transition: 'background 0.2s, color 0.2s',
        textDecoration: 'none',
        flexShrink: 0,
      }}
      onMouseEnter={() => {
        if (ref.current) { ref.current.style.background = ORANGE; ref.current.style.color = '#000' }
      }}
      onMouseLeave={() => {
        if (ref.current) { ref.current.style.background = 'transparent'; ref.current.style.color = ORANGE }
      }}
    >
      TRACK MY ORDER
    </Link>
  )
}

function HeroCtaPrimary() {
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
        background: ORANGE,
        color: '#000',
        fontWeight: 700,
        transition: 'box-shadow 0.25s, transform 0.2s',
        textDecoration: 'none',
      }}
      onMouseEnter={() => {
        if (ref.current) { ref.current.style.boxShadow = '0 0 32px rgba(255,69,0,0.5)'; ref.current.style.transform = 'translateY(-2px)' }
      }}
      onMouseLeave={() => {
        if (ref.current) { ref.current.style.boxShadow = 'none'; ref.current.style.transform = 'none' }
      }}
    >
      SHOP TRACKS
    </Link>
  )
}

function HeroCtaSecondary() {
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
      LEARN MORE
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
          ref.current.style.borderColor = 'rgba(255,69,0,0.3)'
          ref.current.style.boxShadow = '0 0 20px rgba(255,69,0,0.08)'
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
          color: ORANGE,
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
          background: `linear-gradient(90deg, ${ORANGE} 0%, transparent 100%)`,
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
        background: active ? ORANGE : 'transparent',
        color: active ? '#000' : 'rgba(255,255,255,0.45)',
        border: active ? `1px solid ${ORANGE}` : '1px solid rgba(255,255,255,0.12)',
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
  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      {[
        { label: 'TRACKS', href: '#tracks' },
        { label: 'MATERIALS', href: '#materials' },
        { label: 'ORDER STATUS', href: '/track' },
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
      onMouseEnter={() => { if (ref.current) ref.current.style.color = ORANGE }}
      onMouseLeave={() => { if (ref.current) ref.current.style.color = 'rgba(255,255,255,0.3)' }}
    >
      {label}
    </Link>
  )
}
