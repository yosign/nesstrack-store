'use client'

import { useState, useMemo } from 'react'
import { tracks } from '@/lib/tracks'
import { extractTrackSize } from '@/lib/types'
import { BBOX_MIN, BBOX_MAX } from '@/lib/track-design/types'

export type SizePickerProps = {
  onPick: (bboxW: number, bboxH: number) => void
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-bebas)',
  fontSize: '0.72rem',
  letterSpacing: '0.2em',
  color: 'rgba(255,255,255,0.4)',
  marginBottom: 12,
}

const presetBtn = (active: boolean): React.CSSProperties => ({
  padding: '14px 12px',
  background: active ? 'rgba(0,180,216,0.15)' : '#111',
  border: `1px solid ${active ? '#00B4D8' : 'rgba(255,255,255,0.1)'}`,
  color: active ? '#fff' : 'rgba(255,255,255,0.7)',
  cursor: 'pointer',
  fontFamily: 'var(--font-bebas)',
  letterSpacing: '0.1em',
  fontSize: '1rem',
})

export function SizePicker({ onPick }: SizePickerProps) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset')
  const [customW, setCustomW] = useState('1.5')
  const [customH, setCustomH] = useState('2.2')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [customError, setCustomError] = useState<string | null>(null)

  const presets = useMemo(() => {
    const seen = new Set<string>()
    const out: { key: string; w: number; h: number }[] = []
    for (const t of tracks) {
      const size = extractTrackSize(t.name)
      const m = size.match(/^(\d+\.?\d*)x(\d+\.?\d*)$/)
      if (!m) continue
      const w = parseFloat(m[1])
      const h = parseFloat(m[2])
      const key = `${w}x${h}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ key, w, h })
    }
    return out.sort((a, b) => a.w * a.h - b.w * b.h)
  }, [])

  const submitCustom = () => {
    const w = parseFloat(customW)
    const h = parseFloat(customH)
    if (!isFinite(w) || !isFinite(h) || w < BBOX_MIN || h < BBOX_MIN || w > BBOX_MAX || h > BBOX_MAX) {
      setCustomError(`Width and height must be between ${BBOX_MIN} and ${BBOX_MAX} m`)
      return
    }
    setCustomError(null)
    onPick(w, h)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => setMode('preset')}
          style={presetBtn(mode === 'preset')}
        >
          PRESET SIZES
        </button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          style={presetBtn(mode === 'custom')}
        >
          CUSTOM SIZE
        </button>
      </div>

      {mode === 'preset' && (
        <div>
          <div style={sectionLabel}>Pick a standard track size</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 8,
            }}
          >
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setSelectedPreset(p.key)
                  onPick(p.w, p.h)
                }}
                style={presetBtn(selectedPreset === p.key)}
              >
                {p.w} × {p.h} M
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'custom' && (
        <div>
          <div style={sectionLabel}>Enter custom dimensions ({BBOX_MIN}–{BBOX_MAX} m)</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="number"
              step="0.1"
              min={BBOX_MIN}
              max={BBOX_MAX}
              value={customW}
              onChange={(e) => setCustomW(e.target.value)}
              style={{
                width: 100,
                background: '#111',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '10px 12px',
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '0.95rem',
              }}
              placeholder="W"
            />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>×</span>
            <input
              type="number"
              step="0.1"
              min={BBOX_MIN}
              max={BBOX_MAX}
              value={customH}
              onChange={(e) => setCustomH(e.target.value)}
              style={{
                width: 100,
                background: '#111',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '10px 12px',
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '0.95rem',
              }}
              placeholder="H"
            />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-dm-sans)' }}>M</span>
            <button type="button" onClick={submitCustom} style={presetBtn(false)}>
              CONTINUE
            </button>
          </div>
          {customError && (
            <div style={{ marginTop: 8, color: '#ff7676', fontSize: '0.8rem', fontFamily: 'var(--font-dm-sans)' }}>
              {customError}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
