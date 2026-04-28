import { TrackDesign, Anchor, STROKE_W_MIN, STROKE_W_MAX } from '@/lib/track-design/types'
import { clampAnchorRadii } from '@/lib/track-design/geometry'

const MAX_HISTORY = 80

export type EditorState = {
  past: TrackDesign[]
  present: TrackDesign
  future: TrackDesign[]
  selectedAnchorId: string | null
}

export type EditorAction =
  | { type: 'commit'; next: TrackDesign }
  | { type: 'commit-transaction'; snapshot: TrackDesign; next: TrackDesign }
  | { type: 'replace'; next: TrackDesign }
  | { type: 'select'; id: string | null }
  | { type: 'undo' }
  | { type: 'redo' }

export function makeInitialState(design: TrackDesign): EditorState {
  return { past: [], present: design, future: [], selectedAnchorId: null }
}

export function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'commit': {
      if (designsEqual(state.present, action.next)) return state
      const past = [...state.past, state.present].slice(-MAX_HISTORY)
      return { past, present: action.next, future: [], selectedAnchorId: state.selectedAnchorId }
    }
    case 'commit-transaction': {
      if (designsEqual(action.snapshot, action.next)) {
        return { ...state, present: action.next }
      }
      const past = [...state.past, action.snapshot].slice(-MAX_HISTORY)
      return { past, present: action.next, future: [], selectedAnchorId: state.selectedAnchorId }
    }
    case 'replace':
      return { ...state, present: action.next }
    case 'select':
      return { ...state, selectedAnchorId: action.id }
    case 'undo': {
      if (state.past.length === 0) return state
      const past = state.past.slice(0, -1)
      const present = state.past[state.past.length - 1]
      return { past, present, future: [state.present, ...state.future], selectedAnchorId: state.selectedAnchorId }
    }
    case 'redo': {
      if (state.future.length === 0) return state
      const [present, ...future] = state.future
      return { past: [...state.past, state.present], present, future, selectedAnchorId: state.selectedAnchorId }
    }
  }
}

function designsEqual(a: TrackDesign, b: TrackDesign): boolean {
  if (a.closed !== b.closed) return false
  if (a.strokeW !== b.strokeW) return false
  if (a.bboxW !== b.bboxW || a.bboxH !== b.bboxH) return false
  if (a.anchors.length !== b.anchors.length) return false
  for (let i = 0; i < a.anchors.length; i++) {
    const x = a.anchors[i]
    const y = b.anchors[i]
    if (x.id !== y.id || x.x !== y.x || x.y !== y.y || x.r !== y.r) return false
  }
  return true
}

let anchorCounter = 0
export function nextAnchorId(): string {
  anchorCounter += 1
  return `a-${Date.now().toString(36)}-${anchorCounter}`
}

export function withClampedRadii(design: TrackDesign): TrackDesign {
  return { ...design, anchors: clampAnchorRadii(design.anchors, design.closed) }
}

export function appendAnchor(design: TrackDesign, x: number, y: number, defaultR: number): TrackDesign {
  const anchors: Anchor[] = [...design.anchors, { id: nextAnchorId(), x, y, r: defaultR }]
  return withClampedRadii({ ...design, anchors })
}

export function insertAnchorAfter(
  design: TrackDesign,
  afterIndex: number,
  x: number,
  y: number,
  defaultR: number,
): TrackDesign {
  const anchors = [...design.anchors]
  anchors.splice(afterIndex + 1, 0, { id: nextAnchorId(), x, y, r: defaultR })
  return withClampedRadii({ ...design, anchors })
}

export function moveAnchor(design: TrackDesign, id: string, x: number, y: number): TrackDesign {
  const anchors = design.anchors.map((a) => (a.id === id ? { ...a, x, y } : a))
  return withClampedRadii({ ...design, anchors })
}

export function deleteAnchor(design: TrackDesign, id: string): TrackDesign {
  const anchors = design.anchors.filter((a) => a.id !== id)
  const minNeeded = design.closed ? 3 : 2
  if (anchors.length < minNeeded) {
    return withClampedRadii({ ...design, anchors, closed: false })
  }
  return withClampedRadii({ ...design, anchors })
}

export function setAnchorRadius(design: TrackDesign, id: string, r: number): TrackDesign {
  const anchors = design.anchors.map((a) => (a.id === id ? { ...a, r: Math.max(0, r) } : a))
  return withClampedRadii({ ...design, anchors })
}

export function setStrokeW(design: TrackDesign, w: number): TrackDesign {
  const clamped = Math.max(STROKE_W_MIN, Math.min(STROKE_W_MAX, w))
  return { ...design, strokeW: clamped }
}

export function toggleClosed(design: TrackDesign): TrackDesign {
  if (!design.closed && design.anchors.length < 3) return design
  return withClampedRadii({ ...design, closed: !design.closed })
}

export function clearAnchors(design: TrackDesign): TrackDesign {
  return { ...design, anchors: [], closed: false }
}
