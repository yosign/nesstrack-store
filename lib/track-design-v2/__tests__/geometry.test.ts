import { describe, expect, it } from 'vitest'
import { boundaryPathD, canonicalSurface, translateBoundary, validateTrackDocument } from '../geometry'
import { createV2Template, V2TemplateId, V2_TEMPLATES } from '../templates'

describe('track design V2 region geometry', () => {
  it.each(Object.keys(V2_TEMPLATES) as V2TemplateId[])('validates the %s template', (templateId) => {
    const document = createV2Template(templateId)
    const result = validateTrackDocument(document)

    expect(result.valid).toBe(true)
    expect(result.issues.filter((issue) => issue.severity === 'error')).toEqual([])
    expect(result.asphaltArea).toBeGreaterThan(0)
    expect(canonicalSurface(document).length).toBe(document.paths.length + 1)
  })

  it('detects overlapping independent islands', () => {
    const document = createV2Template('eight')
    document.paths[1] = translateBoundary(document.paths[1], 0, -1.55)

    const result = validateTrackDocument(document)

    expect(result.valid).toBe(false)
    expect(result.issues.some((issue) => issue.message.includes('重叠'))).toBe(true)
  })

  it('renders editable boundaries as closed cubic paths', () => {
    const path = createV2Template('technical').paths[0]
    const svgPath = boundaryPathD(path)

    expect(svgPath.startsWith('M ')).toBe(true)
    expect(svgPath).toContain(' C ')
    expect(svgPath.endsWith(' Z')).toBe(true)
  })
})
