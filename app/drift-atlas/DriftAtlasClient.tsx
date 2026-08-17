'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleX,
  Compass,
  Flag,
  Gauge,
  Map,
  MapPin,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import styles from './drift-atlas.module.css'

type Source = {
  id: string
  scope: string
  tier: string
  title: string
  publisher: string
  url: string
}

export type AtlasTrack = {
  id: string
  name: string
  event: string
  series: string
  year: number
  venue: string
  city: string
  country: string
  countryCode: string
  region: string
  tier: string
  venueType: string
  confidence: string
  direction: string
  segment: string
  start: string
  finish: string
  initiation: string
  features: string
  tags: string[]
  score: number
  originalImage: string | null
  mediaType: string
  mediaLabel: string
  mediaAttribution: string
  mediaSourceUrl: string | null
  mediaStatus: string
  sources: Source[]
}

type Props = { tracks: AtlasTrack[] }
type ViewMode = 'original' | 'route'

const REGION_LABELS: Record<string, string> = {
  japan: '日本',
  'north-america': '北美',
  europe: '欧洲',
  oceania: '大洋洲',
  'asia-other': '亚洲其他',
  'latin-america': '拉丁美洲',
  'middle-east-africa': '中东与非洲',
}

const TIER_LABELS: Record<string, string> = {
  international: '国际 / 洲际',
  national: '国家级',
  historic: '历史 / 邀请赛',
}

const CONFIDENCE_LABELS: Record<string, string> = {
  highest: '官方路线图',
  high: '高置信度',
  medium: '编辑重建',
}

const imageBase = '/images/global-drift-track-atlas'

function AtlasMark() {
  return (
    <span className={styles.mark} aria-hidden="true">
      <span>Ｎ</span>
      <i />
    </span>
  )
}

function TrackCard({ track, index, viewMode, onOpen }: { track: AtlasTrack; index: number; viewMode: ViewMode; onOpen: () => void }) {
  const isOriginal = viewMode === 'original' && track.originalImage
  return (
    <button className={styles.card} onClick={onOpen} type="button">
      <span className={styles.cardTopline}>
        <span>{String(index + 1).padStart(2, '0')}</span>
        <span>{track.countryCode} / {track.year}</span>
      </span>
      <span className={styles.trackStage}>
        <Image
          src={isOriginal ? track.originalImage! : `${imageBase}/png/${track.id}.png`}
          alt={isOriginal ? `${track.venue} 真实场地俯视原图` : `${track.name} 路线标注图`}
          width={1600}
          height={1200}
          sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
          className={`${styles.trackImage} ${isOriginal ? styles.originalImage : styles.routeImage}`}
        />
        <span className={styles.mediaBadge} data-media={track.mediaType}>{isOriginal ? track.mediaLabel : '路线标注层'}</span>
        {isOriginal && <span className={styles.imageCredit}>{track.mediaAttribution}</span>}
        <span className={styles.cardOpen}><ArrowUpRight size={16} /></span>
      </span>
      <span className={styles.cardBody}>
        <span className={styles.cardSeries}>{track.series}</span>
        <strong>{track.venue}</strong>
        <span className={styles.cardPlace}><MapPin size={13} />{track.city} · {track.country}</span>
      </span>
      <span className={styles.cardFooter}>
        <span data-confidence={track.confidence}>{CONFIDENCE_LABELS[track.confidence]}</span>
        <ChevronRight size={16} />
      </span>
    </button>
  )
}

