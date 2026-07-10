'use client'

import { useState, useRef, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { MessageSquare, Send, Loader2, Bot, User } from 'lucide-react'

const SUGGESTIONS = [
  'Comment se porte mon portefeuille ?',
  'Quelles sont mes positions les plus risquées ?',
  'Est-ce que je suis trop exposé à un secteur ?',
  'Analyse mon comportement de trading',
  'Quel est mon taux de réussite ?',
  'Le levier est-il conseillé aujourd\'hui ?',
]

interface Message { role: 'user' | 'assistant'; content: string }

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis TradePilot AI, votre coach personnel de trading. Je connais toutes vos positions, vos performances et votre historique. Comment puis-je vous aider ?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage(msg: string) {
    if (!msg.trim()) return
    setMessages(m => [...m, { role: 'user', content: msg }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages }),
      })
      const { reply } = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: reply || 'Désolé, une erreur est survenue.' }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Erreur de connexion. Vérifiez vos crédits Anthropic.' }])
    }
    setLoading(false)
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <MessageSquare size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Assistant IA</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Votre coach personnel de trading</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto rounded-xl p-5 space-y-4 mb-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: m.role === 'assistant' ? 'var(--accent)' : 'var(--surface-2)' }}>
                {m.role === 'assistant' ? <Bot size={13} className="text-white" /> : <User size={13} style={{ color: 'var(--text-secondary)' }} />}
              </div>
              <div className="max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed"
                style={{
                  background: m.role === 'user' ? 'var(--accent)' : 'var(--surface-2)',
                  color: 'var(--text-primary)',
                }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                <Bot size={13} className="text-white" />
              </div>
              <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: 'var(--surface-2)' }}>
                <Loader2 size={13} className="animate-spin" style={{ color: 'var(--accent)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>En train de réfléchir...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                className="px-3 py-1.5 rounded-lg text-xs transition-opacity hover:opacity-70"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && sendMessage(input)}
            placeholder="Posez une question à votre coach..."
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-xl text-white disabled:opacity-60"
            style={{ background: 'var(--accent)' }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
