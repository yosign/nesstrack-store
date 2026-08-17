'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TrackDesign, TRACK_DESIGN_VERSION, STROKE_W_MIN } from '@/lib/track-design/types'
import { SizePicker } from '@/components/track-design/SizePicker'
import { TemplateGallery } from '@/components/track-design/TemplateGallery'
import { TrackEditor } from '@/components/track-design/TrackEditor'
import { serializeDesign } from '@/lib/track-design/serialize'

const SESSION_KEY_PREFIX = 'nest:custom-design:'

function makeBlankDesign(bboxW: number, bboxH: number): TrackDesign {
  const stroke = Math.max(STROKE_W_MIN, Math.min(0.18, Math.min(bboxW, bboxH) * 0.12))
  return {
    version: TRACK_DESIGN_VERSION,
    bboxW,
    bboxH,
    anchors: [],
    closed: false,
    strokeW: stroke,
  }
}

const stepLabel: React.CSSProperties = {
  fontFamily: 'var(--font-bebas)',
  fontSize: '0.75rem',
  letterSpacing: '0.2em',
  color: 'rgba(255,255,255,0.4)',
  marginBottom: 12,
}

const heading: React.CSSProperties = {
  fontFamily: 'var(--font-bebas)',
  fontSize: '1.6rem',
  letterSpacing: '0.12em',
  color: '#fff',
  marginBottom: 24,
}

export default function CustomizePage() {
  const router = useRouter()
  const [step, setStep] = useState<'size' | 'template' | 'edit'>('size')
  const [bbox, setBbox] = useState<{ w: number; h: number } | null>(null)
  const [seedDesign, setSeedDesign] = useState<TrackDesign | null>(null)

  const handleSizePicked = (w: number, h: number) => {
    setBbox({ w, h })
    setStep('template')
  }

  const handleSkipTemplate = () => {
    if (!bbox) return
    setSeedDesign(makeBlankDesign(bbox.w, bbox.h))
    setStep('edit')
  }

  const handlePickTemplate = (design: TrackDesign) => {
    setSeedDesign(design)
    setStep('edit')
  }

  const handleSubmit = (design: TrackDesign) => {
    const token = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`
    try {
      sessionStorage.setItem(SESSION_KEY_PREFIX + token, serializeDesign(design))
    } catch (err) {
      console.error('failed to stash design', err)
    }
    router.push(`/order?customDesignToken=${token}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff' }}>
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
            CUSTOM TRACK DESIGNER
          </span>
          <div style={{ flex: 1 }} />
          <Link
            href="/customize-v2"
            style={{
              padding: '7px 10px',
              border: '1px solid rgba(217,255,67,0.55)',
              color: '#d9ff43',
              fontFamily: 'var(--font-bebas)',
              fontSize: '0.72rem',
              letterSpacing: '0.12em',
              textDecoration: 'none',
            }}
          >
            TRY V2
          </Link>
          <Stepper step={step} onJump={(s) => setStep(s)} hasBbox={bbox !== null} hasSeed={seedDesign !== null} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {step === 'size' && (
          <section>
            <div style={stepLabel}>STEP 1 OF 3</div>
            <h1 style={heading}>CHOOSE A CANVAS SIZE</h1>
            <SizePicker onPick={handleSizePicked} />
          </section>
        )}

        {step === 'template' && bbox && (
          <section>
            <div style={stepLabel}>STEP 2 OF 3 · {bbox.w} × {bbox.h} M</div>
            <h1 style={heading}>PICK A STARTING SHAPE</h1>
            <TemplateGallery
              bboxW={bbox.w}
              bboxH={bbox.h}
              onSelectTemplate={handlePickTemplate}
              onSkip={handleSkipTemplate}
            />
            <div style={{ marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setStep('size')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-dm-sans)',
                  textDecoration: 'underline',
                }}
              >
                Change size
              </button>
            </div>
          </section>
        )}

        {step === 'edit' && seedDesign && bbox && (
          <section>
            <div style={stepLabel}>STEP 3 OF 3 · {bbox.w} × {bbox.h} M</div>
            <h1 style={heading}>SHAPE YOUR TRACK</h1>
            <TrackEditor initialDesign={seedDesign} onSubmit={handleSubmit} />
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setStep('template')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-dm-sans)',
                  textDecoration: 'underline',
                }}
              >
                Pick a different starting shape
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function Stepper({
  step,
  onJump,
  hasBbox,
  hasSeed,
}: {
  step: 'size' | 'template' | 'edit'
  onJump: (s: 'size' | 'template' | 'edit') => void
  hasBbox: boolean
  hasSeed: boolean
}) {
  const items: { key: 'size' | 'template' | 'edit'; label: string; enabled: boolean }[] = [
    { key: 'size', label: 'SIZE', enabled: true },
    { key: 'template', label: 'START', enabled: hasBbox },
    { key: 'edit', label: 'SHAPE', enabled: hasSeed },
  ]
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {items.map((item, i) => (
        <button
          key={item.key}
          type="button"
          disabled={!item.enabled || step === item.key}
          onClick={() => onJump(item.key)}
          style={{
            padding: '6px 10px',
            background: step === item.key ? 'rgba(0,180,216,0.15)' : 'transparent',
            border: `1px solid ${step === item.key ? '#00B4D8' : 'rgba(255,255,255,0.1)'}`,
            color: step === item.key ? '#fff' : item.enabled ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
            fontFamily: 'var(--font-bebas)',
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            cursor: !item.enabled || step === item.key ? 'default' : 'pointer',
          }}
        >
          {i + 1}. {item.label}
        </button>
      ))}
    </div>
  )
}
