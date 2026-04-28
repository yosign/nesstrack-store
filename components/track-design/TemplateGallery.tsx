'use client'

import { handcraftedTemplates } from '@/lib/track-design/templates'
import { TrackDesign } from '@/lib/track-design/types'
import { scaleDesignToBbox } from '@/lib/track-design/scaling'
import { TrackPreview } from './TrackPath'

export type TemplateGalleryProps = {
  bboxW: number
  bboxH: number
  onSelectTemplate: (design: TrackDesign) => void
  onSkip: () => void
}

const tileBg: React.CSSProperties = {
  background: '#111',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: 12,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  textAlign: 'left',
  color: 'inherit',
  fontFamily: 'inherit',
}

export function TemplateGallery({ bboxW, bboxH, onSelectTemplate, onSkip }: TemplateGalleryProps) {
  const entries = Object.entries(handcraftedTemplates)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          fontSize: '0.78rem',
          color: 'rgba(255,255,255,0.55)',
          fontFamily: 'var(--font-dm-sans)',
          lineHeight: 1.5,
        }}
      >
        Pick a starting shape — anchors will be auto-fit to your {bboxW} × {bboxH} m canvas.
        You can edit anything afterward, or start from a blank canvas.
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={onSkip}
          style={{
            ...tileBg,
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
            background: '#0a0a0a',
            border: '1px dashed rgba(255,255,255,0.2)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '1.2rem',
              letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            START BLANK
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-dm-sans)' }}>
            Begin with an empty canvas
          </div>
        </button>
        {entries.map(([key, t]) => {
          const scaled = scaleDesignToBbox(t, bboxW, bboxH)
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectTemplate({ ...scaled, templateId: key })}
              style={tileBg}
            >
              <div style={{ aspectRatio: `${bboxW} / ${bboxH}`, maxHeight: 220 }}>
                <TrackPreview design={scaled} showFrame />
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-bebas)',
                  letterSpacing: '0.12em',
                  fontSize: '0.95rem',
                }}
              >
                {t.displayName}
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                {scaled.anchors.length} anchors · {t.closed ? 'closed' : 'open'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
