'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PositionModal from '@/components/portfolio/PositionModal'
import { Position } from '@/types'
import { Plus, Brain, Pencil, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PortfolioPage() {
  const router = useRouter()
  const [positions, setPositions] = useState<(Position & { current_price: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editPosition, setEditPosition] = useState<Position | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchPositions = useCallback(async () => {
    const res = await fetch('/api/positions')
    const data = await res.json()
    if (Array.isArray(data)) setPositions(data)
    setLoading(false)
  }, [])

  const refreshPrices = useCallback(async () => {
    if (positions.length === 0) return
    setRefreshing(true)
    const updated = await Promise.all(
      positions.map(async (p) => {
        try {
          const res = await fetch(`/api/stocks/quote?symbol=${p.ticker}`)
          const { quote } = await res.json()
          return { ...p, current_price: quote?.c || p.current_price }
        } catch {
          return p
        }
      })
    )
    setPositions(updated as any)
    setRefreshing(false)
  }, [positions])

  useEffect(() => { fetchPositions() }, [fetchPositions])
  useEffect(() => {
    if (positions.length > 0 && positions.every(p => !p.current_price)) {
      refreshPrices()
    }
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
    if (!confirm('Supprimer cette position ?')) return
    await fetch(`/api/positions/${id}`, { method: 'DELETE' })
    await fetchPositions()
  }

  const totalValue = positions.reduce((sum, p) => sum + (p.current_price || p.buy_price) * p.shares, 0)
  const totalGainLoss = positions.reduce((sum, p) => {
    const gain = ((p.current_price || p.buy_price) - p.buy_price) * p.shares
    return sum + gain
  }, 0)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Portefeuille</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {positions.length} position{positions.length !== 1 ? 's' : ''} ouverte{positions.length !== 1 ? 's' : ''}
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
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Valeur totale</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                ${totalValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Gain / Perte total</div>
              <div className="text-2xl font-bold" style={{ color: totalGainLoss >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {totalGainLoss >= 0 ? '+' : ''}{totalGainLoss.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
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
                    {['Action', 'Prix achat', 'Cours actuel', 'Variation', 'Gain/Perte', 'Actions', 'Valeur', 'Levier', 'Objectif', 'Stop Loss', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap"
                        style={{ color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const current = p.current_price || p.buy_price
                    const variation = ((current - p.buy_price) / p.buy_price) * 100
                    const gainLoss = (current - p.buy_price) * p.shares
                    const isPositive = variation >= 0

                    return (
                      <tr key={p.id} className="transition-colors"
                        style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <td className="px-4 py-3">
                          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.ticker}</div>
                          <div className="text-xs truncate max-w-[120px]" style={{ color: 'var(--text-secondary)' }}>{p.name}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                          ${p.buy_price.toFixed(2)}
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
                        <td className="px-4 py-3 whitespace-nowrap font-medium"
                          style={{ color: gainLoss >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {gainLoss >= 0 ? '+' : ''}{gainLoss.toFixed(2)} $
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                          {p.shares}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                          ${(current * p.shares).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ background: p.leverage > 1 ? 'rgba(245,166,35,0.15)' : 'var(--surface-2)', color: p.leverage > 1 ? 'var(--yellow)' : 'var(--text-secondary)' }}>
                            x{p.leverage}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--green)' }}>
                          {p.target_price ? `$${p.target_price}` : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--red)' }}>
                          {p.stop_loss ? `$${p.stop_loss}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => router.push(`/analyse?ticker=${p.ticker}`)}
                              title="Analyse IA"
                              className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                              style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--accent)' }}>
                              <Brain size={13} />
                            </button>
                            <button onClick={() => { setEditPosition(p); setShowModal(true) }}
                              title="Modifier"
                              className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                              style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handleDelete(p.id)}
                              title="Supprimer"
                              className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                              style={{ background: 'rgba(255,77,106,0.1)', color: 'var(--red)' }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
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
