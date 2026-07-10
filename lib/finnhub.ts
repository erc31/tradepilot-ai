const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'
const API_KEY = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY

export async function finnhubFetch(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`)
  url.searchParams.set('token', API_KEY!)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Finnhub error: ${res.status}`)
  return res.json()
}

export async function getQuote(symbol: string) {
  return finnhubFetch('/quote', { symbol })
}

export async function getCompanyProfile(symbol: string) {
  return finnhubFetch('/stock/profile2', { symbol })
}

export async function getCompanyNews(symbol: string, from: string, to: string) {
  return finnhubFetch('/company-news', { symbol, from, to })
}

export async function getMarketNews(category = 'general') {
  return finnhubFetch('/news', { category })
}

export async function getBasicFinancials(symbol: string) {
  return finnhubFetch('/stock/metric', { symbol, metric: 'all' })
}

export async function getRecommendations(symbol: string) {
  return finnhubFetch('/stock/recommendation', { symbol })
}

export async function getEarningsCalendar(from: string, to: string) {
  return finnhubFetch('/calendar/earnings', { from, to })
}
