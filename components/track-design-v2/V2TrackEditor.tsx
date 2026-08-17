'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Copy, Download, Eye, EyeOff, Redo2, RotateCw, Save, Trash2, Undo2 } from 'lucide-react'
import {
  BoundaryModuleKind,
  createBoundaryModule,
  createMarking,
  createV2Template,
  V2_TEMPLATES,
  V2TemplateId,
} from '@/lib/track-design-v2/templates'
import {
  boundaryPathD,
  boundarySegmentD,
  rotateBoundary,
  scaleBoundary,
  translateBoundary,
  validateTrackDocument,
} from '@/lib/track-design-v2/geometry'
import { BoundaryPathV2, MarkingKindV2, PointV2, TrackDocumentV2 } from '@/lib/track-design-v2/types'
import styles from './V2TrackEditor.module.css'

type EditorMode = 'simple' | 'advanced'
type HistoryState = { past: TrackDocumentV2[]; present: TrackDocumentV2; future: TrackDocumentV2[] }
type DragState = {
  pointerId: number
  boundaryId: string
  nodeIndex?: number
  start: PointV2
  originalPath: BoundaryPathV2
  originalDocument: TrackDocumentV2
}

const clone = <T,>(value: T): T => structuredClone(value)

function routePath(points: PointV2[], closed: boolean) {
  if (points.length === 0) return ''
  return `M ${points.map((point) => `${point.x} ${point.y}`).join(' L ')}${closed ? ' Z' : ''}`
}

