'use client'

import { useState, useEffect } from 'react'
import { X, Search, Loader2 } from 'lucide-react'
import { Position } from '@/types'

interface Props {
  position?: Position | null
  onClose: () => void
  onSave: (data: Partial<Position>) => Promise<void>
}

const SECTORS = ['Technologie', 'Santé', 'Semi-conducteurs', 'Biotech', 'Finance', 'Énergie', 'Consommation', 'Immobilier', 'Industrie', 'Autre']

export default function PositionModal({ position, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    ticker: position?.ticker || '',
    name: position?.name || '',
    sector: position?.sector || 'Technologie',
    buy_price: position?.buy_price?.toString() || '',
    shares: position?.shares?.toString() || '',
    leverage: position?.leverage?.toString() || '1',
    buy_date: position?.buy_date || new Date().toISOString().split('T')[0],
    target_price: position?.target_price?.toString() || '',
    stop_loss: position?.stop_loss?.toString() || '',
  })
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  async function searchTicker() {
    if (!form.ticker) return
    setSearching(true)
    try {
      const res = await fetch(`/api/stocks/quote?symbol=${form.ticker.toUpperCase()}`)
      const { quote, profile } = await res.json()
      if (profile?.name) {
        setForm(f => ({
          ...f,
          ticker: form.ticker.toUpperCase(),
          name: profile.name,
          buy_price: f.buy_price || quote?.c?.toString() || '',
        }))
      }
    } catch {}
    setSearching(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      ticker: form.ticker.toUpperCase(),
      name: form.name,
      sector: form.sector,
      buy_price: parseFloat(form.buy_price),
      shares: parseFloat(form.shares),
      leverage: parseFloat(form.leverage),
      buy_date: form.buy_date,
      target_price: form.target_price ? parseFloat(form.target_price) : undefined,
      stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : undefined,
    })
    setSaving(false)
  }

  const inputStyle = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {position ? 'Modifier la position' : 'Ajouter une position'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ticker */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Ticker</label>
            <div className="flex gap-2">
              <input value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))}
                placeholder="AAPL, NVDA, TSLA..." required
                className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle} />
              <button type="button" onClick={searchTicker} disabled={searching}
                className="px-3 py-2.5 rounded-lg text-sm flex items-center gap-1.5 transition-opacity disabled:opacity-60"
                style={{ background: 'var(--accent)', color: 'white' }}>
                {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Chercher
              </button>
            </div>
          </div>

          {/* Nom */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Nom de l'entreprise</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              placeholder="Apple Inc." className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>

          {/* Secteur */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Secteur</label>
            <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle}>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Prix d'achat + Nombre d'actions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Prix d'achat ($)</label>
              <input type="number" step="0.0001" value={form.buy_price}
                onChange={e => setForm(f => ({ ...f, buy_price: e.target.value }))} required
                placeholder="0.00" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Nombre d'actions</label>
              <input type="number" step="0.0001" value={form.shares}
                onChange={e => setForm(f => ({ ...f, shares: e.target.value }))} required
                placeholder="0" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
          </div>

          {/* Levier + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Levier (x)</label>
              <input type="number" step="0.01" min="1" value={form.leverage}
                onChange={e => setForm(f => ({ ...f, leverage: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Date d'achat</label>
              <input type="date" value={form.buy_date}
                onChange={e => setForm(f => ({ ...f, buy_date: e.target.value }))} required
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
          </div>

          {/* Objectif + Stop Loss */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Objectif ($)</label>
              <input type="number" step="0.0001" value={form.target_price}
                onChange={e => setForm(f => ({ ...f, target_price: e.target.value }))}
                placeholder="Optionnel" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Stop Loss ($)</label>
              <input type="number" step="0.0001" value={form.stop_loss}
                onChange={e => setForm(f => ({ ...f, stop_loss: e.target.value }))}
                placeholder="Optionnel" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60 mt-2"
            style={{ background: 'var(--accent)' }}>
            {saving ? 'Enregistrement...' : position ? 'Modifier' : 'Ajouter la position'}
          </button>
        </form>
      </div>
    </div>
  )
}
