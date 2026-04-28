import { describe, it, expect } from 'vitest'
import { serializeDesign, parseDesign, DesignParseError } from '../serialize'
import { TRACK_DESIGN_VERSION, TrackDesign } from '../types'

const sample: TrackDesign = {
  version: TRACK_DESIGN_VERSION,
  bboxW: 1.5,
  bboxH: 2.2,
  strokeW: 0.18,
  closed: true,
  anchors: [
    { id: 'a', x: 0.3, y: 0.3, r: 0.15 },
    { id: 'b', x: 1.2, y: 0.3, r: 0.15 },
    { id: 'c', x: 1.2, y: 1.9, r: 0.15 },
    { id: 'd', x: 0.3, y: 1.9, r: 0.15 },
  ],
  templateId: 'track-12',
}

describe('serializeDesign / parseDesign', () => {
  it('round-trips', () => {
    const json = serializeDesign(sample)
    const parsed = parseDesign(json)
    expect(parsed).toEqual(sample)
  })

  it('rejects wrong version', () => {
    const bad = { ...sample, version: 99 }
    expect(() => parseDesign(bad)).toThrow(DesignParseError)
  })

  it('rejects bbox out of range', () => {
    const bad = { ...sample, bboxW: 10 }
    expect(() => parseDesign(bad)).toThrow(DesignParseError)
  })

  it('rejects closed path with too few anchors', () => {
    const bad = { ...sample, anchors: sample.anchors.slice(0, 2) }
    expect(() => parseDesign(bad)).toThrow(DesignParseError)
  })

  it('rejects invalid JSON string', () => {
    expect(() => parseDesign('{not json')).toThrow(DesignParseError)
  })
})
