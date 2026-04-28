'use client'

import {
  TrackDesign,
  STROKE_W_MIN,
  STROKE_W_MAX,
  ANCHOR_W_MIN,
  ANCHOR_W_MAX,
} from '@/lib/track-design/types'
import {
  getMaxFilletRadius,
  safeMaxWidthAt,
  widthAt,
} from '@/lib/track-design/geometry'
import { BoundsResult, maxStrokeForDesign } from '@/lib/track-design/bounds'

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-bebas)',
  fontSize: '0.7rem',
  letterSpacing: '0.18em',
  color: 'rgba(255,255,255,0.4)',
  marginBottom: 10,
}

const valueText: React.CSSProperties = {
  fontFamily: 'var(--font-bebas)',
  fontSize: '1rem',
  letterSpacing: '0.08em',
  color: '#fff',
}

const ghostBtn: React.CSSProperties = {
  padding: '4px 10px',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.18)',
  color: 'rgba(255,255,255,0.7)',
  fontFamily: 'var(--font-bebas)',
  letterSpacing: '0.1em',
  fontSize: '0.7rem',
  cursor: 'pointer',
}

export type EditorSidebarProps = {
  design: TrackDesign
  bounds: BoundsResult
  selectedAnchorId: string | null
  onSetStrokeW: (w: number) => void
  onCommit: () => void
  onSetSelectedRadius: (r: number) => void
  onResetSelectedRadius: () => void
  onSetSelectedWidth: (w: number) => void
  onResetSelectedWidth: () => void
  onDeleteSelected: () => void
  onSubmit: () => void
  submitLabel: string
  submitDisabled: boolean
}

