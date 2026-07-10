'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PositionModal from '@/components/portfolio/PositionModal'
import { Position } from '@/types'
import { Plus, Brain, Pencil, Trash2, TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

type PositionWithPrice = Position & { current_price: number }

export default function PortfolioPage() {
  const router = useRouter()
  const [positions, setPositions] = useState<PositionWithPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editPosition, setEditPosition] = useState<Position | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const fetchPositions = useCallback(async () => {
    const res = await fetch('/api/positions')
    const data = await res.json()
    if (Array.isArray(data)) setPositions(data)
    setLoading(false)
  }, [])

  const refreshPrices = useCallback(async () => {
    if (positions.length === 0) return
    setRefreshing(true)
    const tickers = [...new Set(positions.map(p => p.ticker))]
    const priceMap: Record<string, number> = {}
    await Promise.all(tickers.map(async (ticker) => {
      try {
        const res = await fetch(`/api/stocks/quote?symbol=${ticker}`)
        const { quote } = await res.json()
        if (quote?.c) priceMap[ticker] = quote.c
      } catch {}
    }))
    setPositions(prev => prev.map(p => ({
      ...p,
      current_price: priceMap[p.ticker] || p.current_price,
    })))
    setRefreshing(false)
  }, [positions])

  useEffect(() => { fetchPositions() }, [fetchPositions])
  useEffect(() => {
    if (positions.length > 0 && positions.every(p => !p.current_price)) refreshPrices()
  }, [positions.length])

  async function handleSave(data: Partial<Position>) {
    if (editPosition) {
      await fetch(`/api/positions/${editPosition.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } else {
      await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    }
    setShowModal(false)
    setEditPosition(null)
    await fetchPositions()
    refreshPrices()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce lot ?')) return
    await fetch(`/api/positions/${id}`, { method: 'DELETE' })
    await fetchPositions()
  }

  function toggleTicker(ticker: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(ticker)) next.delete(ticker)
      else next.add(ticker)
      return next
    })
  }

  // Group positions by ticker
  const grouped = positions.reduce((acc, p) => {
    if (!acc[p.ticker]) acc[p.ticker] = []
    acc[p.ticker].push(p)
    return acc
  }, {} as Record<string, PositionWithPrice[]>)

  const totalValue = positions.reduce((sum, p) => sum + (p.current_price || p.buy_price) * p.shares, 0)
  const totalGainLoss = positions.reduce((sum, p) => sum + ((p.current_price || p.buy_price) - p.buy_price) * p.shares, 0)

  const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)' }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Portefeuille</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {Object.keys(grouped).length} position{Object.keys(grouped).length !== 1 ? 's' : ''} · {positions.length} lot{positions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={refreshPrices} disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-opacity disabled:opacity-60"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Actualiser
            </button>
            <button onClick={() => { setEditPosition(null); setShowModal(true) }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: 'var(--accent)' }}>
              <Plus size={16} />
              Ajouter
            </button>
          </div>
        </div>

        {/* Summary */}
        {positions.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={cardStyle}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Valeur totale</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                ${totalValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="rounded-xl p-4" style={cardStyle}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Gain / Perte total</div>
              <div className="text-2xl font-bold" style={{ color: totalGainLoss >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {totalGainLoss >= 0 ? '+' : ''}{totalGainLoss.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={cardStyle}>
          {loading ? (
            <div className="p-12 text-center" style={{ color: 'var(--text-secondary)' }}>Chargement...</div>
          ) : positions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Aucune position</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Ajoutez votre première position pour commencer</p>
              <button onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: 'var(--accent)' }}>
                <Plus size={14} className="inline mr-1" />
                Ajouter une position
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Action', 'Px achat moy.', 'Cours actuel', 'Variation', 'Gain/Perte', 'Qté totale', 'Valeur', 'Levier', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap"
                        style={{ color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grouped).map(([ticker, lots]) => {
                    const current = lots[0].current_price || lots[0].buy_price
                    const totalShares = lots.reduce((s, l) => s + l.shares, 0)
                    const avgBuy = lots.reduce((s, l) => s + l.buy_price * l.shares, 0) / totalShares
                    const totalGL = lots.reduce((s, l) => s + (current - l.buy_price) * l.shares, 0)
                    const variation = ((current - avgBuy) / avgBuy) * 100
                    const isPositive = totalGL >= 0
                    const isExpanded = expanded.has(ticker)
                    const maxLeverage = Math.max(...lots.map(l => l.leverage))

                    return [
                      // Summary row
                      <tr key={`${ticker}-summary`}
                        className="cursor-pointer transition-colors"
                        style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--border)' }}
                        onClick={() => toggleTicker(ticker)}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                            <div>
                              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{ticker}</div>
                              <div className="text-xs truncate max-w-[120px]" style={{ color: 'var(--text-secondary)' }}>{lots[0].name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                          ${avgBuy.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium" style={{ color: 'var(--text-primary)' }}>
                          ${current.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="flex items-center gap-1 font-medium"
                            style={{ color: isPositive ? 'var(--green)' : 'var(--red)' }}>
                            {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            {isPositive ? '+' : ''}{variation.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold"
                          style={{ color: isPositive ? 'var(--green)' : 'var(--red)' }}>
                          {totalGL >= 0 ? '+' : ''}{totalGL.toFixed(2)} $
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                          {totalShares.toFixed(4)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                          ${(current * totalShares).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ background: maxLeverage > 1 ? 'rgba(245,166,35,0.15)' : 'var(--surface-2)', color: maxLeverage > 1 ? 'var(--yellow)' : 'var(--text-secondary)' }}>
                            x{maxLeverage}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={e => { e.stopPropagation(); router.push(`/analyse?ticker=${ticker}`) }}
                            title="Analyse IA"
                            className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                            style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--accent)' }}>
                            <Brain size={13} />
                          </button>
                        </td>
                      </tr>,

                      // Lot rows (expanded)
                      ...(isExpanded ? lots.map((lot, i) => {
                        const lotGL = (current - lot.buy_price) * lot.shares
                        const lotPositive = lotGL >= 0
                        return (
                          <tr key={lot.id}
                            style={{
                              borderBottom: i === lots.length - 1 ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.03)',
                              background: 'rgba(0,0,0,0.15)',
                            }}>
                            <td className="px-4 py-2.5 pl-10">
                              <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Lot {i + 1} · {new Date(lot.buy_date).toLocaleDateString('fr-FR')}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-xs" style={{ color: 'var(--text-primary)' }}>
                              ${lot.buy_price.toFixed(4)}
                            </td>
                            <td className="px-4 py-2.5" />
                            <td className="px-4 py-2.5" />
                            <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium"
                              style={{ color: lotPositive ? 'var(--green)' : 'var(--red)' }}>
                              {lotGL >= 0 ? '+' : ''}{lotGL.toFixed(2)} $
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {lot.shares}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-xs" style={{ color: 'var(--text-secondary)' }}>
                              ${(current * lot.shares).toFixed(2)}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded text-xs"
                                style={{ background: lot.leverage > 1 ? 'rgba(245,166,35,0.1)' : 'transparent', color: lot.leverage > 1 ? 'var(--yellow)' : 'var(--text-secondary)' }}>
                                x{lot.leverage}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => { setEditPosition(lot); setShowModal(true) }}
                                  title="Modifier"
                                  className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                                  style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                                  <Pencil size={12} />
                                </button>
                                <button onClick={() => handleDelete(lot.id)}
                                  title="Supprimer"
                                  className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                                  style={{ background: 'rgba(255,77,106,0.1)', color: 'var(--red)' }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      }) : [])
                    ]
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <PositionModal
          position={editPosition}
          onClose={() => { setShowModal(false); setEditPosition(null) }}
          onSave={handleSave}
        />
      )}
    </AppLayout>
  )
}
