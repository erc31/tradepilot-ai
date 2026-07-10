import { NextResponse } from 'next/server'
import { getEarningsCalendar } from '@/lib/finnhub'

export async function GET() {
  try {
    const today = new Date()
    const from = today.toISOString().split('T')[0]
    const to = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const data = await getEarningsCalendar(from, to)
    return NextResponse.json(data?.earningsCalendar || [])
  } catch {
    return NextResponse.json([])
  }
}
