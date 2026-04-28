'use client'

import { useRef, useState } from 'react'
import { TrackDesign } from '@/lib/track-design/types'
import { BoundsResult } from '@/lib/track-design/bounds'
import { TrackPath } from './TrackPath'

type DragState = {
  anchorId: string
  pointerId: number
}

export type EditorCanvasProps = {
  design: TrackDesign
  bounds: BoundsResult
  selectedAnchorId: string | null
  onAddAnchor: (x: number, y: number) => void
  onSelectAnchor: (id: string | null) => void
  onDeleteAnchor: (id: string) => void
  onMoveAnchor: (id: string, x: number, y: number) => void
  onMoveAnchorCommit: () => void
}

export function EditorCanvas({
  design,
  bounds,
  selectedAnchorId,
  onAddAnchor,
  onSelectAnchor,
  onDeleteAnchor,
  onMoveAnchor,
  onMoveAnchorCommit,
}: EditorCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragMoved = useRef(false)
  const { bboxW, bboxH, strokeW } = design
  const half = strokeW / 2
  const pad = Math.max(strokeW * 0.5, Math.min(bboxW, bboxH) * 0.04)

  const toLocal = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return null
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const pt = new DOMPoint(clientX, clientY)
    const p = pt.matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  const handleSurfaceDown = (e: React.PointerEvent<SVGRectElement>) => {
    if (e.button !== 0) return
    const p = toLocal(e.clientX, e.clientY)
    if (!p) return
    const x = Math.max(half, Math.min(bboxW - half, p.x))
    const y = Math.max(half, Math.min(bboxH - half, p.y))
    onSelectAnchor(null)
    onAddAnchor(x, y)
  }

  const handleAnchorDown = (id: string, e: React.PointerEvent<SVGGElement>) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ anchorId: id, pointerId: e.pointerId })
    dragMoved.current = false
    onSelectAnchor(id)
  }

  const handleAnchorMove = (e: React.PointerEvent<SVGGElement>) => {
    if (!drag || drag.pointerId !== e.pointerId) return
    const p = toLocal(e.clientX, e.clientY)
    if (!p) return
    const x = Math.max(half, Math.min(bboxW - half, p.x))
    const y = Math.max(half, Math.min(bboxH - half, p.y))
    dragMoved.current = true
    onMoveAnchor(drag.anchorId, x, y)
  }

  const handleAnchorUp = (e: React.PointerEvent<SVGGElement>) => {
    if (!drag || drag.pointerId !== e.pointerId) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (dragMoved.current) onMoveAnchorCommit()
    setDrag(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnchorId) {
      e.preventDefault()
      onDeleteAnchor(selectedAnchorId)
    }
  }

  const violationSet = new Set(bounds.violations.map((v) => v.segmentIndex))

  return (
    <svg
      ref={svgRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      viewBox={`${-pad} ${-pad} ${bboxW + pad * 2} ${bboxH + pad * 2}`}
      style={{
        background: '#0a0a0a',
        display: 'block',
        width: '100%',
        height: '100%',
        userSelect: 'none',
        touchAction: 'none',
        outline: 'none',
      }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern
          id="editor-grid"
          width={Math.max(0.05, Math.min(bboxW, bboxH) / 20)}
          height={Math.max(0.05, Math.min(bboxW, bboxH) / 20)}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${Math.max(0.05, Math.min(bboxW, bboxH) / 20)} 0 L 0 0 0 ${Math.max(0.05, Math.min(bboxW, bboxH) / 20)}`}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={0.003}
          />
        </pattern>
      </defs>

      <rect
        x={0}
        y={0}
        width={bboxW}
        height={bboxH}
        fill="url(#editor-grid)"
        onPointerDown={handleSurfaceDown}
      />

      {half > 0 && bboxW > strokeW && bboxH > strokeW && (
        <rect
          x={half}
          y={half}
          width={bboxW - strokeW}
          height={bboxH - strokeW}
          fill="none"
          stroke="rgba(0,180,216,0.18)"
          strokeWidth={0.005}
          strokeDasharray="0.04 0.04"
          pointerEvents="none"
        />
      )}

      <rect
        x={0}
        y={0}
        width={bboxW}
        height={bboxH}
        fill="none"
        stroke={bounds.ok ? 'rgba(0,180,216,0.6)' : 'rgba(255,77,77,0.6)'}
        strokeWidth={0.006}
        pointerEvents="none"
      />

      <TrackPath design={design} isInvalid={!bounds.ok} />

      {design.anchors.map((a, i) => {
        const isSelected = a.id === selectedAnchorId
        const handleR = Math.max(0.04, strokeW * 0.4)
        return (
          <g
            key={a.id}
            onPointerDown={(e) => handleAnchorDown(a.id, e)}
            onPointerMove={handleAnchorMove}
            onPointerUp={handleAnchorUp}
            onPointerCancel={handleAnchorUp}
            style={{ cursor: 'grab' }}
          >
            <circle
              cx={a.x}
              cy={a.y}
              r={handleR + 0.01}
              fill="rgba(0,0,0,0.4)"
              stroke={isSelected ? '#00B4D8' : 'rgba(255,255,255,0.6)'}
              strokeWidth={isSelected ? 0.012 : 0.006}
            />
            <circle
              cx={a.x}
              cy={a.y}
              r={handleR * 0.45}
              fill={isSelected ? '#00B4D8' : '#fff'}
            />
            <text
              x={a.x}
              y={a.y - handleR - 0.03}
              fontSize={0.06}
              textAnchor="middle"
              fill="rgba(255,255,255,0.6)"
              fontFamily="var(--font-dm-sans)"
              pointerEvents="none"
            >
              {i + 1}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
