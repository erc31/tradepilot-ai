import { NextRequest, NextResponse } from 'next/server'
import { anthropic, SYSTEM_PROMPT } from '@/lib/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, history } = await request.json()

  const [{ data: positions }, { data: trades }, { data: settings }] = await Promise.all([
    supabase.from('positions').select('*').eq('user_id', user.id),
    supabase.from('trades').select('*').eq('user_id', user.id).order('sell_date', { ascending: false }).limit(20),
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
  ])

  const context = `
PORTEFEUILLE ACTUEL:
${positions?.map(p => `- ${p.ticker} (${p.name}): ${p.shares} actions achetées à $${p.buy_price}, levier x${p.leverage}, secteur: ${p.sector}`).join('\n') || 'Aucune position'}

HISTORIQUE TRADES (20 derniers):
${trades?.map(t => `- ${t.ticker}: achat $${t.buy_price} → vente $${t.sell_price}, P&L: ${t.gain_loss?.toFixed(2)}$`).join('\n') || 'Aucun trade clôturé'}

RÈGLES PERSONNELLES:
${settings?.personal_rules?.join('\n') || 'Aucune règle définie'}
`

  const msgs = [
    ...((history || []).slice(-10).map((m: any) => ({ role: m.role, content: m.content }))),
    { role: 'user' as const, content: `Contexte utilisateur:\n${context}\n\nQuestion: ${message}` },
  ]

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: msgs,
    })
    const reply = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json({ reply: `Erreur API: ${e.message}` }, { status: 500 })
  }
}
