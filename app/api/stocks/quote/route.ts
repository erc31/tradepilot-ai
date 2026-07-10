import { NextRequest, NextResponse } from 'next/server'
import { getQuote, getCompanyProfile } from '@/lib/finnhub'

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol')
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  try {
    const [quote, profile] = await Promise.all([
      getQuote(symbol.toUpperCase()),
      getCompanyProfile(symbol.toUpperCase()),
    ])
    return NextResponse.json({ quote, profile })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
