import { TrackDesign } from '@/lib/track-design/types'
import { buildRibbon } from '@/lib/track-design/ribbon'
import { maxAnchorWidth } from '@/lib/track-design/geometry'

export type TrackPathProps = {
  design: TrackDesign
  isInvalid?: boolean
  bodyColor?: string
  invalidColor?: string
  curbColor?: string
  centerColor?: string
  /**
   * When true (editor), the rendered ribbon does not absorb pointer events,
   * so clicks fall through to the underlying surface / anchor handles.
   */
  interactive?: boolean
}

export function TrackPath({
  design,
  isInvalid = false,
  bodyColor = '#5e6266',
  invalidColor = '#5a1f1f',
  curbColor = 'rgba(255,255,255,0.95)',
  centerColor = 'rgba(255,255,255,0.85)',
  interactive = false,
}: TrackPathProps) {
  const ribbon = buildRibbon(design)
  if (!ribbon) return null
  const ref = maxAnchorWidth(design)
  // Curb / centerline strokes are physical kerb-paint lines — keep them at a
  // constant ~1 cm regardless of track width, like a real RC mat. Only the
  // dash spacing scales subtly with the design size.
  const curbW = 0.012
  const centerW = 0.008
  const dashUnit = Math.max(0.06, ref * 0.55)
  const dash = `${dashUnit} ${dashUnit * 0.7}`
  const fill = isInvalid ? invalidColor : bodyColor
  const pe = interactive ? 'none' : undefined
  return (
    <g pointerEvents={pe}>
      <path d={ribbon.bodyD} fill={fill} fillRule="evenodd" stroke="none" />
      {ribbon.outerD && (
        <path
          d={ribbon.outerD}
          fill="none"
          stroke={curbColor}
          strokeWidth={curbW}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {ribbon.innerD && (
        <path
          d={ribbon.innerD}
          fill="none"
          stroke={curbColor}
          strokeWidth={curbW}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {ribbon.kerbs.map((k, i) => {
        const kerbStripe = Math.max(0.05, ref * 0.30)
        const kerbW = 0.026
        const baseColor = '#2196d3'
        return (
          <g key={`kerb-${i}`}>
            <path
              d={k.outerD}
              fill="none"
              stroke={baseColor}
              strokeWidth={kerbW}
              strokeLinecap="butt"
              strokeLinejoin="miter"
            />
            <path
              d={k.outerD}
              fill="none"
              stroke="#f5f5f5"
              strokeWidth={kerbW}
              strokeLinecap="butt"
              strokeLinejoin="miter"
              strokeDasharray={`${kerbStripe} ${kerbStripe}`}
            />
            {k.innerD && (
              <>
                <path
                  d={k.innerD}
                  fill="none"
                  stroke={baseColor}
                  strokeWidth={kerbW}
                  strokeLinecap="butt"
                  strokeLinejoin="miter"
                />
                <path
                  d={k.innerD}
                  fill="none"
                  stroke="#f5f5f5"
                  strokeWidth={kerbW}
                  strokeLinecap="butt"
                  strokeLinejoin="miter"
                  strokeDasharray={`${kerbStripe} ${kerbStripe}`}
                />
              </>
            )}
          </g>
        )
      })}
      <path
        d={ribbon.centerD}
        fill="none"
        stroke={centerColor}
        strokeWidth={centerW}
        strokeDasharray={dash}
        strokeLinecap="butt"
        strokeLinejoin="round"
      />
    </g>
  )
}

export type TrackPreviewProps = {
  design: TrackDesign
  showGrid?: boolean
  showFrame?: boolean
  showSafeZone?: boolean
  isInvalid?: boolean
  background?: string
  className?: string
  style?: React.CSSProperties
}

export function TrackPreview({
  design,
  showGrid = false,
  showFrame = true,
  showSafeZone = false,
  isInvalid = false,
  background = '#0d0d0d',
  className,
  style,
}: TrackPreviewProps) {
  const { bboxW, bboxH, strokeW } = design
  const half = strokeW / 2
  const gridSize = Math.max(0.05, Math.min(bboxW, bboxH) / 20)
  const gridId = `grid-${bboxW}-${bboxH}`
  return (
    <svg
      viewBox={`0 0 ${bboxW} ${bboxH}`}
      className={className}
      style={{
        background,
        display: 'block',
        width: '100%',
        height: '100%',
        ...style,
      }}
      preserveAspectRatio="xMidYMid meet"
    >
      {showGrid && (
        <>
          <defs>
            <pattern id={gridId} width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
              <path
                d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={0.003}
              />
            </pattern>
          </defs>
          <rect width={bboxW} height={bboxH} fill={`url(#${gridId})`} />
        </>
      )}
      {showSafeZone && half > 0 && bboxW > strokeW && bboxH > strokeW && (
        <rect
          x={half}
          y={half}
          width={bboxW - strokeW}
          height={bboxH - strokeW}
          fill="none"
          stroke="rgba(0,180,216,0.2)"
          strokeWidth={0.005}
          strokeDasharray="0.04 0.04"
        />
      )}
      <TrackPath design={design} isInvalid={isInvalid} />
      {showFrame && (
        <rect
          x={0}
          y={0}
          width={bboxW}
          height={bboxH}
          fill="none"
          stroke="rgba(0,180,216,0.6)"
          strokeWidth={0.006}
        />
      )}
    </svg>
  )
}
