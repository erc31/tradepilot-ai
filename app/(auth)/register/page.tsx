'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Zap, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <CheckCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--green)' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Compte créé !</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Un email de confirmation a été envoyé à <strong>{email}</strong>. Confirmez votre adresse puis connectez-vous.
          </p>
          <Link href="/login"
            className="inline-block py-2.5 px-6 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'var(--accent)' }}>
            Aller à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>TradePilot</span>
            <span className="text-xl font-bold ml-1" style={{ color: 'var(--accent)' }}>AI</span>
          </div>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Créer un compte</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Commencez à trader intelligemment</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="vous@email.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Mot de passe</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Minimum 6 caractères"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg"
                style={{ background: 'rgba(255,77,106,0.1)', color: 'var(--red)', border: '1px solid rgba(255,77,106,0.2)' }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: 'var(--accent)' }}>
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            Déjà un compte ?{' '}
            <Link href="/login" className="font-medium" style={{ color: 'var(--accent)' }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
