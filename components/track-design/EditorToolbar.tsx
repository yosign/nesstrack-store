'use client'

export type EditorToolbarProps = {
  closed: boolean
  canUndo: boolean
  canRedo: boolean
  anchorCount: number
  onToggleClosed: () => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
}

const btn = (active = false): React.CSSProperties => ({
  padding: '8px 14px',
  background: active ? 'rgba(0,180,216,0.15)' : '#111',
  border: `1px solid ${active ? '#00B4D8' : 'rgba(255,255,255,0.1)'}`,
  color: active ? '#fff' : 'rgba(255,255,255,0.7)',
  fontFamily: 'var(--font-bebas)',
  letterSpacing: '0.1em',
  fontSize: '0.8rem',
  cursor: 'pointer',
})

const disabledBtn: React.CSSProperties = {
  ...btn(),
  opacity: 0.35,
  cursor: 'not-allowed',
}

export function EditorToolbar({
  closed,
  canUndo,
  canRedo,
  anchorCount,
  onToggleClosed,
  onUndo,
  onRedo,
  onClear,
}: EditorToolbarProps) {
  const canClose = anchorCount >= 3
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={onToggleClosed}
        disabled={!closed && !canClose}
        style={!closed && !canClose ? disabledBtn : btn(closed)}
      >
        {closed ? 'CLOSED LOOP' : 'OPEN PATH'}
      </button>
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        style={canUndo ? btn() : disabledBtn}
      >
        UNDO
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        style={canRedo ? btn() : disabledBtn}
      >
        REDO
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={anchorCount === 0}
        style={anchorCount === 0 ? disabledBtn : btn()}
      >
        CLEAR
      </button>
    </div>
  )
}
