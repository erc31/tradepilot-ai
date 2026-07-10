import { NextResponse } from 'next/server'
import { getMarketNews } from '@/lib/finnhub'

export async function GET() {
  try {
    const news = await getMarketNews('general')
    return NextResponse.json(news)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
