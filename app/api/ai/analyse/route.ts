import { NextRequest, NextResponse } from 'next/server'
import { anthropic, SYSTEM_PROMPT } from '@/lib/anthropic'
import { getQuote, getCompanyProfile, getBasicFinancials, getRecommendations, getCompanyNews } from '@/lib/finnhub'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticker, question } = await request.json()
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  // Fetch market data in parallel
  const today = new Date()
  const from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const to = today.toISOString().split('T')[0]

  const [quote, profile, financials, recommendations, news] = await Promise.allSettled([
    getQuote(ticker),
    getCompanyProfile(ticker),
    getBasicFinancials(ticker),
    getRecommendations(ticker),
    getCompanyNews(ticker, from, to),
  ])

  const q = quote.status === 'fulfilled' ? quote.value : {}
  const p = profile.status === 'fulfilled' ? profile.value : {}
  const f = financials.status === 'fulfilled' ? financials.value?.metric || {} : {}
  const r = recommendations.status === 'fulfilled' ? (recommendations.value || []).slice(0, 1)[0] : {}
  const n = news.status === 'fulfilled' ? (news.value || []).slice(0, 5) : []

  // Get user's position for this ticker
  const { data: position } = await supabase
    .from('positions')
    .select('*')
    .eq('user_id', user.id)
    .eq('ticker', ticker)
    .single()

  const marketContext = `
TICKER: ${ticker}
ENTREPRISE: ${p.name || 'N/A'} | SECTEUR: ${p.finnhubIndustry || 'N/A'}
COURS ACTUEL: $${q.c || 'N/A'} | VARIATION JOUR: ${q.dp?.toFixed(2) || 'N/A'}%
HAUT 52 SEM: $${f['52WeekHigh'] || 'N/A'} | BAS 52 SEM: $${f['52WeekLow'] || 'N/A'}
PER: ${f.peBasicExclExtraTTM?.toFixed(2) || 'N/A'} | EPS: ${f.epsBasicExclExtraTTM?.toFixed(2) || 'N/A'}
CAPITALISATION: $${p.marketCapitalization ? (p.marketCapitalization * 1e6 / 1e9).toFixed(2) + 'B' : 'N/A'}
BETA: ${f.beta || 'N/A'}
CONSENSUS ANALYSTES: ${r ? `Achat fort: ${r.strongBuy || 0} | Achat: ${r.buy || 0} | Neutre: ${r.hold || 0} | Vente: ${r.sell || 0}` : 'N/A'}
${position ? `\nPOSITION UTILISATEUR: acheté à $${position.buy_price} | ${position.shares} actions | levier x${position.leverage} | P&L: ${(((q.c || position.buy_price) - position.buy_price) * position.shares * position.leverage).toFixed(2)}$` : ''}
ACTUALITÉS RÉCENTES: ${n.map((a: any) => a.headline).join(' | ') || 'Aucune'}
`

  const userPrompt = question
    ? `Données de marché:\n${marketContext}\n\nQuestion de l'utilisateur: ${question}\n\nRéponds directement à cette question comme un trader professionnel.`
    : `Données de marché:\n${marketContext}\n\nFais une analyse complète de cette action. Réponds UNIQUEMENT en JSON valide avec cette structure exacte:\n{"score":number,"verdict":"Très mauvais"|"Mauvais"|"Neutre"|"Bon"|"Excellent","forces":["..."],"faiblesses":["..."],"risques":["..."],"opportunites":["..."],"resume":"...","recommandation":"..."}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = message.content[0].type === 'text' ? message.content[0].text : ''

  if (!question) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const analysis = JSON.parse(jsonMatch?.[0] || content)

      // Save analysis to DB
      await supabase.from('ai_analyses').insert({
        user_id: user.id,
        ticker,
        ...analysis,
      })

      return NextResponse.json({ type: 'analysis', data: analysis })
    } catch {
      return NextResponse.json({ type: 'text', data: content })
    }
  }

  return NextResponse.json({ type: 'text', data: content })
}
