'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { BookOpen, Plus, Trash2, TrendingUp, TrendingDown, X } from 'lucide-react'

interface JournalEntry {
  id: string
  ticker: string
  type: 'buy' | 'sell'
  why: string
  objective?: string
  risk?: string
  leverage?: number
  lesson?: string
  created_at: string
}

const inputStyle = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ticker: '', type: 'buy' as 'buy' | 'sell', why: '', objective: '', risk: '', leverage: '', lesson: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function fetchEntries() {
    const res = await fetch('/api/journal')
    const data = await res.json()
    if (Array.isArray(data)) setEntries(data)
  }

  useEffect(() => { fetchEntries() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, leverage: form.leverage ? parseFloat(form.leverage) : null }),
    })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
      setError(error || "Échec de l'enregistrement")
      setSaving(false)
      return
    }
    setShowForm(false)
    setForm({ ticker: '', type: 'buy', why: '', objective: '', risk: '', leverage: '', lesson: '' })
    await fetchEntries()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette entrée ?')) return
    setError('')
    const res = await fetch('/api/journal', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
      setError(error || 'Échec de la suppression')
      return
    }
    await fetchEntries()
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {error && !showForm && (
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid var(--red)', color: 'var(--red)' }}>
            {error}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Journal de Trading</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{entries.length} entrée{entries.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'var(--accent)' }}>
            <Plus size={16} /> Nouvelle entrée
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <BookOpen size={40} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--accent)' }} />
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Aucune entrée pour l'instant</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Notez vos décisions avant chaque achat et vos leçons après chaque vente</p>
            <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--accent)' }}>
              Commencer le journal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.id} className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: entry.type === 'buy' ? 'rgba(0,200,150,0.15)' : 'rgba(255,77,106,0.15)' }}>
                      {entry.type === 'buy'
                        ? <TrendingUp size={15} style={{ color: 'var(--green)' }} />
                        : <TrendingDown size={15} style={{ color: 'var(--red)' }} />}
                    </div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {entry.ticker} — <span style={{ color: entry.type === 'buy' ? 'var(--green)' : 'var(--red)' }}>
                          {entry.type === 'buy' ? 'Achat' : 'Vente'}
                        </span>
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(entry.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(entry.id)} className="p-1.5 rounded-lg hover:opacity-70"
                    style={{ color: 'var(--red)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div><span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Pourquoi : </span>
                    <span style={{ color: 'var(--text-primary)' }}>{entry.why}</span></div>
                  {entry.objective && <div><span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Objectif : </span>
                    <span style={{ color: 'var(--text-primary)' }}>{entry.objective}</span></div>}
                  {entry.risk && <div><span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Risque : </span>
                    <span style={{ color: 'var(--text-primary)' }}>{entry.risk}</span></div>}
                  {entry.leverage && <div><span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Levier : </span>
                    <span style={{ color: 'var(--yellow)' }}>x{entry.leverage}</span></div>}
                  {entry.lesson && (
                    <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)' }}>
                      <span className="font-medium text-xs" style={{ color: 'var(--accent)' }}>LEÇON : </span>
                      <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{entry.lesson}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Nouvelle entrée</h2>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-secondary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Ticker</label>
                  <input value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} required
                    placeholder="AAPL" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'buy' | 'sell' }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle}>
                    <option value="buy">Achat</option>
                    <option value="sell">Vente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                  {form.type === 'buy' ? 'Pourquoi j\'achète ?' : 'Pourquoi j\'ai vendu ?'} *
                </label>
                <textarea value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))} required rows={3}
                  placeholder="Ma thèse d'investissement..." className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none" style={inputStyle} />
              </div>
              {form.type === 'buy' ? (
                <>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Objectif</label>
                    <input value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}
                      placeholder="Prix cible, événement attendu..." className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Risque identifié</label>
                      <input value={form.risk} onChange={e => setForm(f => ({ ...f, risk: e.target.value }))}
                        placeholder="Ex: résultats décevants" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Levier</label>
                      <input type="number" step="0.1" value={form.leverage} onChange={e => setForm(f => ({ ...f, leverage: e.target.value }))}
                        placeholder="1" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Ce que j'ai appris</label>
                  <textarea value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))} rows={3}
                    placeholder="Leçon tirée de ce trade..." className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none" style={inputStyle} />
                </div>
              )}
              {error && (
                <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>
              )}
              <button type="submit" disabled={saving}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--accent)' }}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
