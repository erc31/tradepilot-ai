'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Settings, Plus, X, Save } from 'lucide-react'

export default function ParametresPage() {
  const [form, setForm] = useState({
    monthly_budget: '',
    max_risk: '',
    max_leverage: '',
    annual_target: '',
    max_positions: '',
    personal_rules: [] as string[],
  })
  const [newRule, setNewRule] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const inputStyle = { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data && !data.error) {
        setForm({
          monthly_budget: data.monthly_budget?.toString() || '',
          max_risk: data.max_risk?.toString() || '',
          max_leverage: data.max_leverage?.toString() || '',
          annual_target: data.annual_target?.toString() || '',
          max_positions: data.max_positions?.toString() || '',
          personal_rules: data.personal_rules || [],
        })
      } else if (data?.error) {
        setError(data.error)
      }
    }).catch(() => setError('Impossible de charger les paramètres'))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthly_budget: form.monthly_budget ? parseFloat(form.monthly_budget) : null,
        max_risk: form.max_risk ? parseFloat(form.max_risk) : null,
        max_leverage: form.max_leverage ? parseFloat(form.max_leverage) : null,
        annual_target: form.annual_target ? parseFloat(form.annual_target) : null,
        max_positions: form.max_positions ? parseInt(form.max_positions) : null,
        personal_rules: form.personal_rules,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
      setError(error || "Échec de l'enregistrement")
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addRule() {
    if (!newRule.trim()) return
    setForm(f => ({ ...f, personal_rules: [...f.personal_rules, newRule.trim()] }))
    setNewRule('')
  }

  function removeRule(i: number) {
    setForm(f => ({ ...f, personal_rules: f.personal_rules.filter((_, idx) => idx !== i) }))
  }

  const EXAMPLE_RULES = [
    'Jamais de levier avant les résultats',
    'Maximum 10% du capital par position',
    'Toujours prendre des bénéfices à +20%',
    'Stop loss obligatoire à -10%',
  ]

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Settings size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Paramètres</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Vos règles et limites de trading</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Budget & Limites */}
          <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Budget & Limites</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'monthly_budget', label: 'Budget mensuel (€)', placeholder: 'ex: 500' },
                { key: 'max_risk', label: 'Risque maximum (%)', placeholder: 'ex: 10' },
                { key: 'max_leverage', label: 'Levier maximum', placeholder: 'ex: 5' },
                { key: 'annual_target', label: 'Objectif annuel (%)', placeholder: 'ex: 30' },
                { key: 'max_positions', label: 'Nb positions max', placeholder: 'ex: 10' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                  <input type="number" step="0.01" value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
                </div>
              ))}
            </div>
          </div>

          {/* Règles personnelles */}
          <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Règles personnelles</h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              L'IA les prendra en compte dans ses recommandations
            </p>

            {form.personal_rules.map((rule, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{rule}</span>
                <button type="button" onClick={() => removeRule(i)} className="hover:opacity-70" style={{ color: 'var(--red)' }}>
                  <X size={14} />
                </button>
              </div>
            ))}

            <div className="flex gap-2">
              <input value={newRule} onChange={e => setNewRule(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRule())}
                placeholder="Ajouter une règle..." className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
              <button type="button" onClick={addRule} className="px-3 py-2.5 rounded-lg text-white" style={{ background: 'var(--accent)' }}>
                <Plus size={16} />
              </button>
            </div>

            {form.personal_rules.length === 0 && (
              <div>
                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Exemples :</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_RULES.map(r => (
                    <button key={r} type="button" onClick={() => setForm(f => ({ ...f, personal_rules: [...f.personal_rules, r] }))}
                      className="px-2.5 py-1 rounded-lg text-xs hover:opacity-70"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      + {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>
          )}
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: saved ? 'var(--green)' : 'var(--accent)' }}>
            <Save size={15} />
            {saved ? 'Enregistré !' : saving ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
        </form>
      </div>
    </AppLayout>
  )
}