function TrackModal({ track, onClose }: { track: AtlasTrack; onClose: () => void }) {
  const [viewMode, setViewMode] = useState<ViewMode>('original')
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const courseSources = track.sources.filter((source) => source.scope === 'course')
  const isOriginal = viewMode === 'original' && track.originalImage

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="track-dialog-title">
        <button className={styles.modalClose} type="button" onClick={onClose} aria-label="关闭详情">
          <X size={22} />
        </button>

        <div className={styles.modalVisual}>
          <div className={styles.modalIndex}>{track.countryCode}<br /><span>{track.year}</span></div>
          <Image
            src={isOriginal ? track.originalImage! : `${imageBase}/png/${track.id}.png`}
            alt={isOriginal ? `${track.venue} 真实场地俯视原图` : `${track.name} 路线标注大图`}
            width={1600}
            height={1200}
            sizes="(max-width: 900px) 100vw, 58vw"
            className={`${styles.modalImage} ${isOriginal ? styles.modalOriginalImage : styles.modalRouteImage}`}
            priority
          />
          <div className={styles.modalViewToggle} aria-label="图片类型">
            <button className={viewMode === 'original' ? styles.activeView : ''} onClick={() => setViewMode('original')} type="button">真实原图</button>
            <button className={viewMode === 'route' ? styles.activeView : ''} onClick={() => setViewMode('route')} type="button">路线标注</button>
          </div>
          <div className={styles.modalMediaMeta}>
            <b>{isOriginal ? track.mediaLabel : '编辑路线标注层'}</b>
            {isOriginal && <span>{track.mediaAttribution}</span>}
          </div>
          {!isOriginal && <div className={styles.legend}>
            <span><i className={styles.startDot} />起点</span>
            <span><i className={styles.finishDot} />终点</span>
            <span><i className={styles.outerDot} />外区</span>
            <span><i className={styles.innerDot} />内区</span>
          </div>}
        </div>

        <div className={styles.modalContent}>
          <p className={styles.eyebrow}>{track.series} · {TIER_LABELS[track.tier]}</p>
          <h2 id="track-dialog-title">{track.venue}</h2>
          <p className={styles.modalLocation}><MapPin size={15} />{track.city}, {track.country} · {track.year}</p>

          <div className={styles.modalBadges}>
            <span>{track.mediaLabel}</span>
            <span data-confidence={track.confidence}>{CONFIDENCE_LABELS[track.confidence]}</span>
            <span>{track.venueType}</span>
            <span>评分 {track.score}</span>
          </div>

          <div className={styles.factList}>
            <div><Compass size={17} /><span><b>路线</b>{track.segment}</span></div>
            <div><Gauge size={17} /><span><b>方向</b>{track.direction}</span></div>
            <div><Flag size={17} /><span><b>起终点</b>{track.start} → {track.finish}</span></div>
          </div>

          {courseSources.length > 0 && (
            <div className={styles.sources}>
              <p>路线证据</p>
              {courseSources.map((source) => (
                <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                  <span><b>{source.tier}</b>{source.title}<small>{source.publisher}</small></span>
                  <ArrowUpRight size={16} />
                </a>
              ))}
            </div>
          )}

          {track.mediaSourceUrl && (
            <a className={styles.originalSource} href={track.mediaSourceUrl} target="_blank" rel="noreferrer">
              查看这张原图对应的赛事来源 <ArrowUpRight size={16} />
            </a>
          )}

          <div className={styles.downloads}>
            <a href={`${imageBase}/svg/${track.id}.svg`} download><ArrowDownToLine size={17} />路线标注 SVG</a>
            <a href={`${imageBase}/png/${track.id}.png`} download><ArrowDownToLine size={17} />路线标注 PNG</a>
          </div>

          <p className={styles.disclaimer}>真实场地影像用于识别赛道环境；路线标注是独立编辑参考层，不代表卫星拍摄当日的赛事布置，也不作为工程测绘依据。</p>
        </div>
      </section>
    </div>
  )
}

