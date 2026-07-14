import { NextRequest, NextResponse } from 'next/server'
import { getYahooChartSeries } from '@/lib/yahoo'

const ALLOWED_RANGES: Record<string, string> = {
  '1mo': '1d',
  '6mo': '1d',
  '1y': '1wk',
  '5y': '1mo',
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol')
  const range = request.nextUrl.searchParams.get('range') || '6mo'
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })
  if (!(range in ALLOWED_RANGES)) return NextResponse.json({ error: 'invalid range' }, { status: 400 })

  try {
    const series = await getYahooChartSeries(symbol, range, ALLOWED_RANGES[range])
    return NextResponse.json({ series })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
