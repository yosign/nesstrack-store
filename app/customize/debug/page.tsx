import { TrackPreview } from '@/components/track-design/TrackPath'
import { handcraftedTemplates } from '@/lib/track-design/templates'
import { validateBounds } from '@/lib/track-design/bounds'

export default function DebugPage() {
  const entries = Object.entries(handcraftedTemplates)
  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', padding: '2rem' }}>
      <h1
        style={{
          fontFamily: 'var(--font-bebas)',
          letterSpacing: '0.15em',
          fontSize: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        Track Design — Templates
      </h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {entries.map(([key, t]) => {
          const result = validateBounds(t)
          return (
            <div key={key} style={{ background: '#111', padding: '1rem', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div
                style={{
                  fontFamily: 'var(--font-bebas)',
                  letterSpacing: '0.1em',
                  fontSize: '1rem',
                  marginBottom: 8,
                }}
              >
                {t.displayName}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.45)',
                  marginBottom: 12,
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                {t.bboxW}m × {t.bboxH}m · stroke {t.strokeW}m · {t.closed ? 'closed' : 'open'} · {t.anchors.length} anchors · bounds: {result.ok ? 'ok' : `${result.violations.length} violations`}
              </div>
              <div style={{ aspectRatio: `${t.bboxW} / ${t.bboxH}`, maxHeight: 360 }}>
                <TrackPreview design={t} showGrid showSafeZone isInvalid={!result.ok} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