export default function DriftAtlasClient({ tracks }: Props) {
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('all')
  const [tier, setTier] = useState('all')
  const [confidence, setConfidence] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('original')
  const [selectedTrack, setSelectedTrack] = useState<AtlasTrack | null>(null)

  const regionCounts = useMemo(() => tracks.reduce<Record<string, number>>((counts, track) => {
    counts[track.region] = (counts[track.region] ?? 0) + 1
    return counts
  }, {}), [tracks])

  const filteredTracks = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return tracks.filter((track) => {
      const matchesQuery = !needle || [track.name, track.venue, track.city, track.country, track.series]
        .some((value) => value.toLocaleLowerCase().includes(needle))
      return matchesQuery
        && (region === 'all' || track.region === region)
        && (tier === 'all' || track.tier === tier)
        && (confidence === 'all' || track.confidence === confidence)
    })
  }, [tracks, query, region, tier, confidence])

  const resetFilters = () => {
    setQuery('')
    setRegion('all')
    setTier('all')
    setConfidence('all')
  }

  return (
    <main className={styles.page}>
      <div className={styles.gridTexture} aria-hidden="true" />

      <header className={styles.header}>
        <Link href="/" className={styles.brand}><AtlasMark /><span>NESS<em>RC</em></span></Link>
        <div className={styles.headerTitle}><span>Global Drift Archive</span><i />全球漂移赛道原图档案</div>
        <Link href="/" className={styles.back}><ArrowLeft size={16} />返回商店</Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}><Sparkles size={15} />Worldwide course research · Vol. 01</p>
          <h1>漂移赛道<br /><span>真实图鉴</span></h1>
          <p>50 条真实场地卫星 / 航拍俯视图，跨越 29 个国家和地区。默认看原图，需要时再切换独立的路线标注层。</p>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.heroNumber}>50</div>
          <div className={styles.statGrid}>
            <div><strong>29</strong><span>国家 / 地区</span></div>
            <div><strong>49</strong><span>赛事场地</span></div>
            <div><strong>7</strong><span>全球区域</span></div>
            <div><strong>169</strong><span>证据记录</span></div>
          </div>
          <div className={styles.signal}><i /><span>Atlas online</span><b>2026.08</b></div>
        </div>
      </section>

      <section className={styles.atlas}>
        <div className={styles.filterRail}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索赛道、城市、赛事…" aria-label="搜索赛道" />
            {query && <button onClick={() => setQuery('')} type="button" aria-label="清除搜索"><CircleX size={16} /></button>}
          </div>

          <div className={styles.filterGroup}>
            <span>地区</span>
            <div>
              <button className={region === 'all' ? styles.activeFilter : ''} onClick={() => setRegion('all')} type="button">全部 <b>{tracks.length}</b></button>
              {Object.entries(REGION_LABELS).map(([value, label]) => (
                <button className={region === value ? styles.activeFilter : ''} onClick={() => setRegion(value)} type="button" key={value}>{label} <b>{regionCounts[value]}</b></button>
              ))}
            </div>
          </div>

          <div className={styles.selectRow}>
            <label>赛事级别
              <select value={tier} onChange={(event) => setTier(event.target.value)}>
                <option value="all">全部级别</option>
                {Object.entries(TIER_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <label>路线证据
              <select value={confidence} onChange={(event) => setConfidence(event.target.value)}>
                <option value="all">全部置信度</option>
                {Object.entries(CONFIDENCE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className={styles.galleryHead}>
          <div><Map size={18} /><span>当前显示</span><strong>{filteredTracks.length}</strong><span>/ {tracks.length} 条路线</span></div>
          <div className={styles.viewToggle} aria-label="图库图片类型">
            <button className={viewMode === 'original' ? styles.activeView : ''} onClick={() => setViewMode('original')} type="button">真实原图</button>
            <button className={viewMode === 'route' ? styles.activeView : ''} onClick={() => setViewMode('route')} type="button">路线标注</button>
          </div>
        </div>

        {filteredTracks.length > 0 ? (
          <div className={styles.gallery}>
            {filteredTracks.map((track) => (
              <TrackCard key={track.id} track={track} index={tracks.indexOf(track)} viewMode={viewMode} onOpen={() => setSelectedTrack(track)} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <Compass size={38} />
            <strong>没有找到匹配路线</strong>
            <span>换一个关键词，或者清空筛选条件。</span>
            <button onClick={resetFilters} type="button"><Check size={16} />重置筛选</button>
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        <div><AtlasMark /><strong>NessRC Drift Atlas</strong></div>
        <p>Real venue imagery · Optional editorial route overlays</p>
        <span>原图来源与影像署名均在详情页显示。</span>
      </footer>

      {selectedTrack && <TrackModal track={selectedTrack} onClose={() => setSelectedTrack(null)} />}
    </main>
  )
}