export function V2TrackEditor() {
  const [templateId, setTemplateId] = useState<V2TemplateId>('technical')
  const [history, setHistory] = useState<HistoryState>({ past: [], present: createV2Template('technical'), future: [] })
  const [mode, setMode] = useState<EditorMode>('simple')
  const [selectedBoundaryId, setSelectedBoundaryId] = useState<string | null>('island-top')
  const [showDriveRoute, setShowDriveRoute] = useState(false)
  const [saved, setSaved] = useState(false)

  const document = history.present
  const validation = useMemo(() => validateTrackDocument(document), [document])
  const selectedBoundary = document.paths.find((path) => path.id === selectedBoundaryId) ?? null

  const commit = (next: TrackDocumentV2) => {
    setHistory((current) => ({ past: [...current.past.slice(-59), clone(current.present)], present: next, future: [] }))
    setSaved(false)
  }
  const replace = (next: TrackDocumentV2) => {
    setHistory((current) => ({ ...current, present: next }))
    setSaved(false)
  }
  const checkpoint = (previous: TrackDocumentV2) => {
    setHistory((current) => ({ past: [...current.past.slice(-59), previous], present: current.present, future: [] }))
  }
  const undo = () => setHistory((current) => {
    const previous = current.past.at(-1)
    if (!previous) return current
    return { past: current.past.slice(0, -1), present: previous, future: [clone(current.present), ...current.future] }
  })
  const redo = () => setHistory((current) => {
    const next = current.future[0]
    if (!next) return current
    return { past: [...current.past, clone(current.present)], present: next, future: current.future.slice(1) }
  })

  const selectTemplate = (id: V2TemplateId) => {
    const next = createV2Template(id)
    setTemplateId(id)
    commit(next)
    setSelectedBoundaryId(next.paths[0]?.id ?? null)
  }

  const updateBoundary = (boundaryId: string, transform: (path: BoundaryPathV2) => BoundaryPathV2, shouldCommit = true) => {
    const next = clone(document)
    next.paths = next.paths.map((path) => path.id === boundaryId ? transform(path) : path)
    if (shouldCommit) commit(next)
    else replace(next)
  }

  const addBoundary = (kind: BoundaryModuleKind) => {
    const next = clone(document)
    const added = createBoundaryModule(kind, next)
    next.paths.push(added)
    next.regions[0].holes.push(added.id)
    commit(next)
    setSelectedBoundaryId(added.id)
  }

  const addMarking = (kind: MarkingKindV2) => {
    const next = clone(document)
    next.markings.push(createMarking(kind, next))
    commit(next)
  }

  const deleteSelected = () => {
    if (!selectedBoundary) return
    const next = clone(document)
    next.paths = next.paths.filter((path) => path.id !== selectedBoundary.id)
    next.regions = next.regions.map((region) => ({ ...region, holes: region.holes.filter((id) => id !== selectedBoundary.id) }))
    commit(next)
    setSelectedBoundaryId(next.paths[0]?.id ?? null)
  }

  const duplicateSelected = () => {
    if (!selectedBoundary) return
    const next = clone(document)
    const copy = translateBoundary(clone(selectedBoundary), 0.12, 0.12)
    copy.id = `${selectedBoundary.id}-copy-${Date.now().toString(36)}`
    copy.name = `${selectedBoundary.name} 副本`
    next.paths.push(copy)
    next.regions[0].holes.push(copy.id)
    commit(next)
    setSelectedBoundaryId(copy.id)
  }

  const savePrototype = () => {
    localStorage.setItem('nessrc:track-design-v2:prototype', JSON.stringify(document))
    setSaved(true)
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ ...document, derived: validation }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = `${document.name.toLowerCase().replace(/\s+/g, '-')}-v2.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand}>
          <Image src="/images/Logo.png" alt="NessRC" width={480} height={221} priority />
          <span className={styles.prototypeTag}>V2 PROTOTYPE</span>
        </Link>
        <div className={styles.titleBlock}>
          <div className={styles.eyebrow}>REGION / BOUNDARY NETWORK EDITOR</div>
          <div className={styles.title} data-testid="document-title">{document.name}</div>
        </div>
        <div className={styles.topSpacer} />
        <div className={styles.modeSwitch} aria-label="编辑模式">
          <button data-testid="mode-simple" className={`${styles.modeButton} ${mode === 'simple' ? styles.modeButtonActive : ''}`} onClick={() => setMode('simple')}>SIMPLE</button>
          <button data-testid="mode-advanced" className={`${styles.modeButton} ${mode === 'advanced' ? styles.modeButtonActive : ''}`} onClick={() => setMode('advanced')}>ADVANCED</button>
        </div>
        <button className={styles.topButton} onClick={undo} disabled={history.past.length === 0} title="撤销"><Undo2 size={15} /><span>UNDO</span></button>
        <button className={styles.topButton} onClick={redo} disabled={history.future.length === 0} title="重做"><Redo2 size={15} /><span>REDO</span></button>
        <button className={styles.topButton} onClick={savePrototype}><Save size={15} /><span>{saved ? 'SAVED' : 'SAVE LOCAL'}</span></button>
        <button className={`${styles.topButton} ${styles.topButtonPrimary}`} onClick={exportJson}><Download size={15} /><span>EXPORT V2</span></button>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <section className={styles.section}>
            <div className={styles.sectionLabel}>01 / STARTING SYSTEM</div>
            <h2 className={styles.sectionTitle}>TRACK SYSTEM</h2>
            <p className={styles.sectionCopy}>模板不是一条道路，而是一组可独立编辑的区域、边界与标记。</p>
            <div className={styles.templateList} style={{ marginTop: 13 }}>
              {(Object.entries(V2_TEMPLATES) as [V2TemplateId, (typeof V2_TEMPLATES)[V2TemplateId]][]).map(([id, template]) => (
                <button key={id} data-template-id={id} className={`${styles.templateButton} ${templateId === id ? styles.templateButtonActive : ''}`} onClick={() => selectTemplate(id)}>
                  <span className={styles.templateName}>{template.label}</span>
                  <span className={styles.templateMeta}>{template.subtitle}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionLabel}>02 / BUILDING BLOCKS</div>
            <div className={styles.moduleGrid}>
              <button data-testid="add-hairpin" className={styles.moduleButton} onClick={() => addBoundary('hairpin')}>+ 发夹岛</button>
              <button className={styles.moduleButton} onClick={() => addBoundary('round')}>+ 圆形岛</button>
              <button className={styles.moduleButton} onClick={() => addBoundary('divider')}>+ 分流岛</button>
              <button className={styles.moduleButton} onClick={() => addMarking('parking')}>+ 停车区</button>
              <button className={styles.moduleButton} onClick={() => addMarking('start-grid')}>+ 起点线</button>
              <button className={styles.moduleButton} onClick={() => addMarking('direction-arrow')}>+ 方向箭头</button>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionLabel}>03 / REGION LAYERS</div>
            <div className={styles.layerList}>
              {document.paths.map((path, index) => (
                <button key={path.id} className={`${styles.layerItem} ${selectedBoundaryId === path.id ? styles.layerItemActive : ''}`} onClick={() => setSelectedBoundaryId(path.id)}>
                  <span className={styles.layerIndex}>{String(index + 1).padStart(2, '0')}</span>
                  <span className={styles.layerName}>{path.name}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className={styles.stage}>
          <div className={styles.canvasFrame} style={{ aspectRatio: `${document.canvas.width} / ${document.canvas.height}` }}>
            <V2Canvas
              document={document}
              mode={mode}
              selectedBoundaryId={selectedBoundaryId}
              showDriveRoute={showDriveRoute}
              onSelect={setSelectedBoundaryId}
              onReplace={replace}
              onCheckpoint={checkpoint}
            />
          </div>
          <div className={styles.statusStrip}>
            <div className={`${styles.statusCell} ${validation.valid ? styles.statusGood : styles.statusBad}`}>{validation.valid ? '✓ GEOMETRY READY' : `× ${validation.issues.filter((issue) => issue.severity === 'error').length} ERRORS`}</div>
            <div className={styles.statusCell}>{document.canvas.width.toFixed(1)} × {document.canvas.height.toFixed(1)} M</div>
            <div className={styles.statusCell}>{document.paths.length} ISLANDS</div>
            <div className={styles.statusCell}>{validation.asphaltArea.toFixed(2)} M² ASPHALT</div>
          </div>
        </section>

        <aside className={`${styles.sidebar} ${styles.sidebarRight}`}>
          <section className={styles.section}>
            <div className={styles.sectionLabel}>INSPECTOR / {mode.toUpperCase()}</div>
            {selectedBoundary ? (
              <>
                <h2 className={styles.sectionTitle}>{selectedBoundary.name}</h2>
                <p className={styles.sectionCopy}>{mode === 'simple' ? '直接拖动整个内岛，使用下方动作快速变形。' : '拖动节点精修边界；点击边界段切换该段路肩。'}</p>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}><span>名称</span><span>PATH</span></label>
                  <input className={styles.textInput} value={selectedBoundary.name} onChange={(event) => updateBoundary(selectedBoundary.id, (path) => ({ ...path, name: event.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}><span>边界平滑</span><span>{selectedBoundary.smoothing.toFixed(2)}</span></label>
                  <input className={styles.range} type="range" min="0" max="1.2" step="0.05" value={selectedBoundary.smoothing} onChange={(event) => updateBoundary(selectedBoundary.id, (path) => ({ ...path, smoothing: Number(event.target.value) }))} />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}><span>岛区材质</span><span>REGION</span></label>
                  <select className={styles.selectInput} value={selectedBoundary.fill} onChange={(event) => updateBoundary(selectedBoundary.id, (path) => ({ ...path, fill: event.target.value as BoundaryPathV2['fill'] }))}>
                    <option value="concrete">水泥灰</option>
                    <option value="grass">草地区</option>
                    <option value="painted">彩色缓冲区</option>
                  </select>
                </div>
                <div className={styles.actionRow}>
                  <button className={styles.actionButton} onClick={() => updateBoundary(selectedBoundary.id, (path) => rotateBoundary(path, Math.PI / 12))}><RotateCw size={14} /></button>
                  <button className={styles.actionButton} onClick={() => updateBoundary(selectedBoundary.id, (path) => scaleBoundary(path, 1.08))}>放大</button>
                  <button className={styles.actionButton} onClick={() => updateBoundary(selectedBoundary.id, (path) => scaleBoundary(path, 0.92))}>缩小</button>
                  <button className={styles.actionButton} onClick={duplicateSelected}><Copy size={14} /></button>
                  <button className={`${styles.actionButton} ${styles.dangerButton}`} onClick={deleteSelected}><Trash2 size={14} /></button>
                  <button className={styles.actionButton} onClick={() => setShowDriveRoute((value) => !value)}>{showDriveRoute ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                </div>
                <p className={styles.hint}>当前对象包含 {selectedBoundary.nodes.length} 个边界节点、{selectedBoundary.curbSegments.length} 段路肩。</p>
              </>
            ) : <div className={styles.emptyState}>从画布或左侧图层选择一个内岛开始编辑。</div>}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionLabel}>LIVE VALIDATION</div>
            <h2 className={styles.sectionTitle}>{validation.valid ? 'READY TO PROTOTYPE' : 'REQUIRES REPAIR'}</h2>
            <div className={styles.metricGrid}>
              <div className={styles.metric}><div className={styles.metricValue}>{validation.normalizedPathCount}</div><div className={styles.metricLabel}>Normalized rings</div></div>
              <div className={styles.metric}><div className={styles.metricValue}>{validation.asphaltArea.toFixed(1)}</div><div className={styles.metricLabel}>Surface m²</div></div>
            </div>
            <div className={styles.issueList}>
              {validation.issues.length === 0 ? (
                <div className={styles.emptyState}>没有发现边界重叠、自交或越界。供应商生产参数仍未接入。</div>
              ) : validation.issues.slice(0, 7).map((issue) => (
                <button key={issue.id} className={`${styles.issue} ${issue.severity === 'error' ? styles.issueError : ''}`} onClick={() => issue.boundaryId && setSelectedBoundaryId(issue.boundaryId)}>
                  <span className={styles.issueDot} /><span>{issue.message}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}

function V2Canvas({
  document,
  mode,
  selectedBoundaryId,
  showDriveRoute,
  onSelect,
  onReplace,
  onCheckpoint,
}: {
  document: TrackDocumentV2
  mode: EditorMode
  selectedBoundaryId: string | null
  showDriveRoute: boolean
  onSelect: (id: string | null) => void
  onReplace: (document: TrackDocumentV2) => void
  onCheckpoint: (previous: TrackDocumentV2) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const selected = document.paths.find((path) => path.id === selectedBoundaryId)
  const shortSide = Math.min(document.canvas.width, document.canvas.height)
  const handleRadius = shortSide * 0.018

  const toLocal = (clientX: number, clientY: number) => {
    const ctm = svgRef.current?.getScreenCTM()
    if (!ctm) return null
    const point = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
    return { x: point.x, y: point.y }
  }

  const startDrag = (event: React.PointerEvent<SVGElement>, path: BoundaryPathV2, nodeIndex?: number) => {
    if (event.button !== 0) return
    event.stopPropagation()
    const point = toLocal(event.clientX, event.clientY)
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    onSelect(path.id)
    setDrag({ pointerId: event.pointerId, boundaryId: path.id, nodeIndex, start: point, originalPath: clone(path), originalDocument: clone(document) })
  }

  const moveDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drag || drag.pointerId !== event.pointerId) return
    const point = toLocal(event.clientX, event.clientY)
    if (!point) return
    const dx = point.x - drag.start.x
    const dy = point.y - drag.start.y
    const next = clone(document)
    next.paths = next.paths.map((path) => {
      if (path.id !== drag.boundaryId) return path
      if (drag.nodeIndex === undefined) return translateBoundary(drag.originalPath, dx, dy)
      const changed = clone(drag.originalPath)
      changed.nodes[drag.nodeIndex] = { x: drag.originalPath.nodes[drag.nodeIndex].x + dx, y: drag.originalPath.nodes[drag.nodeIndex].y + dy }
      return changed
    })
    onReplace(next)
  }

  const endDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drag || drag.pointerId !== event.pointerId) return
    onCheckpoint(drag.originalDocument)
    setDrag(null)
  }

  const toggleCurb = (path: BoundaryPathV2, segmentIndex: number, event: React.PointerEvent<SVGPathElement>) => {
    if (mode !== 'advanced') return
    event.stopPropagation()
    const next = clone(document)
    next.paths = next.paths.map((candidate) => candidate.id === path.id ? {
      ...candidate,
      curbSegments: candidate.curbSegments.includes(segmentIndex)
        ? candidate.curbSegments.filter((index) => index !== segmentIndex)
        : [...candidate.curbSegments, segmentIndex].sort((a, b) => a - b),
    } : candidate)
    onCheckpoint(clone(document))
    onReplace(next)
  }

  const holePath = document.paths.map(boundaryPathD).join(' ')
  return (
    <svg
      ref={svgRef}
      className={styles.canvas}
      viewBox={`0 0 ${document.canvas.width} ${document.canvas.height}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerDown={() => onSelect(null)}
    >
      <defs>
        <filter id="asphalt-grain-v2" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="7.5" numOctaves="2" seed="19" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
          <feBlend in="SourceGraphic" in2="mono" mode="soft-light" />
        </filter>
        <pattern id="grid-v2" width="0.1" height="0.1" patternUnits="userSpaceOnUse">
          <path d="M .1 0 L 0 0 0 .1" fill="none" stroke="rgba(255,255,255,.045)" strokeWidth=".003" />
        </pattern>
        <pattern id="checkers-v2" width="0.08" height="0.08" patternUnits="userSpaceOnUse">
          <rect width=".04" height=".04" fill="#fff" /><rect x=".04" y=".04" width=".04" height=".04" fill="#fff" />
        </pattern>
      </defs>

      <rect width={document.canvas.width} height={document.canvas.height} fill="#647a51" />
      <path d={`M 0 0 H ${document.canvas.width} V ${document.canvas.height} H 0 Z ${holePath}`} fill="#353a39" fillRule="evenodd" />
      <path d={`M 0 0 H ${document.canvas.width} V ${document.canvas.height} H 0 Z ${holePath}`} fill="#8f9692" fillRule="evenodd" filter="url(#asphalt-grain-v2)" opacity=".14" pointerEvents="none" />
      <rect width={document.canvas.width} height={document.canvas.height} fill="url(#grid-v2)" pointerEvents="none" />

      {document.paths.map((path) => (
        <g key={path.id}>
          <path d={boundaryPathD(path)} fill={path.fill === 'grass' ? '#779759' : path.fill === 'painted' ? '#478f9b' : '#6f7470'} stroke="rgba(255,255,255,.88)" strokeWidth=".025" />
          {path.curbSegments.map((segmentIndex) => (
            <g key={`${path.id}-curb-${segmentIndex}`} pointerEvents="none">
              <path d={boundarySegmentD(path, segmentIndex)} fill="none" stroke={document.theme.curbColors[0]} strokeWidth=".085" />
              <path d={boundarySegmentD(path, segmentIndex)} fill="none" stroke={document.theme.curbColors[1]} strokeWidth=".087" strokeDasharray=".10 .10" />
            </g>
          ))}
          <path
            d={boundaryPathD(path)}
            fill="transparent"
            stroke={selectedBoundaryId === path.id ? '#d9ff43' : 'transparent'}
            strokeWidth={selectedBoundaryId === path.id ? '.035' : '.10'}
            opacity={selectedBoundaryId === path.id ? .9 : 1}
            onPointerDown={(event) => mode === 'simple' ? startDrag(event, path) : (event.stopPropagation(), onSelect(path.id))}
            style={{ cursor: mode === 'simple' ? 'grab' : 'pointer' }}
          />
          {mode === 'advanced' && path.nodes.map((_node, segmentIndex) => (
            <path
              key={`${path.id}-edge-hit-${segmentIndex}`}
              d={boundarySegmentD(path, segmentIndex)}
              fill="none"
              stroke="transparent"
              strokeWidth=".13"
              onPointerDown={(event) => toggleCurb(path, segmentIndex, event)}
              style={{ cursor: 'cell' }}
            />
          ))}
        </g>
      ))}

      {document.markings.map((marking) => (
        <g key={marking.id} transform={`translate(${marking.x} ${marking.y}) rotate(${marking.rotation * 180 / Math.PI})`} pointerEvents="none">
          {marking.kind === 'start-grid' && <rect x={-marking.width / 2} y={-marking.height / 2} width={marking.width} height={marking.height} fill="url(#checkers-v2)" />}
          {marking.kind === 'parking' && (
            <g stroke="rgba(255,255,255,.75)" strokeWidth=".018" fill="none">
              <rect x={-marking.width / 2} y={-marking.height / 2} width={marking.width} height={marking.height} />
              {[1, 2, 3, 4].map((index) => <line key={index} x1={-marking.width / 2 + marking.width * index / 5} x2={-marking.width / 2 + marking.width * index / 5} y1={-marking.height / 2} y2={marking.height / 2} />)}
            </g>
          )}
          {marking.kind === 'direction-arrow' && <path d={`M 0 ${-marking.height / 2} L ${marking.width / 2} 0 H ${marking.width / 5} V ${marking.height / 2} H ${-marking.width / 5} V 0 H ${-marking.width / 2} Z`} fill="rgba(255,255,255,.72)" />}
        </g>
      ))}

      {showDriveRoute && document.driveRoutes.map((route) => (
        <path key={route.id} d={routePath(route.points, route.closed)} fill="none" stroke="#d9ff43" strokeWidth=".018" strokeDasharray=".06 .08" opacity=".65" pointerEvents="none" />
      ))}

      {mode === 'advanced' && selected && selected.nodes.map((node, index) => (
        <g key={`${selected.id}-node-${index}`} onPointerDown={(event) => startDrag(event, selected, index)} style={{ cursor: 'move' }}>
          <circle cx={node.x} cy={node.y} r={handleRadius * 2.2} fill="transparent" />
          <circle cx={node.x} cy={node.y} r={handleRadius} fill="#071012" stroke="#19c6e5" strokeWidth={handleRadius * .35} />
          <text x={node.x} y={node.y - handleRadius * 1.8} fill="#fff" fontSize={handleRadius * 1.7} textAnchor="middle" fontFamily="var(--font-bebas)">{index + 1}</text>
        </g>
      ))}

      <rect x=".012" y=".012" width={document.canvas.width - .024} height={document.canvas.height - .024} fill="none" stroke="rgba(255,255,255,.72)" strokeWidth=".024" pointerEvents="none" />
      <g fill="rgba(255,255,255,.58)" fontFamily="var(--font-bebas)" fontSize={shortSide * .035} letterSpacing=".08em" pointerEvents="none">
        <text x={document.canvas.width / 2} y={shortSide * .06} textAnchor="middle">{document.canvas.width.toFixed(2)} M</text>
        <text x={shortSide * .04} y={document.canvas.height / 2} textAnchor="middle" transform={`rotate(-90 ${shortSide * .04} ${document.canvas.height / 2})`}>{document.canvas.height.toFixed(2)} M</text>
      </g>
    </svg>
  )
}
