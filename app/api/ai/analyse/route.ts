import { NextRequest, NextResponse } from 'next/server'
import { anthropic, SYSTEM_PROMPT } from '@/lib/anthropic'
import { getQuote, getCompanyProfile, getBasicFinancials, getRecommendations, getCompanyNews } from '@/lib/finnhub'
import { getYahooQuoteUSD } from '@/lib/yahoo'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticker, question } = await request.json()
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  // Get user's position for this ticker (needed up front to know if it's an
  // EU stock tracked via alt_ticker, which changes where the price comes from)
  const { data: position } = await supabase
    .from('positions')
    .select('*')
    .eq('user_id', user.id)
    .eq('ticker', ticker)
    .single()

  // Fetch market data in parallel
  const today = new Date()
  const from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const to = today.toISOString().split('T')[0]

  const [quote, profile, financials, recommendations, news, yahooQuote] = await Promise.allSettled([
    getQuote(ticker),
    getCompanyProfile(ticker),
    getBasicFinancials(ticker),
    getRecommendations(ticker),
    getCompanyNews(ticker, from, to),
    position?.alt_ticker ? getYahooQuoteUSD(position.alt_ticker) : Promise.resolve(null),
  ])

  const q = quote.status === 'fulfilled' ? quote.value : {}
  const p = profile.status === 'fulfilled' ? profile.value : {}
  const f = financials.status === 'fulfilled' ? financials.value?.metric || {} : {}
  const r = recommendations.status === 'fulfilled' ? (recommendations.value || []).slice(0, 1)[0] : {}
  const n = news.status === 'fulfilled' ? (news.value || []).slice(0, 5) : []
  const yq = yahooQuote.status === 'fulfilled' ? yahooQuote.value : null

  // For EU positions (alt_ticker), the live price and the FX-converted buy
  // price must come from the same source (Yahoo), otherwise P&L mixes EUR
  // buy prices with a USD current price (or an unrelated Finnhub quote).
  const currentPriceUSD = yq ? yq.priceUSD : q.c
  const buyPriceUSD = yq ? position.buy_price * yq.fxRate : position?.buy_price

  const marketContext = `
TICKER: ${ticker}
ENTREPRISE: ${p.name || yq?.name || 'N/A'} | SECTEUR: ${p.finnhubIndustry || 'N/A'}
COURS ACTUEL: $${currentPriceUSD?.toFixed(2) || 'N/A'} | VARIATION JOUR: ${q.dp?.toFixed(2) || 'N/A'}%
HAUT 52 SEM: $${f['52WeekHigh'] || 'N/A'} | BAS 52 SEM: $${f['52WeekLow'] || 'N/A'}
PER: ${f.peBasicExclExtraTTM?.toFixed(2) || 'N/A'} | EPS: ${f.epsBasicExclExtraTTM?.toFixed(2) || 'N/A'}
CAPITALISATION: $${p.marketCapitalization ? (p.marketCapitalization * 1e6 / 1e9).toFixed(2) + 'B' : 'N/A'}
BETA: ${f.beta || 'N/A'}
CONSENSUS ANALYSTES: ${r ? `Achat fort: ${r.strongBuy || 0} | Achat: ${r.buy || 0} | Neutre: ${r.hold || 0} | Vente: ${r.sell || 0}` : 'N/A'}
${position ? `\nPOSITION UTILISATEUR: acheté à $${buyPriceUSD?.toFixed(2)} | ${position.shares} actions | levier x${position.leverage} | P&L: ${(((currentPriceUSD || buyPriceUSD) - buyPriceUSD) * position.shares * position.leverage).toFixed(2)}$` : ''}
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
