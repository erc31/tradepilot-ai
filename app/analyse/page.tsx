'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { Brain, Send, Loader2, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react'
import { AIAnalysis } from '@/types'

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return 'var(--green)'
  if (score >= 60) return '#7ed321'
  if (score >= 40) return 'var(--yellow)'
  if (score >= 20) return '#f5642a'
  return 'var(--red)'
}

const QUICK_QUESTIONS = [
  'Est-ce que je renforce ?',
  'Dois-je vendre ?',
  'Le risque est-il élevé ?',
  'Quelle est la tendance ?',
  'Le secteur est-il fort ?',
  'Levier conseillé ?',
]

interface Message { role: 'user' | 'ai'; content: string }

function AnalyseContent() {
  const searchParams = useSearchParams()
  const [ticker, setTicker] = useState(searchParams.get('ticker') || '')
  const [tickerInput, setTickerInput] = useState(searchParams.get('ticker') || '')
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ticker) runAnalysis()
  }, [ticker])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function runAnalysis() {
    setLoading(true)
    setAnalysis(null)
    setMessages([])
    try {
      const res = await fetch('/api/ai/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: ticker.toUpperCase() }),
      })
      const { type, data } = await res.json()
      if (type === 'analysis') setAnalysis(data)
    } catch {}
    setLoading(false)
  }

  async function sendQuestion(q: string) {
    if (!ticker || !q.trim()) return
    setMessages(m => [...m, { role: 'user', content: q }])
    setQuestion('')
    setChatLoading(true)
    try {
      const res = await fetch('/api/ai/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: ticker.toUpperCase(), question: q }),
      })
      const { data } = await res.json()
      setMessages(m => [...m, { role: 'ai', content: data }])
    } catch {
      setMessages(m => [...m, { role: 'ai', content: "Erreur lors de l'analyse." }])
    }
    setChatLoading(false)
  }

  const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)' }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Analyse IA</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Score et recommandations par Claude</p>
          </div>
        </div>

        {/* Ticker search */}
        <div className="flex gap-3">
          <input
            value={tickerInput}
            onChange={e => setTickerInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && setTicker(tickerInput)}
            placeholder="Entrez un ticker (AAPL, NVDA, TSLA...)"
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={() => setTicker(tickerInput)}
            disabled={loading || !tickerInput}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-60"
            style={{ background: 'var(--accent)' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
            Analyser
          </button>
        </div>

        {loading && (
          <div className="rounded-xl p-12 text-center" style={cardStyle}>
            <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: 'var(--accent)' }} />
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Claude analyse {ticker}...</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Cours, fondamentaux, actualités, consensus analystes</p>
          </div>
        )}

        {analysis && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score */}
            <div className="rounded-xl p-6 flex flex-col items-center justify-center text-center" style={cardStyle}>
              <div className="text-6xl font-black mb-2" style={{ color: SCORE_COLOR(analysis.score) }}>
                {analysis.score}
              </div>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Score IA / 100</div>
              <div className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{ background: `${SCORE_COLOR(analysis.score)}20`, color: SCORE_COLOR(analysis.score) }}>
                {analysis.verdict}
              </div>
              <div className="w-full mt-4 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${analysis.score}%`, background: SCORE_COLOR(analysis.score) }} />
              </div>

              {/* Score scale */}
              <div className="w-full mt-3 flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>

            {/* Resume + Recommandation */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl p-5" style={cardStyle}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>RÉSUMÉ</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{analysis.resume}</p>
              </div>
              <div className="rounded-xl p-5" style={{ background: `rgba(108,99,255,0.08)`, border: '1px solid rgba(108,99,255,0.25)' }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent)' }}>RECOMMANDATION</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{analysis.recommandation}</p>
              </div>
            </div>

            {/* Forces */}
            <div className="rounded-xl p-5" style={cardStyle}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--green)' }}>
                <TrendingUp size={14} /> FORCES
              </h3>
              <ul className="space-y-2">
                {analysis.forces.map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                    <ChevronRight size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--green)' }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Faiblesses */}
            <div className="rounded-xl p-5" style={cardStyle}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--red)' }}>
                <TrendingDown size={14} /> FAIBLESSES
              </h3>
              <ul className="space-y-2">
                {analysis.faiblesses.map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                    <ChevronRight size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--red)' }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Risques + Opportunités */}
            <div className="space-y-4">
              <div className="rounded-xl p-5" style={cardStyle}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--yellow)' }}>
                  <AlertTriangle size={14} /> RISQUES
                </h3>
                <ul className="space-y-2">
                  {analysis.risques.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                      <ChevronRight size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--yellow)' }} />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl p-5" style={cardStyle}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                  <Lightbulb size={14} /> OPPORTUNITÉS
                </h3>
                <ul className="space-y-2">
                  {analysis.opportunites.map((o, i) => (
                    <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                      <ChevronRight size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Chat */}
            <div className="lg:col-span-3 rounded-xl overflow-hidden" style={cardStyle}>
              <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                <Brain size={15} style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Posez vos questions sur {ticker}
                </span>
              </div>

              {/* Quick questions */}
              <div className="px-5 py-3 flex flex-wrap gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
                {QUICK_QUESTIONS.map(q => (
                  <button key={q} onClick={() => sendQuestion(q)}
                    className="px-3 py-1.5 rounded-lg text-xs transition-opacity hover:opacity-70"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    {q}
                  </button>
                ))}
              </div>

              {/* Messages */}
              {messages.length > 0 && (
                <div className="px-5 py-4 space-y-4 max-h-64 overflow-y-auto">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%] rounded-xl px-4 py-2.5 text-sm"
                        style={{
                          background: m.role === 'user' ? 'var(--accent)' : 'var(--surface-2)',
                          color: 'var(--text-primary)',
                        }}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-xl px-4 py-2.5 flex items-center gap-2" style={{ background: 'var(--surface-2)' }}>
                        <Loader2 size={13} className="animate-spin" style={{ color: 'var(--accent)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Claude analyse...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Input */}
              <div className="px-5 py-4 flex gap-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <input
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendQuestion(question)}
                  placeholder="Posez une question sur cette action..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <button onClick={() => sendQuestion(question)}
                  disabled={chatLoading || !question.trim()}
                  className="px-4 py-2.5 rounded-xl text-white disabled:opacity-60"
                  style={{ background: 'var(--accent)' }}>
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {!ticker && !loading && (
          <div className="rounded-xl p-12 text-center" style={cardStyle}>
            <Brain size={40} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--accent)' }} />
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Entrez un ticker pour commencer</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Claude analysera les fondamentaux, le cours, les actualités et le consensus analystes</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default function AnalysePage() {
  return (
    <Suspense fallback={null}>
      <AnalyseContent />
    </Suspense>
  )
}
