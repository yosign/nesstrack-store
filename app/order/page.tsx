'use client'

import { use, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { tracks } from '@/lib/tracks'
import { MATERIALS, MaterialType, getTrackDisplayName } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { translations } from '@/lib/i18n'
import { useLocale } from '@/lib/use-locale'
import { TrackDesign } from '@/lib/track-design/types'
import { parseDesign, DesignParseError } from '@/lib/track-design/serialize'
import { TrackPreview } from '@/components/track-design/TrackPath'
import { renderPreviewPng } from '@/lib/track-design/preview'

const CUSTOM_DESIGN_SESSION_PREFIX = 'nest:custom-design:'

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

  const customDesignTokenParam = params.customDesignToken
  const customDesignToken = Array.isArray(customDesignTokenParam)
    ? customDesignTokenParam[0]
    : customDesignTokenParam
  const [customDesign, setCustomDesign] = useState<TrackDesign | null>(null)
  const [customDesignLoaded, setCustomDesignLoaded] = useState(false)

  useEffect(() => {
    if (!customDesignToken) {
      setCustomDesignLoaded(true)
      return
    }
    try {
      const raw = sessionStorage.getItem(CUSTOM_DESIGN_SESSION_PREFIX + customDesignToken)
      if (raw) setCustomDesign(parseDesign(raw))
    } catch (err) {
      if (err instanceof DesignParseError) console.error('invalid stored design', err)
      else console.error(err)
    } finally {
      setCustomDesignLoaded(true)
    }
  }, [customDesignToken])

  const locale = useLocale()
  const t = translations[locale]

  const router = useRouter()
  const [material, setMaterial] = useState<MaterialType>('pvc')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCustom = !!customDesign
  const showEmpty = !isCustom && selectedTracks.length === 0 && customDesignLoaded
  const showWaiting = !!customDesignToken && !customDesignLoaded

  if (showWaiting) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808' }} />
    )
  }

  if (showEmpty) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#080808',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              color: 'rgba(255,255,255,0.4)',
              marginBottom: 24,
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            {t.order.noTrack}
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              background: '#00B4D8',
              color: '#000',
              padding: '12px 28px',
              fontFamily: 'var(--font-bebas)',
              letterSpacing: '0.12em',
              fontSize: '1rem',
              textDecoration: 'none',
            }}
          >
            {t.order.backHome}
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) {
      setError(t.order.errorShipping)
      return
    }
    const trimmedEmail = email.trim()
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(t.order.errorEmail)
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

      let previewUrl: string | null = null
      if (isCustom && customDesign) {
        const png = await renderPreviewPng(customDesign)
        const path = `${orderNumber}.png`
        const { error: uploadErr } = await supabase.storage
          .from('track-previews')
          .upload(path, png, { contentType: 'image/png', upsert: false })
        if (uploadErr) throw uploadErr
        const { data: publicUrl } = supabase.storage.from('track-previews').getPublicUrl(path)
        previewUrl = publicUrl.publicUrl
      }

      const orderRow: Record<string, unknown> = {
        order_number: orderNumber,
        address,
        material,
        status: 'pending',
        production_status: 'pending',
        dealer_token: dealerToken,
        supplier_token: supplierToken,
        pending_at: new Date().toISOString(),
        notes: notes || null,
        email: trimmedEmail || null,
      }
      if (isCustom && customDesign) {
        orderRow.custom_track_design = customDesign
        orderRow.custom_track_preview_url = previewUrl
      } else {
        orderRow.track_id = selectedTracks[0].id
        orderRow.track_ids = trackIds
      }

      const { error: dbError } = await supabase.from('orders').insert(orderRow)
      if (dbError) throw dbError

      if (customDesignToken) {
        try {
          sessionStorage.removeItem(CUSTOM_DESIGN_SESSION_PREFIX + customDesignToken)
        } catch {}
      }
      router.push(`/order/success?token=${dealerToken}`)
    } catch (err) {
      console.error(err)
      setError(t.order.errorSubmit)
    } finally {
      setIsSubmitting(false)
    }
  }

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'var(--font-bebas)',
    fontSize: '0.75rem',
    letterSpacing: '0.2em',
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 12,
  }

  const textareaBase: React.CSSProperties = {
    width: '100%',
    background: '#111',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    padding: '12px 16px',
    fontSize: '0.875rem',
    resize: 'none',
    outline: 'none',
    fontFamily: 'var(--font-dm-sans)',
    boxSizing: 'border-box',
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
            {t.order.breadcrumb}
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
            {t.nav.back}
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10">
          {/* Left: Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
          >
            {/* Material */}
            <section>
              <div style={sectionLabel}>{t.order.materialSection}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(Object.keys(MATERIALS) as MaterialType[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMaterial(key)}
                    style={{
                      padding: '14px 8px',
                      background: material === key ? 'rgba(0,180,216,0.15)' : '#111',
                      border: `1px solid ${material === key ? '#00B4D8' : 'rgba(255,255,255,0.1)'}`,
                      color: material === key ? '#fff' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-bebas)',
                        fontSize: '1.1rem',
                        letterSpacing: '0.1em',
                        marginBottom: 4,
                      }}
                    >
                      {t.order.materialLabels[key] ?? MATERIALS[key].label}
                    </div>
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: material === key ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.28)',
                        letterSpacing: '0.04em',
                        fontFamily: 'var(--font-dm-sans)',
                      }}
                    >
                      {t.order.materialDesc[key]}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Shipping info */}
            <section>
              <div style={sectionLabel}>{t.order.shippingSection}</div>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t.order.shippingPlaceholder}
                rows={3}
                required
                style={textareaBase}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#00B4D8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </section>

            {/* Email */}
            <section>
              <div style={sectionLabel}>{t.order.emailSection}</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.order.emailPlaceholder}
                autoComplete="email"
                style={textareaBase}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#00B4D8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </section>

            {/* Notes */}
            <section>
              <div style={sectionLabel}>{t.order.notesSection}</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.order.notesPlaceholder}
                rows={2}
                style={textareaBase}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#00B4D8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </section>

            {error && (
              <div
                style={{
                  borderLeft: '2px solid rgba(255,80,80,0.9)',
                  paddingLeft: 12,
                  color: 'rgba(255,80,80,0.9)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: 52,
                background: '#00B4D8',
                color: '#000',
                fontFamily: 'var(--font-bebas)',
                fontSize: '1.1rem',
                letterSpacing: '0.12em',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.4 : 1,
              }}
            >
              {isSubmitting ? t.order.submitting : t.order.placeOrder}
            </button>
          </form>

          {/* Right: Summary */}
          <div className="mt-10 lg:mt-0">
            <div
              style={{
                background: '#111',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '1.5rem',
              }}
            >
              <div style={sectionLabel}>{t.order.summary}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {isCustom && customDesign ? (
                  <div>
                    <div
                      style={{
                        position: 'relative',
                        aspectRatio: `${customDesign.bboxW} / ${customDesign.bboxH}`,
                        background: '#0d0d0d',
                      }}
                    >
                      <TrackPreview design={customDesign} showFrame />
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-bebas)',
                        fontSize: '1.1rem',
                        letterSpacing: '0.08em',
                        marginTop: 8,
                        color: '#fff',
                      }}
                    >
                      CUSTOM · {customDesign.bboxW} × {customDesign.bboxH} M
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-dm-sans)',
                        fontSize: '0.7rem',
                        color: 'rgba(255,255,255,0.45)',
                        marginTop: 4,
                      }}
                    >
                      {customDesign.anchors.length} anchors · {customDesign.closed ? 'closed' : 'open'} · stroke {(customDesign.strokeW * 100).toFixed(1)} cm
                    </div>
                  </div>
                ) : (
                  selectedTracks.map((track) => (
                    <div key={track.id}>
                      <TrackThumb src={track.thumbnailUrl} alt={getTrackDisplayName(track)} />
                      <div
                        style={{
                          fontFamily: 'var(--font-bebas)',
                          fontSize: '1.1rem',
                          letterSpacing: '0.08em',
                          marginTop: 8,
                          color: '#fff',
                        }}
                      >
                        {getTrackDisplayName(track)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
