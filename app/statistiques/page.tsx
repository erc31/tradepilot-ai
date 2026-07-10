'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { BarChart2, TrendingUp, TrendingDown, Target, Clock, Trophy, AlertCircle } from 'lucide-react'

export default function StatistiquesPage() {
  const [positions, setPositions] = useState<any[]>([])
  const [trades, setTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/positions').then(r => r.json()),
      fetch('/api/trades').then(r => r.json()),
    ]).then(([pos, tr]) => {
      setPositions(Array.isArray(pos) ? pos : [])
      setTrades(Array.isArray(tr) ? tr : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const allTrades = trades
  const winners = allTrades.filter(t => (t.gain_loss || 0) > 0)
  const losers = allTrades.filter(t => (t.gain_loss || 0) <= 0)
  const totalGain = allTrades.reduce((s, t) => s + (t.gain_loss || 0), 0)
  const avgGain = winners.length > 0 ? winners.reduce((s, t) => s + (t.gain_loss || 0), 0) / winners.length : 0
  const avgLoss = losers.length > 0 ? losers.reduce((s, t) => s + (t.gain_loss || 0), 0) / losers.length : 0
  const winRate = allTrades.length > 0 ? (winners.length / allTrades.length) * 100 : 0
  const bestTrade = allTrades.reduce((best, t) => (!best || t.gain_loss > best.gain_loss) ? t : best, null)
  const worstTrade = allTrades.reduce((worst, t) => (!worst || t.gain_loss < worst.gain_loss) ? t : worst, null)

  const stats = [
    { label: 'Trades clôturés', value: allTrades.length.toString(), icon: BarChart2, color: 'var(--accent)' },
    { label: 'Trades gagnants', value: `${winners.length} (${winRate.toFixed(0)}%)`, icon: TrendingUp, color: 'var(--green)' },
    { label: 'Trades perdants', value: losers.length.toString(), icon: TrendingDown, color: 'var(--red)' },
    { label: 'Gain total', value: `${totalGain >= 0 ? '+' : ''}${totalGain.toFixed(2)} $`, icon: Target, color: totalGain >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: 'Gain moyen', value: avgGain > 0 ? `+${avgGain.toFixed(2)} $` : '—', icon: TrendingUp, color: 'var(--green)' },
    { label: 'Perte moyenne', value: avgLoss < 0 ? `${avgLoss.toFixed(2)} $` : '—', icon: TrendingDown, color: 'var(--red)' },
  ]

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-2" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <BarChart2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Statistiques</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Performance globale de votre trading</p>
          </div>
        </div>

        {allTrades.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <BarChart2 size={40} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--accent)' }} />
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Aucun trade clôturé</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Les statistiques apparaîtront après vos premières ventes</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-xl p-5 flex items-start gap-4"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}20` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</div>
                    <div className="text-xl font-bold" style={{ color }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Win rate bar */}
            <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex justify-between text-sm mb-3">
                <span style={{ color: 'var(--green)' }}>Gagnants {winners.length}</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Taux de réussite {winRate.toFixed(1)}%</span>
                <span style={{ color: 'var(--red)' }}>Perdants {losers.length}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                <div className="h-full rounded-full" style={{ width: `${winRate}%`, background: 'var(--green)' }} />
              </div>
            </div>

            {/* Best / Worst */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {bestTrade && (
                <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy size={14} style={{ color: 'var(--yellow)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Meilleur trade</span>
                  </div>
                  <div className="text-2xl font-black" style={{ color: 'var(--green)' }}>+{bestTrade.gain_loss?.toFixed(2)} $</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{bestTrade.ticker} — {bestTrade.gain_loss_percent?.toFixed(2)}%</div>
                </div>
              )}
              {worstTrade && (
                <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={14} style={{ color: 'var(--red)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Pire trade</span>
                  </div>
                  <div className="text-2xl font-black" style={{ color: 'var(--red)' }}>{worstTrade.gain_loss?.toFixed(2)} $</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{worstTrade.ticker} — {worstTrade.gain_loss_percent?.toFixed(2)}%</div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Positions actuelles */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Positions actuelles ({positions.length})
            </span>
          </div>
          {positions.length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>Aucune position ouverte.</div>
          ) : (
            positions.map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between border-b last:border-0"
                style={{ borderColor: 'var(--border)' }}>
                <div>
                  <span className="font-bold text-sm mr-2" style={{ color: 'var(--text-primary)' }}>{p.ticker}</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>{p.shares} actions</span>
                  <span style={{ color: 'var(--text-secondary)' }}>acheté ${p.buy_price}</span>
                  {p.leverage > 1 && <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--yellow)' }}>x{p.leverage}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}
