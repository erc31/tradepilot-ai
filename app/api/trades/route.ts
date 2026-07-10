import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('trades').select('*').eq('user_id', user.id).order('sell_date', { ascending: false })
  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const gain_loss = (body.sell_price - body.buy_price) * body.shares * (body.leverage || 1)
  const gain_loss_percent = ((body.sell_price - body.buy_price) / body.buy_price) * 100 * (body.leverage || 1)
  const { data, error } = await supabase.from('trades').insert({ ...body, user_id: user.id, gain_loss, gain_loss_percent }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
