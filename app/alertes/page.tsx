'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Bell, Plus, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react'

const ALERT_TYPES = [
  { key: 'price_above', label: 'Prix au-dessus de' },
  { key: 'price_below', label: 'Prix en-dessous de' },
  { key: 'earnings', label: 'Résultats demain' },
  { key: 'unusual_move', label: 'Mouvement inhabituel' },
]

export default function AlertesPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ticker: '', type: 'price_above', value: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const inputStyle = { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

  async function fetchAlerts() {
    const res = await fetch('/api/alerts')
    const data = await res.json()
    if (Array.isArray(data)) setAlerts(data)
  }

  useEffect(() => { fetchAlerts() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, value: form.value ? parseFloat(form.value) : null }),
    })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
      setError(error || "Échec de l'enregistrement")
      setSaving(false)
      return
    }
    setShowForm(false)
    setForm({ ticker: '', type: 'price_above', value: '' })
    await fetchAlerts()
    setSaving(false)
  }

  async function toggleAlert(id: string, is_active: boolean) {
    setError('')
    const res = await fetch(`/api/alerts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !is_active }),
    })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
      setError(error || 'Échec de la mise à jour')
      return
    }
    await fetchAlerts()
  }

  async function deleteAlert(id: string) {
    setError('')
    const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
      setError(error || 'Échec de la suppression')
      return
    }
    await fetchAlerts()
  }

  const needsValue = (type: string) => ['price_above', 'price_below'].includes(type)

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
              <Bell size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Alertes</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{alerts.filter(a => a.is_active).length} active{alerts.filter(a => a.is_active).length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'var(--accent)' }}>
            <Plus size={16} /> Nouvelle alerte
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <Bell size={40} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--accent)' }} />
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Aucune alerte configurée</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Créez des alertes pour être notifié des mouvements importants</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="rounded-xl px-5 py-4 flex items-center justify-between"
                style={{ background: 'var(--surface)', border: `1px solid ${alert.is_active ? 'var(--border)' : 'var(--border)'}`, opacity: alert.is_active ? 1 : 0.5 }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: alert.is_active ? 'rgba(108,99,255,0.15)' : 'var(--surface-2)' }}>
                    <Bell size={14} style={{ color: alert.is_active ? 'var(--accent)' : 'var(--text-secondary)' }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {alert.ticker} — {ALERT_TYPES.find(t => t.key === alert.type)?.label}
                      {alert.value && <span style={{ color: 'var(--accent)' }}> ${alert.value}</span>}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Créée le {new Date(alert.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleAlert(alert.id, alert.is_active)} className="hover:opacity-70">
                    {alert.is_active
                      ? <ToggleRight size={22} style={{ color: 'var(--accent)' }} />
                      : <ToggleLeft size={22} style={{ color: 'var(--text-secondary)' }} />}
                  </button>
                  <button onClick={() => deleteAlert(alert.id)} className="p-1.5 hover:opacity-70" style={{ color: 'var(--red)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Nouvelle alerte</h2>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-secondary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Ticker</label>
                <input value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} required
                  placeholder="AAPL" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Type d'alerte</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle}>
                  {ALERT_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              {needsValue(form.type) && (
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Prix ($)</label>
                  <input type="number" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required
                    placeholder="0.00" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
                </div>
              )}
              {error && (
                <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>
              )}
              <button type="submit" disabled={saving}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--accent)' }}>
                {saving ? 'Enregistrement...' : 'Créer l\'alerte'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
