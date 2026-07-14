'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Activity, Brain } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Position } from '@/types'

type PositionWithPrice = Position & { current_price: number; buy_price_usd?: number }

function buyPriceUSD(p: PositionWithPrice) {
  return p.buy_price_usd ?? p.buy_price
}

export default function DashboardPage() {
  const router = useRouter()
  const [positions, setPositions] = useState<PositionWithPrice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/positions')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPositions(data) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (positions.length === 0) return
    const tickers = [...new Set(positions.map(p => p.ticker))]
    const priceMap: Record<string, number> = {}
    const fxMap: Record<string, number> = {}

    Promise.all(tickers.map(async (ticker) => {
      try {
        const anyPos = positions.find(p => p.ticker === ticker)
        const altTicker = anyPos?.alt_ticker

        if (altTicker) {
          const res = await fetch(`/api/stocks/yahoo-quote?symbol=${altTicker}`)
          const data = await res.json()
          if (data.priceUSD) priceMap[ticker] = data.priceUSD
          if (data.priceUSD && data.priceLocal) fxMap[ticker] = data.priceUSD / data.priceLocal
        } else {
          const res = await fetch(`/api/stocks/quote?symbol=${ticker}`)
          const { quote } = await res.json()
          if (quote?.c) priceMap[ticker] = quote.c
        }
      } catch {}
    })).then(() => {
      setPositions(prev => prev.map(p => ({
        ...p,
        current_price: priceMap[p.ticker] || p.current_price,
        buy_price_usd: fxMap[p.ticker] ? p.buy_price * fxMap[p.ticker] : p.buy_price_usd,
      })))
    })
  }, [positions.length])

  // Group by ticker
  const grouped = positions.reduce((acc, p) => {
    if (!acc[p.ticker]) acc[p.ticker] = []
    acc[p.ticker].push(p)
    return acc
  }, {} as Record<string, PositionWithPrice[]>)

  const totalValue = positions.reduce((s, p) => s + (p.current_price || buyPriceUSD(p)) * p.shares, 0)
  const totalCost = positions.reduce((s, p) => s + buyPriceUSD(p) * p.shares, 0)
  const totalGL = totalValue - totalCost
  const totalGLPct = totalCost > 0 ? (totalGL / totalCost) * 100 : 0
  const nbPositions = Object.keys(grouped).length

  const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)' }

  const stats = [
    { label: 'Valeur totale', value: loading ? '…' : `$${totalValue.toFixed(2)}`, icon: DollarSign, color: 'var(--accent)' },
    { label: 'Gain / Perte total', value: loading ? '…' : `${totalGL >= 0 ? '+' : ''}${totalGL.toFixed(2)} $`, icon: totalGL >= 0 ? TrendingUp : TrendingDown, color: totalGL >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: 'Performance', value: loading ? '…' : `${totalGLPct >= 0 ? '+' : ''}${totalGLPct.toFixed(2)}%`, icon: Activity, color: totalGLPct >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: 'Positions ouvertes', value: loading ? '…' : String(nbPositions), icon: Briefcase, color: 'var(--accent)' },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Vue d'ensemble de votre portefeuille</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-5 flex items-start gap-4" style={cardStyle}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}20` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</div>
                <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Positions table */}
        <div className="rounded-xl overflow-hidden" style={cardStyle}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Mes positions</h2>
            <button onClick={() => router.push('/portfolio')} className="text-xs hover:opacity-70"
              style={{ color: 'var(--accent)' }}>
              Voir tout →
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>Chargement...</div>
          ) : nbPositions === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Aucune position pour l'instant</p>
              <button onClick={() => router.push('/portfolio')}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: 'var(--accent)' }}>
                Ajouter une position
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Action', 'Cours actuel', 'Variation', 'Gain/Perte', 'Valeur', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium"
                      style={{ color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).map(([ticker, lots]) => {
                  const current = lots[0].current_price || buyPriceUSD(lots[0])
                  const totalShares = lots.reduce((s, l) => s + l.shares, 0)
                  const avgBuy = lots.reduce((s, l) => s + buyPriceUSD(l) * l.shares, 0) / totalShares
                  const gl = lots.reduce((s, l) => s + (current - buyPriceUSD(l)) * l.shares, 0)
                  const pct = ((current - avgBuy) / avgBuy) * 100
                  const pos = gl >= 0
                  return (
                    <tr key={ticker} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-3">
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{ticker}</div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{lots[0].name}</div>
                      </td>
                      <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                        ${current.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 font-medium" style={{ color: pos ? 'var(--green)' : 'var(--red)' }}>
                        {pos ? '+' : ''}{pct.toFixed(2)}%
                      </td>
                      <td className="px-5 py-3 font-semibold" style={{ color: pos ? 'var(--green)' : 'var(--red)' }}>
                        {gl >= 0 ? '+' : ''}{gl.toFixed(2)} $
                      </td>
                      <td className="px-5 py-3" style={{ color: 'var(--text-primary)' }}>
                        ${(current * totalShares).toFixed(2)}
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => router.push(`/analyse?ticker=${ticker}`)}
                          className="p-1.5 rounded-lg hover:opacity-70"
                          style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--accent)' }}>
                          <Brain size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
