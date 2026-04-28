'use client'

import { useReducer, useMemo, useCallback, useEffect, useRef } from 'react'
import { TrackDesign } from '@/lib/track-design/types'
import { validateBounds } from '@/lib/track-design/bounds'
import { EditorCanvas } from './EditorCanvas'
import { EditorToolbar } from './EditorToolbar'
import { EditorSidebar } from './EditorSidebar'
import {
  reducer,
  makeInitialState,
  appendAnchor,
  moveAnchor as moveAnchorState,
  deleteAnchor,
  setAnchorRadius,
  setStrokeW,
  toggleClosed,
  clearAnchors,
} from './editor-state'

export type TrackEditorProps = {
  initialDesign: TrackDesign
  onSubmit: (design: TrackDesign) => void
  submitLabel?: string
}

export function TrackEditor({ initialDesign, onSubmit, submitLabel = 'USE THIS DESIGN' }: TrackEditorProps) {
  const [state, dispatch] = useReducer(reducer, initialDesign, makeInitialState)
  const design = state.present
  const bounds = useMemo(() => validateBounds(design), [design])
  const txSnapshot = useRef<TrackDesign | null>(null)

  const commit = useCallback((next: TrackDesign) => dispatch({ type: 'commit', next }), [])

  const replaceInTx = useCallback(
    (next: TrackDesign) => {
      if (!txSnapshot.current) txSnapshot.current = design
      dispatch({ type: 'replace', next })
    },
    [design],
  )

  const endTx = useCallback(() => {
    const snap = txSnapshot.current
    if (!snap) return
    txSnapshot.current = null
    dispatch({ type: 'commit-transaction', snapshot: snap, next: design })
  }, [design])

  const handleAddAnchor = useCallback(
    (x: number, y: number) => {
      commit(appendAnchor(design, x, y, design.strokeW * 1.5))
    },
    [commit, design],
  )

  const handleSelect = useCallback((id: string | null) => dispatch({ type: 'select', id }), [])

  const handleDelete = useCallback(
    (id: string) => {
      commit(deleteAnchor(design, id))
      if (state.selectedAnchorId === id) dispatch({ type: 'select', id: null })
    },
    [commit, design, state.selectedAnchorId],
  )

  const handleMove = useCallback(
    (id: string, x: number, y: number) => {
      replaceInTx(moveAnchorState(design, id, x, y))
    },
    [replaceInTx, design],
  )

  const handleToggleClosed = useCallback(() => {
    commit(toggleClosed(design))
  }, [commit, design])

  const handleUndo = useCallback(() => dispatch({ type: 'undo' }), [])
  const handleRedo = useCallback(() => dispatch({ type: 'redo' }), [])

  const handleClear = useCallback(() => {
    commit(clearAnchors(design))
    dispatch({ type: 'select', id: null })
  }, [commit, design])

  const handleSetStrokeW = useCallback(
    (w: number) => {
      replaceInTx(setStrokeW(design, w))
    },
    [replaceInTx, design],
  )

  const handleSetSelectedRadius = useCallback(
    (r: number) => {
      if (!state.selectedAnchorId) return
      replaceInTx(setAnchorRadius(design, state.selectedAnchorId, r))
    },
    [replaceInTx, design, state.selectedAnchorId],
  )

  const handleDeleteSelected = useCallback(() => {
    if (state.selectedAnchorId) handleDelete(state.selectedAnchorId)
  }, [handleDelete, state.selectedAnchorId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleUndo, handleRedo])

  const minNeeded = design.closed ? 3 : 2
  const submitDisabled = !bounds.ok || design.anchors.length < minNeeded

  return (
    <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 lg:items-stretch flex flex-col gap-8">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <EditorToolbar
          closed={design.closed}
          canUndo={state.past.length > 0}
          canRedo={state.future.length > 0}
          anchorCount={design.anchors.length}
          onToggleClosed={handleToggleClosed}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
        />
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.08)',
            aspectRatio: `${design.bboxW} / ${design.bboxH}`,
            maxHeight: '70vh',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <EditorCanvas
            design={design}
            bounds={bounds}
            selectedAnchorId={state.selectedAnchorId}
            onAddAnchor={handleAddAnchor}
            onSelectAnchor={handleSelect}
            onDeleteAnchor={handleDelete}
            onMoveAnchor={handleMove}
            onMoveAnchorCommit={endTx}
          />
        </div>
        <div
          style={{
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--font-dm-sans)',
            lineHeight: 1.6,
          }}
        >
          {design.anchors.length === 0
            ? 'Click anywhere on the canvas to drop the first anchor.'
            : 'Click empty space to add anchor · drag anchors to move · click to select · Delete to remove.'}
        </div>
      </div>
      <EditorSidebar
        design={design}
        bounds={bounds}
        selectedAnchorId={state.selectedAnchorId}
        onSetStrokeW={handleSetStrokeW}
        onCommit={endTx}
        onSetSelectedRadius={handleSetSelectedRadius}
        onDeleteSelected={handleDeleteSelected}
        onSubmit={() => onSubmit(design)}
        submitLabel={submitLabel}
        submitDisabled={submitDisabled}
      />
    </div>
  )
}
