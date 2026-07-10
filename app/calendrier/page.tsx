'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Calendar, Loader2, TrendingUp } from 'lucide-react'

const EVENT_TYPES = ['Tous', 'Résultats', 'Dividendes', 'Fed / BCE', 'Macro']

export default function CalendrierPage() {
  const [earnings, setEarnings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Tous')

  useEffect(() => {
    fetch('/api/stocks/calendar')
      .then(r => r.json())
      .then(data => { setEarnings(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Group by date
  const grouped: Record<string, any[]> = {}
  earnings.slice(0, 100).forEach(e => {
    const date = e.date || 'Unknown'
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(e)
  })

  const macroEvents = [
    { date: '2026-07-15', label: 'CPI USA (Inflation)', type: 'Macro', impact: 'Élevé' },
    { date: '2026-07-30', label: 'FOMC — Décision taux Fed', type: 'Fed / BCE', impact: 'Très élevé' },
    { date: '2026-07-25', label: 'PIB USA T2 2026 (estimation)', type: 'Macro', impact: 'Élevé' },
    { date: '2026-08-01', label: 'NFP — Emplois non-agricoles', type: 'Macro', impact: 'Élevé' },
  ]

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const impactColor = (impact: string) => {
    if (impact === 'Très élevé') return 'var(--red)'
    if (impact === 'Élevé') return 'var(--yellow)'
    return 'var(--green)'
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Calendar size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Calendrier</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Événements des 30 prochains jours</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {EVENT_TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filter === t ? 'var(--accent)' : 'var(--surface)',
                color: filter === t ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${filter === t ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* Événements macro */}
        {(filter === 'Tous' || filter === 'Macro' || filter === 'Fed / BCE') && (
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Événements macroéconomiques</span>
            </div>
            {macroEvents
              .filter(e => filter === 'Tous' || e.type === filter)
              .map((e, i) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between border-b last:border-0"
                  style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>{e.label}</div>
                    <div className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{formatDate(e.date)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ background: `${impactColor(e.impact)}20`, color: impactColor(e.impact) }}>
                      {e.impact}
                    </span>
                    <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                      {e.type}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Résultats entreprises */}
        {(filter === 'Tous' || filter === 'Résultats') && (
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
              <TrendingUp size={14} style={{ color: 'var(--green)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Résultats entreprises (30j)</span>
            </div>
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
              </div>
            ) : Object.keys(grouped).length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>Aucun résultat planifié.</div>
            ) : (
              Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).slice(0, 10).map(([date, items]) => (
                <div key={date}>
                  <div className="px-5 py-2 text-xs font-semibold capitalize"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                    {formatDate(date)}
                  </div>
                  {items.map((item, i) => (
                    <div key={i} className="px-5 py-3 flex items-center justify-between border-b last:border-0"
                      style={{ borderColor: 'var(--border)' }}>
                      <div>
                        <span className="text-sm font-bold mr-2" style={{ color: 'var(--text-primary)' }}>{item.symbol}</span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.name || ''}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {item.epsEstimate && <span>EPS estimé: <strong style={{ color: 'var(--text-primary)' }}>${item.epsEstimate}</strong></span>}
                        {item.revenueEstimate && <span>CA estimé: <strong style={{ color: 'var(--text-primary)' }}>${(item.revenueEstimate / 1e9).toFixed(1)}B</strong></span>}
                        <span className="px-2 py-0.5 rounded" style={{ background: 'var(--surface-2)' }}>
                          {item.hour === 'bmo' ? 'Avant ouverture' : item.hour === 'amc' ? 'Après clôture' : item.hour || '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
