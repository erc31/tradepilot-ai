import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol')
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  try {
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }

    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`,
      { headers }
    )
    const json = await res.json()
    const quote = json.quoteResponse?.result?.[0]
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const currency: string = quote.currency || 'USD'
    const priceLocal: number = quote.regularMarketPrice

    let priceUSD = priceLocal
    if (currency !== 'USD') {
      const fxRes = await fetch(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${currency}USD%3DX`,
        { headers }
      )
      const fxJson = await fxRes.json()
      const rate: number | undefined = fxJson.quoteResponse?.result?.[0]?.regularMarketPrice
      if (rate) priceUSD = priceLocal * rate
    }

    return NextResponse.json({
      priceLocal,
      priceUSD,
      currency,
      isOpen: quote.marketState === 'REGULAR',
      exchange: quote.fullExchangeName || '',
      name: quote.shortName || quote.longName || '',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
