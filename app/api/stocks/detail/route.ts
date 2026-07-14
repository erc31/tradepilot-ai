import { NextRequest, NextResponse } from 'next/server'
import { getQuote, getCompanyProfile, getBasicFinancials, getRecommendations, getCompanyNews, getPeers } from '@/lib/finnhub'
import { getYahooQuoteUSD } from '@/lib/yahoo'

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get('ticker')
  const altTicker = request.nextUrl.searchParams.get('alt') || undefined
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  const today = new Date()
  const from = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const to = today.toISOString().split('T')[0]

  const [quote, profile, financials, recommendations, news, peers, yahooQuote] = await Promise.allSettled([
    getQuote(ticker),
    getCompanyProfile(ticker),
    getBasicFinancials(ticker),
    getRecommendations(ticker),
    getCompanyNews(ticker, from, to),
    getPeers(ticker),
    altTicker ? getYahooQuoteUSD(altTicker) : Promise.resolve(null),
  ])

  const q = quote.status === 'fulfilled' ? quote.value : {}
  const p = profile.status === 'fulfilled' ? profile.value : {}
  const f = financials.status === 'fulfilled' ? financials.value?.metric || {} : {}
  const r = recommendations.status === 'fulfilled' ? (recommendations.value || [])[0] : null
  const n = news.status === 'fulfilled' ? (news.value || []).slice(0, 8) : []
  const peerList = peers.status === 'fulfilled' ? (peers.value || []).filter((s: string) => s !== ticker).slice(0, 6) : []
  const yq = yahooQuote.status === 'fulfilled' ? yahooQuote.value : null

  const price = yq ? yq.priceUSD : q.c
  const dayChangePercent = yq ? yq.dayChangePercent : q.dp

  return NextResponse.json({
    ticker,
    name: p.name || yq?.name || ticker,
    logo: p.logo || '',
    sector: p.finnhubIndustry || '',
    exchange: p.exchange || yq?.exchange || '',
    currency: yq?.currency || 'USD',
    price: price ?? null,
    dayChangePercent: dayChangePercent ?? null,
    isOpen: yq?.isOpen ?? null,
    marketCap: p.marketCapitalization ? p.marketCapitalization * 1e6 : null,
    per: f.peBasicExclExtraTTM ?? null,
    eps: f.epsBasicExclExtraTTM ?? null,
    high52: f['52WeekHigh'] ?? null,
    low52: f['52WeekLow'] ?? null,
    beta: f.beta ?? null,
    dividendYield: f.dividendYieldIndicatedAnnual ?? null,
    consensus: r ? { strongBuy: r.strongBuy || 0, buy: r.buy || 0, hold: r.hold || 0, sell: r.sell || 0, strongSell: r.strongSell || 0 } : null,
    peers: peerList,
    news: n.map((a: any) => ({ headline: a.headline, summary: a.summary, url: a.url, datetime: a.datetime, source: a.source })),
  })
}
