'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Position } from '@/types'

interface Props {
  position: Position & { buy_price_usd?: number }
  onClose: () => void
  onConfirm: (sellPriceUSD: number, sellDate: string) => Promise<void>
}

export default function SellModal({ position, onClose, onConfirm }: Props) {
  const [sellPrice, setSellPrice] = useState('')
  const [sellDate, setSellDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // buy_price_usd was converted from the native currency (e.g. EUR) using the
  // FX rate at last refresh — apply the same rate to the sell price so both
  // sides of the trade are in the same currency.
  const fxRate = position.buy_price_usd ? position.buy_price_usd / position.buy_price : 1
  const isConverted = Math.abs(fxRate - 1) > 0.0001

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const price = parseFloat(sellPrice)
    if (!price) return
    setSaving(true)
    setError('')
    try {
      await onConfirm(price * fxRate, sellDate)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la clôture')
    }
    setSaving(false)
  }

  const inputStyle = { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Clôturer {position.ticker}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              Prix de vente {isConverted ? '(devise native, comme le prix d\'achat)' : '($)'}
            </label>
            <input type="number" step="any" value={sellPrice} onChange={e => setSellPrice(e.target.value)} required autoFocus
              placeholder="0.00" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Date de vente</label>
            <input type="date" value={sellDate} onChange={e => setSellDate(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
          {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}
          <button type="submit" disabled={saving}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'var(--red)' }}>
            {saving ? 'Clôture...' : 'Confirmer la vente'}
          </button>
        </form>
      </div>
    </div>
  )
}
