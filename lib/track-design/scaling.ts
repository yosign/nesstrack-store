import { TrackDesign } from './types'

export function scaleDesignToBbox(
  src: TrackDesign,
  targetW: number,
  targetH: number,
): TrackDesign {
  const sx = targetW / src.bboxW
  const sy = targetH / src.bboxH
  const s = Math.min(sx, sy)
  const offX = (targetW - src.bboxW * s) / 2
  const offY = (targetH - src.bboxH * s) / 2
  return {
    ...src,
    bboxW: targetW,
    bboxH: targetH,
    strokeW: src.strokeW * s,
    anchors: src.anchors.map((a) => ({
      ...a,
      x: a.x * s + offX,
      y: a.y * s + offY,
      r: a.r * s,
      w: typeof a.w === 'number' ? a.w * s : a.w,
    })),
  }
}
