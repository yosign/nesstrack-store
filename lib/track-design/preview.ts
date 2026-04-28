import { TrackDesign } from './types'
import { buildRibbon } from './ribbon'
import { maxAnchorWidth } from './geometry'

export type PreviewOptions = {
  width?: number
  height?: number
  background?: string
  bodyColor?: string
  curbColor?: string
  centerColor?: string
}

export function buildPreviewSvgString(design: TrackDesign, opts: PreviewOptions = {}): string {
  const { bboxW, bboxH } = design
  const background = opts.background ?? '#0d0d0d'
  const bodyColor = opts.bodyColor ?? '#3a3a3a'
  const curbColor = opts.curbColor ?? 'rgba(255,255,255,0.85)'
  const centerColor = opts.centerColor ?? 'rgba(255,255,255,0.55)'
  const ribbon = buildRibbon(design)
  const ref = maxAnchorWidth(design)
  const curbW = Math.max(0.005, ref * 0.05)
  const centerW = Math.max(0.004, ref * 0.04)
  const dash = `${ref * 0.6} ${ref * 0.45}`
  const layers: string[] = []
  if (ribbon) {
    layers.push(
      `<path d="${ribbon.bodyD}" fill="${bodyColor}" fill-rule="evenodd" stroke="none"/>`,
    )
    if (ribbon.outerD) {
      layers.push(
        `<path d="${ribbon.outerD}" fill="none" stroke="${curbColor}" stroke-width="${curbW}" stroke-linejoin="round" stroke-linecap="round"/>`,
      )
    }
    if (ribbon.innerD) {
      layers.push(
        `<path d="${ribbon.innerD}" fill="none" stroke="${curbColor}" stroke-width="${curbW}" stroke-linejoin="round" stroke-linecap="round"/>`,
      )
    }
    layers.push(
      `<path d="${ribbon.centerD}" fill="none" stroke="${centerColor}" stroke-width="${centerW}" stroke-dasharray="${dash}" stroke-linecap="butt" stroke-linejoin="round"/>`,
    )
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${bboxW} ${bboxH}" preserveAspectRatio="xMidYMid meet">
  <rect x="0" y="0" width="${bboxW}" height="${bboxH}" fill="${background}"/>
  ${layers.join('\n  ')}
</svg>`
}

export async function renderPreviewPng(
  design: TrackDesign,
  opts: PreviewOptions = {},
): Promise<Blob> {
  if (typeof document === 'undefined') {
    throw new Error('renderPreviewPng must run in the browser')
  }
  const { bboxW, bboxH } = design
  const target = sizeWithAspect(opts.width ?? 1024, opts.height ?? 768, bboxW / bboxH)
  const svgString = buildPreviewSvgString(design, opts)
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('failed to load svg image'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = target.w
    canvas.height = target.h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas 2d context unavailable')
    ctx.fillStyle = opts.background ?? '#0d0d0d'
    ctx.fillRect(0, 0, target.w, target.h)
    ctx.drawImage(img, 0, 0, target.w, target.h)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))), 'image/png')
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function sizeWithAspect(maxW: number, maxH: number, aspect: number): { w: number; h: number } {
  if (maxW / maxH > aspect) {
    return { w: Math.round(maxH * aspect), h: maxH }
  }
  return { w: maxW, h: Math.round(maxW / aspect) }
}
