'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CircleX, Search, X } from 'lucide-react'
import styles from './drift-atlas.module.css'

export type AtlasTrack = {
  id: string
  venue: string
  city: string
  country: string
  countryCode: string
  region: string
  year: number
  originalImage: string | null
  mediaAttribution: string
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

const imageBase = '/images/global-drift-track-atlas'

function TrackImage({ track, viewMode, modal = false }: { track: AtlasTrack; viewMode: ViewMode; modal?: boolean }) {
  const isOriginal = viewMode === 'original' && track.originalImage
  return (
    <Image
      src={isOriginal ? track.originalImage! : `${imageBase}/png/${track.id}.png`}
      alt={`${track.venue} ${isOriginal ? '真实场地俯视图' : '路线参考图'}`}
      width={1600}
      height={1200}
      sizes={modal ? '100vw' : '(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw'}
      className={`${styles.trackImage} ${isOriginal ? styles.originalImage : styles.routeImage}`}
      priority={modal}
      unoptimized={Boolean(isOriginal)}
    />
  )
}

function TrackCard({ track, index, viewMode, onOpen }: { track: AtlasTrack; index: number; viewMode: ViewMode; onOpen: () => void }) {
  return (
    <button className={styles.card} onClick={onOpen} type="button">
      <span className={styles.trackStage}><TrackImage track={track} viewMode={viewMode} /></span>
      <span className={styles.cardBody}>
        <span className={styles.cardIndex}>{String(index + 1).padStart(3, '0')}</span>
        <strong>{track.venue}</strong>
        <span>{track.city} · {track.country} · {track.year}</span>
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

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="track-dialog-title">
        <TrackImage track={track} viewMode={viewMode} modal />
        <div className={styles.modalTop}>
          <div className={styles.viewToggle} aria-label="图片类型">
            <button className={viewMode === 'original' ? styles.activeView : ''} onClick={() => setViewMode('original')} type="button">原图</button>
            <button className={viewMode === 'route' ? styles.activeView : ''} onClick={() => setViewMode('route')} type="button">路线参考</button>
          </div>
          <button className={styles.modalClose} type="button" onClick={onClose} aria-label="关闭详情"><X size={21} /></button>
        </div>
        <div className={styles.modalCaption}>
          <div>
            <h2 id="track-dialog-title">{track.venue}</h2>
            <p>{track.city} · {track.country} · {track.year}</p>
          </div>
          {viewMode === 'original' && <small>{track.mediaAttribution}</small>}
        </div>
      </section>
    </div>
  )
}

export default function DriftAtlasClient({ tracks }: Props) {
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('original')
  const [selectedTrack, setSelectedTrack] = useState<AtlasTrack | null>(null)

  const regionCounts = useMemo(() => tracks.reduce<Record<string, number>>((counts, track) => {
    counts[track.region] = (counts[track.region] ?? 0) + 1
    return counts
  }, {}), [tracks])

  const filteredTracks = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return tracks.filter((track) => {
      const matchesQuery = !needle || [track.venue, track.city, track.country]
        .some((value) => value.toLocaleLowerCase().includes(needle))
      return matchesQuery && (region === 'all' || track.region === region)
    })
  }, [tracks, query, region])

  const resetFilters = () => {
    setQuery('')
    setRegion('all')
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>NESS<span>RC</span></Link>
        <Link href="/" className={styles.back}><ArrowLeft size={16} />返回商店</Link>
      </header>

      <section className={styles.hero}>
        <h1><span>100 条</span> <span>漂移赛道</span></h1>
        <p>全球赛事场地卫星与航拍俯视图</p>
      </section>

      <section className={styles.atlas}>
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索赛道或地点" aria-label="搜索赛道" />
            {query && <button onClick={() => setQuery('')} type="button" aria-label="清除搜索"><CircleX size={16} /></button>}
          </div>
          <div className={styles.regions}>
            <button className={region === 'all' ? styles.activeFilter : ''} onClick={() => setRegion('all')} type="button">全部 {tracks.length}</button>
            {Object.entries(REGION_LABELS).map(([value, label]) => (
              <button className={region === value ? styles.activeFilter : ''} onClick={() => setRegion(value)} type="button" key={value}>{label} {regionCounts[value]}</button>
            ))}
          </div>
        </div>

        <div className={styles.galleryHead}>
          <span>{filteredTracks.length} 条</span>
          <div className={styles.viewToggle} aria-label="图库图片类型">
            <button className={viewMode === 'original' ? styles.activeView : ''} onClick={() => setViewMode('original')} type="button">原图</button>
            <button className={viewMode === 'route' ? styles.activeView : ''} onClick={() => setViewMode('route')} type="button">路线参考</button>
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
            <span>没有找到赛道</span>
            <button onClick={resetFilters} type="button">清空筛选</button>
          </div>
        )}
      </section>

      {selectedTrack && <TrackModal track={selectedTrack} onClose={() => setSelectedTrack(null)} />}
    </main>
  )
}
