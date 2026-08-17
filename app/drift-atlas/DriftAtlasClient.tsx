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
  sources: Source[]
}

type Props = { tracks: AtlasTrack[] }

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

function TrackCard({ track, index, onOpen }: { track: AtlasTrack; index: number; onOpen: () => void }) {
  return (
    <button className={styles.card} onClick={onOpen} type="button">
      <span className={styles.cardTopline}>
        <span>{String(index + 1).padStart(2, '0')}</span>
        <span>{track.countryCode} / {track.year}</span>
      </span>
      <span className={styles.trackStage}>
        <Image
          src={`${imageBase}/png/${track.id}.png`}
          alt={`${track.name} 漂移路线俯视图`}
          width={1600}
          height={1200}
          sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
          className={styles.trackImage}
        />
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

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="track-dialog-title">
        <button className={styles.modalClose} type="button" onClick={onClose} aria-label="关闭详情">
          <X size={22} />
        </button>

        <div className={styles.modalVisual}>
          <div className={styles.modalIndex}>{track.countryCode}<br /><span>{track.year}</span></div>
          <Image
            src={`${imageBase}/png/${track.id}.png`}
            alt={`${track.name} 漂移路线大图`}
            width={1600}
            height={1200}
            sizes="(max-width: 900px) 100vw, 58vw"
            className={styles.modalImage}
            priority
          />
          <div className={styles.legend}>
            <span><i className={styles.startDot} />起点</span>
            <span><i className={styles.finishDot} />终点</span>
            <span><i className={styles.outerDot} />外区</span>
            <span><i className={styles.innerDot} />内区</span>
          </div>
        </div>

        <div className={styles.modalContent}>
          <p className={styles.eyebrow}>{track.series} · {TIER_LABELS[track.tier]}</p>
          <h2 id="track-dialog-title">{track.venue}</h2>
          <p className={styles.modalLocation}><MapPin size={15} />{track.city}, {track.country} · {track.year}</p>

          <div className={styles.modalBadges}>
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

          <div className={styles.downloads}>
            <a href={`${imageBase}/svg/${track.id}.svg`} download><ArrowDownToLine size={17} />下载 SVG</a>
            <a href={`${imageBase}/png/${track.id}.png`} download><ArrowDownToLine size={17} />下载 PNG</a>
          </div>

          <p className={styles.disclaimer}>编辑级路线重绘，用于资料检索与设计参考；不作为赛事安全或工程测绘依据。</p>
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
        <div className={styles.headerTitle}><span>Global Drift Archive</span><i />全球漂移赛事路线档案</div>
        <Link href="/" className={styles.back}><ArrowLeft size={16} />返回商店</Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}><Sparkles size={15} />Worldwide course research · Vol. 01</p>
          <h1>漂移路线<br /><span>世界图鉴</span></h1>
          <p>从大场地里拆出真正比赛使用的短赛段。50 条路线，跨越 29 个国家和地区，全部统一重绘、统一标记、可下载。</p>
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
          <span>点击卡片查看路线资料与下载</span>
        </div>

        {filteredTracks.length > 0 ? (
          <div className={styles.gallery}>
            {filteredTracks.map((track) => (
              <TrackCard key={track.id} track={track} index={tracks.indexOf(track)} onOpen={() => setSelectedTrack(track)} />
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
        <p>Original editorial redraws · SVG / PNG · 1600 × 1200</p>
        <span>资料参考用途，不作为工程测绘依据。</span>
      </footer>

      {selectedTrack && <TrackModal track={selectedTrack} onClose={() => setSelectedTrack(null)} />}
    </main>
  )
}
