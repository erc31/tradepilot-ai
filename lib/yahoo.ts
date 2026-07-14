const YAHOO_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }

async function getYahooChartMeta(symbol: string) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
    { headers: YAHOO_HEADERS }
  )
  const json = await res.json()
  return json.chart?.result?.[0]?.meta
}

export interface YahooQuoteUSD {
  priceLocal: number
  priceUSD: number
  fxRate: number
  currency: string
  isOpen: boolean
  exchange: string
  name: string
  dayChangePercent: number | null
}

export async function getYahooQuoteUSD(symbol: string): Promise<YahooQuoteUSD | null> {
  const meta = await getYahooChartMeta(symbol)
  if (!meta?.regularMarketPrice) return null

  const currency: string = meta.currency || 'USD'
  const priceLocal: number = meta.regularMarketPrice

  let priceUSD = priceLocal
  let fxRate = 1
  if (currency !== 'USD') {
    const fxMeta = await getYahooChartMeta(`${currency}USD=X`)
    const rate: number | undefined = fxMeta?.regularMarketPrice
    if (rate) { fxRate = rate; priceUSD = priceLocal * rate }
  }

  const nowSec = Date.now() / 1000
  const regular = meta.currentTradingPeriod?.regular
  const isOpen = !!regular && nowSec >= regular.start && nowSec < regular.end

  const prevClose: number | undefined = meta.previousClose || meta.chartPreviousClose
  const dayChangePercent = prevClose ? ((priceLocal - prevClose) / prevClose) * 100 : null

  return {
    priceLocal,
    priceUSD,
    fxRate,
    currency,
    isOpen,
    exchange: meta.fullExchangeName || '',
    name: meta.longName || meta.shortName || '',
    dayChangePercent,
  }
}
