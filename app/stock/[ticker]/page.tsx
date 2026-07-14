'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createChart, AreaSeries, IChartApi, ISeriesApi, ColorType } from 'lightweight-charts'
import AppLayout from '@/components/layout/AppLayout'
import { ArrowLeft, TrendingUp, TrendingDown, Newspaper, ExternalLink, Users, Brain } from 'lucide-react'

interface Detail {
  ticker: string
  name: string
  logo: string
  sector: string
  exchange: string
  currency: string
  price: number | null
  dayChangePercent: number | null
  isOpen: boolean | null
  marketCap: number | null
  per: number | null
  eps: number | null
  high52: number | null
  low52: number | null
  beta: number | null
  dividendYield: number | null
  consensus: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number } | null
  peers: string[]
  news: { headline: string; summary: string; url: string; datetime: number; source: string }[]
}

const RANGES = [
  { key: '1mo', label: '1M' },
  { key: '6mo', label: '6M' },
  { key: '1y', label: '1A' },
  { key: '5y', label: '5A' },
]

function timeAgo(timestamp: number): string {
  const diff = Date.now() / 1000 - timestamp
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

function fmtBillions(n: number | null) {
  if (!n) return 'N/A'
  return `$${(n / 1e9).toFixed(2)}B`
}

function StockContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const ticker = String(params.ticker || '').toUpperCase()
  const altTicker = searchParams.get('alt') || undefined

  const [detail, setDetail] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('6mo')
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)

  useEffect(() => {
    setLoading(true)
    const url = `/api/stocks/detail?ticker=${ticker}${altTicker ? `&alt=${altTicker}` : ''}`
    fetch(url).then(r => r.json()).then(d => { if (!d.error) setDetail(d) }).finally(() => setLoading(false))
  }, [ticker, altTicker])

  // Create chart once
  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#8888a0' },
      grid: { vertLines: { visible: false }, horzLines: { color: 'rgba(255,255,255,0.05)' } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      height: 320,
    })
    const series = chart.addSeries(AreaSeries, {
      lineColor: '#6c63ff',
      topColor: 'rgba(108,99,255,0.3)',
      bottomColor: 'rgba(108,99,255,0)',
      lineWidth: 2,
    })
    chartRef.current = chart
    seriesRef.current = series

    const handleResize = () => {
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  // Load series data whenever ticker/range changes
  useEffect(() => {
    const symbol = altTicker || ticker
    if (!symbol) return
    fetch(`/api/stocks/chart?symbol=${symbol}&range=${range}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.series) && seriesRef.current) {
          seriesRef.current.setData(d.series.map((p: { time: number; value: number }) => ({ time: p.time, value: p.value })))
          chartRef.current?.timeScale().fitContent()
        }
      }).catch(() => {})
  }, [ticker, altTicker, range])

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-2" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    </AppLayout>
  )

  if (!detail) return (
    <AppLayout>
      <div className="p-12 text-center" style={{ color: 'var(--text-secondary)' }}>Impossible de charger les données pour {ticker}.</div>
    </AppLayout>
  )

  const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)' }
  const up = (detail.dayChangePercent || 0) >= 0
  const consensusTotal = detail.consensus
    ? detail.consensus.strongBuy + detail.consensus.buy + detail.consensus.hold + detail.consensus.sell + detail.consensus.strongSell
    : 0

  return (
    <AppLayout>
      <div className="space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm hover:opacity-70"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={14} /> Retour
        </button>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {detail.logo ? (
              <img src={detail.logo} alt={detail.ticker} className="w-11 h-11 rounded-xl object-contain" style={{ background: 'var(--surface-2)' }} />
            ) : (
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold" style={{ background: 'var(--surface-2)', color: 'var(--text-primary)' }}>
                {detail.ticker.slice(0, 2)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{detail.ticker}</h1>
                {detail.isOpen !== null && (
                  <span title={detail.isOpen ? 'Marché ouvert' : 'Marché fermé'}
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ background: detail.isOpen ? 'var(--green)' : 'var(--red)' }} />
                )}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{detail.name} {detail.sector && `· ${detail.sector}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {detail.price != null ? `$${detail.price.toFixed(2)}` : 'N/A'}
              </div>
              {detail.dayChangePercent != null && (
                <div className="flex items-center gap-1 justify-end text-sm font-medium" style={{ color: up ? 'var(--green)' : 'var(--red)' }}>
                  {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {up ? '+' : ''}{detail.dayChangePercent.toFixed(2)}%
                </div>
              )}
            </div>
            <button onClick={() => router.push(`/analyse?ticker=${ticker}`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: 'var(--accent)' }}>
              <Brain size={15} /> Analyse IA
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-xl p-5" style={cardStyle}>
          <div className="flex justify-end gap-1 mb-2">
            {RANGES.map(r => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{
                  background: range === r.key ? 'var(--accent)' : 'var(--surface-2)',
                  color: range === r.key ? 'white' : 'var(--text-secondary)',
                }}>
                {r.label}
              </button>
            ))}
          </div>
          <div ref={chartContainerRef} />
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Capitalisation', value: fmtBillions(detail.marketCap) },
            { label: 'PER', value: detail.per?.toFixed(2) ?? 'N/A' },
            { label: 'EPS', value: detail.eps != null ? `$${detail.eps.toFixed(2)}` : 'N/A' },
            { label: 'Beta', value: detail.beta?.toFixed(2) ?? 'N/A' },
            { label: 'Haut 52 sem.', value: detail.high52 != null ? `$${detail.high52.toFixed(2)}` : 'N/A' },
            { label: 'Bas 52 sem.', value: detail.low52 != null ? `$${detail.low52.toFixed(2)}` : 'N/A' },
            { label: 'Rendement dividende', value: detail.dividendYield != null ? `${detail.dividendYield.toFixed(2)}%` : 'N/A' },
            { label: 'Devise', value: detail.currency },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4" style={cardStyle}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
              <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Consensus analystes */}
          <div className="rounded-xl p-5" style={cardStyle}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Consensus analystes</span>
            {!detail.consensus || consensusTotal === 0 ? (
              <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>Aucune donnée disponible.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {[
                  { label: 'Achat fort', value: detail.consensus.strongBuy, color: 'var(--green)' },
                  { label: 'Achat', value: detail.consensus.buy, color: '#7ed321' },
                  { label: 'Neutre', value: detail.consensus.hold, color: 'var(--yellow)' },
                  { label: 'Vente', value: detail.consensus.sell, color: '#f5642a' },
                  { label: 'Vente forte', value: detail.consensus.strongSell, color: 'var(--red)' },
                ].map(c => (
                  <div key={c.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-primary)' }}>{c.label}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{c.value}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(c.value / consensusTotal) * 100}%`, background: c.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Concurrents */}
          <div className="rounded-xl p-5" style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <Users size={15} style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Concurrents</span>
            </div>
            {detail.peers.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Aucun concurrent identifié.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {detail.peers.map(peer => (
                  <button key={peer} onClick={() => router.push(`/stock/${peer}`)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-70"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-primary)' }}>
                    {peer}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* News */}
        <div className="rounded-xl p-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Newspaper size={15} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Actualités</span>
          </div>
          {detail.news.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Aucune actualité récente.</p>
          ) : (
            <div className="space-y-3">
              {detail.news.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-start justify-between gap-2 group">
                  <div>
                    <p className="text-sm leading-snug group-hover:opacity-70" style={{ color: 'var(--text-primary)' }}>{a.headline}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {a.source} · {a.datetime ? timeAgo(a.datetime) : ''}
                    </p>
                  </div>
                  <ExternalLink size={12} className="flex-shrink-0 mt-1 opacity-40 group-hover:opacity-100" style={{ color: 'var(--text-secondary)' }} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default function StockPage() {
  return (
    <Suspense fallback={null}>
      <StockContent />
    </Suspense>
  )
}
