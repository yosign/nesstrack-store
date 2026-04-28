'use client'

import { useRef, useState } from 'react'
import { TrackDesign } from '@/lib/track-design/types'
import { BoundsResult } from '@/lib/track-design/bounds'
import { maxAnchorWidth } from '@/lib/track-design/geometry'
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
  const { bboxW, bboxH } = design
  const halfMax = maxAnchorWidth(design) / 2
  const dim = Math.min(bboxW, bboxH)
  const padOuter = Math.max(dim * 0.12, 0.18)

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
    const x = Math.max(halfMax, Math.min(bboxW - halfMax, p.x))
    const y = Math.max(halfMax, Math.min(bboxH - halfMax, p.y))
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
    const x = Math.max(halfMax, Math.min(bboxW - halfMax, p.x))
    const y = Math.max(halfMax, Math.min(bboxH - halfMax, p.y))
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

  const dimensionFontSize = Math.max(0.06, dim * 0.04)
  const tickLen = Math.max(0.03, dim * 0.02)
  const dimLineColor = bounds.ok ? 'rgba(0,180,216,0.55)' : 'rgba(255,77,77,0.7)'
  const dimTextColor = bounds.ok ? 'rgba(255,255,255,0.75)' : '#ff9b9b'
  const handleR = Math.max(0.04, halfMax * 0.5)

  return (
    <svg
      ref={svgRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      viewBox={`${-padOuter} ${-padOuter} ${bboxW + padOuter * 2} ${bboxH + padOuter * 2}`}
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

      {/* Top dimension ruler */}
      <g pointerEvents="none">
        <line
          x1={0}
          y1={-padOuter * 0.55}
          x2={bboxW}
          y2={-padOuter * 0.55}
          stroke={dimLineColor}
          strokeWidth={0.005}
        />
        <line
          x1={0}
          y1={-padOuter * 0.55 - tickLen}
          x2={0}
          y2={-padOuter * 0.55 + tickLen}
          stroke={dimLineColor}
          strokeWidth={0.005}
        />
        <line
          x1={bboxW}
          y1={-padOuter * 0.55 - tickLen}
          x2={bboxW}
          y2={-padOuter * 0.55 + tickLen}
          stroke={dimLineColor}
          strokeWidth={0.005}
        />
        <text
          x={bboxW / 2}
          y={-padOuter * 0.55 - tickLen * 1.4}
          fontSize={dimensionFontSize}
          textAnchor="middle"
          fill={dimTextColor}
          fontFamily="var(--font-bebas)"
          letterSpacing="0.08em"
        >
          {bboxW.toFixed(2)} M
        </text>
      </g>

      {/* Left dimension ruler */}
      <g pointerEvents="none">
        <line
          x1={-padOuter * 0.55}
          y1={0}
          x2={-padOuter * 0.55}
          y2={bboxH}
          stroke={dimLineColor}
          strokeWidth={0.005}
        />
        <line
          x1={-padOuter * 0.55 - tickLen}
          y1={0}
          x2={-padOuter * 0.55 + tickLen}
          y2={0}
          stroke={dimLineColor}
          strokeWidth={0.005}
        />
        <line
          x1={-padOuter * 0.55 - tickLen}
          y1={bboxH}
          x2={-padOuter * 0.55 + tickLen}
          y2={bboxH}
          stroke={dimLineColor}
          strokeWidth={0.005}
        />
        <text
          x={-padOuter * 0.55 - tickLen * 1.4}
          y={bboxH / 2}
          fontSize={dimensionFontSize}
          textAnchor="middle"
          fill={dimTextColor}
          fontFamily="var(--font-bebas)"
          letterSpacing="0.08em"
          transform={`rotate(-90 ${-padOuter * 0.55 - tickLen * 1.4} ${bboxH / 2})`}
        >
          {bboxH.toFixed(2)} M
        </text>
      </g>

      <TrackPath design={design} isInvalid={!bounds.ok} interactive />

      {design.anchors.map((a, i) => {
        const isSelected = a.id === selectedAnchorId
        const hitR = Math.max(handleR + 0.01, halfMax + 0.04)
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
              r={hitR}
              fill="rgba(0,0,0,0)"
              stroke="none"
            />
            <circle
              cx={a.x}
              cy={a.y}
              r={handleR + 0.01}
              fill="rgba(0,0,0,0.55)"
              stroke={isSelected ? '#00B4D8' : 'rgba(255,255,255,0.85)'}
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
              y={a.y - hitR - 0.02}
              fontSize={0.06}
              textAnchor="middle"
              fill="rgba(255,255,255,0.75)"
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
