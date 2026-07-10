'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Newspaper, ExternalLink, Loader2, RefreshCw } from 'lucide-react'

const CATEGORIES = [
  { key: 'all', label: 'Toutes' },
  { key: 'earnings', label: 'Résultats' },
  { key: 'merger', label: 'Fusion / Acquisition' },
  { key: 'ai', label: 'IA' },
  { key: 'semiconductor', label: 'Semi-conducteurs' },
  { key: 'fed', label: 'Fed' },
  { key: 'inflation', label: 'Inflation' },
  { key: 'central_bank', label: 'Banques centrales' },
  { key: 'dividend', label: 'Dividendes' },
  { key: 'analyst', label: 'Objectifs analystes' },
]

const KEYWORDS: Record<string, string[]> = {
  earnings: ['earnings', 'revenue', 'profit', 'results', 'quarterly', 'EPS', 'résultats'],
  merger: ['merger', 'acquisition', 'acquires', 'deal', 'buyout', 'takeover'],
  ai: ['artificial intelligence', 'AI', 'machine learning', 'ChatGPT', 'LLM', 'generative'],
  semiconductor: ['semiconductor', 'chip', 'nvidia', 'TSMC', 'AMD', 'Intel', 'wafer'],
  fed: ['Federal Reserve', 'Fed', 'interest rate', 'FOMC', 'Jerome Powell'],
  inflation: ['inflation', 'CPI', 'PPI', 'consumer price', 'deflation'],
  central_bank: ['central bank', 'ECB', 'BCE', 'Bank of England', 'monetary policy'],
  dividend: ['dividend', 'yield', 'payout', 'distribution'],
  analyst: ['price target', 'upgrade', 'downgrade', 'analyst', 'rating', 'outperform'],
}

function matchesCategory(headline: string, summary: string, category: string): boolean {
  if (category === 'all') return true
  const text = (headline + ' ' + summary).toLowerCase()
  return KEYWORDS[category]?.some(kw => text.includes(kw.toLowerCase())) ?? true
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() / 1000 - timestamp
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

export default function ActualitesPage() {
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  async function fetchNews() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/stocks/news')
      const data = await res.json()
      if (Array.isArray(data)) setNews(data)
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { fetchNews() }, [])

  const filtered = news.filter(n => matchesCategory(n.headline || '', n.summary || '', category))

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <Newspaper size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Actualités</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{filtered.length} articles</p>
            </div>
          </div>
          <button onClick={fetchNews} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm disabled:opacity-60"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCategory(c.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: category === c.key ? 'var(--accent)' : 'var(--surface)',
                color: category === c.key ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${category === c.key ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Articles */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>
            Aucune actualité pour cette catégorie.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.slice(0, 50).map((article, i) => (
              <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                className="block rounded-xl p-5 transition-all group"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded"
                        style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                        {article.source || 'News'}
                      </span>
                      {article.related && (
                        <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                          {article.related}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {timeAgo(article.datetime)}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold leading-snug mb-1 group-hover:opacity-80"
                      style={{ color: 'var(--text-primary)' }}>
                      {article.headline}
                    </h3>
                    {article.summary && (
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {article.summary}
                      </p>
                    )}
                  </div>
                  {article.image && (
                    <img src={article.image} alt="" className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                      onError={e => (e.currentTarget.style.display = 'none')} />
                  )}
                  <ExternalLink size={14} className="flex-shrink-0 opacity-0 group-hover:opacity-50 mt-1"
                    style={{ color: 'var(--text-secondary)' }} />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
