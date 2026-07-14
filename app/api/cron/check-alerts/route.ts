import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { getQuote, getEarningsCalendar } from '@/lib/finnhub'

const UNUSUAL_MOVE_THRESHOLD = 5 // percent

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabaseClient()

  // Only alerts that are active and haven't already fired — the user must
  // dismiss a triggered alert (from the Alertes page) before it can fire again.
  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('is_active', true)
    .is('triggered_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!alerts || alerts.length === 0) return NextResponse.json({ checked: 0, triggered: 0 })

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const tickers = [...new Set(alerts.map(a => a.ticker))]

  const quotes: Record<string, { c: number; dp: number } | null> = {}
  await Promise.all(tickers.map(async (ticker) => {
    try {
      quotes[ticker] = await getQuote(ticker)
    } catch {
      quotes[ticker] = null
    }
  }))

  let earningsTickers = new Set<string>()
  try {
    const earnings = await getEarningsCalendar(tomorrow, tomorrow)
    earningsTickers = new Set((earnings?.earningsCalendar || []).map((e: { symbol: string }) => e.symbol))
  } catch {}

  const toTrigger: { id: string; message: string }[] = []

  for (const alert of alerts) {
    const q = quotes[alert.ticker]
    if (alert.type === 'price_above' && q?.c != null && alert.value != null && q.c >= alert.value) {
      toTrigger.push({ id: alert.id, message: `${alert.ticker} a atteint $${q.c.toFixed(2)} (objectif: $${alert.value})` })
    } else if (alert.type === 'price_below' && q?.c != null && alert.value != null && q.c <= alert.value) {
      toTrigger.push({ id: alert.id, message: `${alert.ticker} est descendu à $${q.c.toFixed(2)} (seuil: $${alert.value})` })
    } else if (alert.type === 'unusual_move' && q?.dp != null && Math.abs(q.dp) >= UNUSUAL_MOVE_THRESHOLD) {
      toTrigger.push({ id: alert.id, message: `${alert.ticker} bouge de ${q.dp >= 0 ? '+' : ''}${q.dp.toFixed(2)}% aujourd'hui` })
    } else if (alert.type === 'earnings' && earningsTickers.has(alert.ticker)) {
      toTrigger.push({ id: alert.id, message: `${alert.ticker} publie ses résultats demain` })
    }
  }

  await Promise.all(toTrigger.map(({ id, message }) =>
    supabase.from('alerts').update({ triggered_at: new Date().toISOString(), triggered_message: message }).eq('id', id)
  ))

  return NextResponse.json({ checked: alerts.length, triggered: toTrigger.length })
}