export function EditorSidebar({
  design,
  bounds,
  selectedAnchorId,
  onSetStrokeW,
  onCommit,
  onSetSelectedRadius,
  onResetSelectedRadius,
  onSetSelectedWidth,
  onResetSelectedWidth,
  onDeleteSelected,
  onSubmit,
  submitLabel,
  submitDisabled,
}: EditorSidebarProps) {
  const selected = design.anchors.find((a) => a.id === selectedAnchorId) ?? null
  const selectedIndex = selected ? design.anchors.findIndex((a) => a.id === selected.id) : -1
  const maxR = selected
    ? getMaxFilletRadius(design.anchors, selectedIndex, design.closed)
    : 0
  const cappedMaxR = Math.min(maxR, Math.max(design.bboxW, design.bboxH) / 2)
  const headroomStroke = maxStrokeForDesign(design)
  const strokeMaxAvail = Math.min(STROKE_W_MAX, headroomStroke || STROKE_W_MAX)
  const selectedW = selected ? widthAt(selected, design) : 0
  const selectedWidthIsAuto = selected ? !!selected.wAuto || typeof selected.w !== 'number' : false
  const selectedRadiusIsAuto = selected ? !!selected.rAuto : false
  const selectedSafeW = selected
    ? safeMaxWidthAt(design.anchors, selectedIndex, design.closed)
    : ANCHOR_W_MAX
  const widthIsClamped = selected ? selectedW > selectedSafeW + 1e-4 : false
  const effectiveSelectedW = Math.min(selectedW, selectedSafeW)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <section>
        <div style={sectionLabel}>TRACK WIDTH</div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 8,
          }}
        >
          <span style={valueText}>{(design.strokeW * 100).toFixed(1)} CM</span>
          <span
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            max {(strokeMaxAvail * 100).toFixed(1)} cm
          </span>
        </div>
        <input
          type="range"
          min={STROKE_W_MIN}
          max={STROKE_W_MAX}
          step={0.005}
          value={design.strokeW}
          onChange={(e) => onSetStrokeW(parseFloat(e.target.value))}
          onPointerUp={onCommit}
          onKeyUp={onCommit}
          style={{ width: '100%', accentColor: '#00B4D8' }}
        />
        <div
          style={{
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.35)',
            fontFamily: 'var(--font-dm-sans)',
            marginTop: 4,
          }}
        >
          Scales the entire track. Per-anchor widths below override locally.
        </div>
      </section>

      <section>
        <div style={sectionLabel}>SELECTED ANCHOR</div>
        {selected ? (
          <>
            <div style={{ marginBottom: 12, ...valueText }}>
              ANCHOR #{selectedIndex + 1}
              <span
                style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: 0,
                  marginLeft: 8,
                }}
              >
                ({selected.x.toFixed(2)}, {selected.y.toFixed(2)})
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>track width</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={valueText}>
                  {(selectedW * 100).toFixed(1)} CM{selectedWidthIsAuto ? ' · AUTO' : ''}
                </span>
                {!selectedWidthIsAuto && (
                  <button type="button" onClick={onResetSelectedWidth} style={ghostBtn}>
                    AUTO
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min={ANCHOR_W_MIN}
              max={ANCHOR_W_MAX}
              step={0.005}
              value={Math.min(ANCHOR_W_MAX, Math.max(ANCHOR_W_MIN, selectedW))}
              onChange={(e) => onSetSelectedWidth(parseFloat(e.target.value))}
              onPointerUp={onCommit}
              onKeyUp={onCommit}
              style={{ width: '100%', accentColor: '#00B4D8' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 4,
                fontSize: '0.65rem',
                fontFamily: 'var(--font-dm-sans)',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              <span>Max here: {(selectedSafeW * 100).toFixed(1)} cm</span>
              {widthIsClamped && (
                <span
                  style={{
                    padding: '2px 6px',
                    background: 'rgba(255,176,0,0.12)',
                    border: '1px solid rgba(255,176,0,0.45)',
                    color: '#ffb964',
                    letterSpacing: '0.05em',
                  }}
                >
                  clamped to {(effectiveSelectedW * 100).toFixed(1)} cm
                </span>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginTop: 14,
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>fillet radius</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={valueText}>
                  {(selected.r * 100).toFixed(1)} CM{selectedRadiusIsAuto ? ' · AUTO' : ''}
                </span>
                {!selectedRadiusIsAuto && (
                  <button type="button" onClick={onResetSelectedRadius} style={ghostBtn}>
                    AUTO
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0.001, cappedMaxR)}
              step={0.005}
              value={Math.min(selected.r, cappedMaxR)}
              onChange={(e) => onSetSelectedRadius(parseFloat(e.target.value))}
              onPointerUp={onCommit}
              onKeyUp={onCommit}
              disabled={cappedMaxR <= 0}
              style={{ width: '100%', accentColor: '#00B4D8' }}
            />

            <button
              type="button"
              onClick={onDeleteSelected}
              style={{
                marginTop: 14,
                padding: '8px 14px',
                background: '#111',
                border: '1px solid rgba(255,77,77,0.4)',
                color: '#ff7676',
                fontFamily: 'var(--font-bebas)',
                letterSpacing: '0.12em',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              DELETE ANCHOR
            </button>
          </>
        ) : (
          <div
            style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Click an anchor to edit its width and fillet.
          </div>
        )}
      </section>

      <section>
        <div style={sectionLabel}>STATUS</div>
        <div
          style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '0.78rem',
            color: bounds.ok ? 'rgba(255,255,255,0.55)' : '#ff7676',
            lineHeight: 1.5,
          }}
        >
          {bounds.ok
            ? `${design.anchors.length} anchor${design.anchors.length === 1 ? '' : 's'} · ${design.closed ? 'closed' : 'open'} · within bounds`
            : `${bounds.violations.length} bounds violation${bounds.violations.length === 1 ? '' : 's'} — reduce widths or move anchors inward`}
        </div>
      </section>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitDisabled}
        style={{
          height: 48,
          background: '#00B4D8',
          color: '#000',
          fontFamily: 'var(--font-bebas)',
          fontSize: '1rem',
          letterSpacing: '0.12em',
          border: 'none',
          cursor: submitDisabled ? 'not-allowed' : 'pointer',
          opacity: submitDisabled ? 0.4 : 1,
        }}
      >
        {submitLabel}
      </button>
    </div>
  )
}
