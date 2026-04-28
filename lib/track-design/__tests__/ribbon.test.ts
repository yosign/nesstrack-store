import { describe, it, expect } from 'vitest'
import { buildRibbon } from '../ribbon'
import { handcraftedTemplates } from '../templates'
import { validateBounds } from '../bounds'

const eps = 1e-6

function dot(ax: number, ay: number, bx: number, by: number): number {
  return ax * bx + ay * by
}

describe('buildRibbon — fold guard', () => {
  for (const [key, t] of Object.entries(handcraftedTemplates)) {
    it(`${key} renders without inner-edge fold`, () => {
      const ribbon = buildRibbon(t)
      expect(ribbon).not.toBeNull()
      if (!ribbon) return
      const { samples, inner, outer } = ribbon
      expect(inner.length).toBe(samples.length)
      expect(outer.length).toBe(samples.length)
      // For each consecutive pair, the displacement should not strongly
      // oppose the local centerline tangent (allowing a small epsilon for
      // the fold-guard collapsed points).
      for (let i = 1; i < inner.length; i++) {
        const dxi = inner[i].x - inner[i - 1].x
        const dyi = inner[i].y - inner[i - 1].y
        const dxo = outer[i].x - outer[i - 1].x
        const dyo = outer[i].y - outer[i - 1].y
        const t = samples[i].t
        expect(dot(dxi, dyi, t.x, t.y)).toBeGreaterThanOrEqual(-eps)
        expect(dot(dxo, dyo, t.x, t.y)).toBeGreaterThanOrEqual(-eps)
      }
    })

    it(`${key} stays within bounds`, () => {
      const result = validateBounds(t)
      expect(result.ok).toBe(true)
    })
  }
})

describe('buildRibbon — width variation', () => {
  it('highway template shows clear width variation across samples', () => {
    const ribbon = buildRibbon(handcraftedTemplates.highway)
    expect(ribbon).not.toBeNull()
    if (!ribbon) return
    let minW = Infinity
    let maxW = -Infinity
    for (const s of ribbon.samples) {
      if (s.w < minW) minW = s.w
      if (s.w > maxW) maxW = s.w
    }
    expect(maxW / minW).toBeGreaterThan(1.4)
  })

  it('drift-snake template shows clear width variation across samples', () => {
    const ribbon = buildRibbon(handcraftedTemplates['drift-snake'])
    expect(ribbon).not.toBeNull()
    if (!ribbon) return
    let minW = Infinity
    let maxW = -Infinity
    for (const s of ribbon.samples) {
      if (s.w < minW) minW = s.w
      if (s.w > maxW) maxW = s.w
    }
    expect(maxW / minW).toBeGreaterThan(1.3)
  })
})
