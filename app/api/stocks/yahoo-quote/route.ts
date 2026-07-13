import { NextRequest, NextResponse } from 'next/server'

const YAHOO_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }

async function fetchChartMeta(symbol: string) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
    { headers: YAHOO_HEADERS }
  )
  const json = await res.json()
  return json.chart?.result?.[0]?.meta
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol')
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  try {
    const meta = await fetchChartMeta(symbol)
    if (!meta?.regularMarketPrice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const currency: string = meta.currency || 'USD'
    const priceLocal: number = meta.regularMarketPrice

    let priceUSD = priceLocal
    if (currency !== 'USD') {
      const fxMeta = await fetchChartMeta(`${currency}USD=X`)
      const rate: number | undefined = fxMeta?.regularMarketPrice
      if (rate) priceUSD = priceLocal * rate
    }

    const nowSec = Date.now() / 1000
    const regular = meta.currentTradingPeriod?.regular
    const isOpen = !!regular && nowSec >= regular.start && nowSec < regular.end

    return NextResponse.json({
      priceLocal,
      priceUSD,
      currency,
      isOpen,
      exchange: meta.fullExchangeName || '',
      name: meta.longName || meta.shortName || '',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
