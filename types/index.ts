export interface Position {
  id: string
  user_id: string
  ticker: string
  name: string
  logo?: string
  buy_price: number
  current_price: number
  shares: number
  leverage: number
  sector: string
  buy_date: string
  target_price?: number
  stop_loss?: number
  alt_ticker?: string
  created_at: string
}

export interface Trade {
  id: string
  user_id: string
  ticker: string
  name: string
  buy_price: number
  sell_price: number
  shares: number
  leverage: number
  buy_date: string
  sell_date: string
  gain_loss: number
  gain_loss_percent: number
}

export interface JournalEntry {
  id: string
  user_id: string
  position_id?: string
  trade_id?: string
  ticker: string
  type: 'buy' | 'sell'
  why: string
  objective?: string
  risk?: string
  leverage?: number
  lesson?: string
  created_at: string
}

export interface Alert {
  id: string
  user_id: string
  ticker: string
  type: 'price_above' | 'price_below' | 'earnings' | 'news' | 'unusual_move'
  value?: number
  is_active: boolean
  triggered_at?: string
  triggered_message?: string
  created_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  monthly_budget?: number
  max_risk?: number
  max_leverage?: number
  annual_target?: number
  max_positions?: number
  personal_rules: string[]
  created_at: string
}

export interface StockQuote {
  c: number   // current price
  d: number   // change
  dp: number  // percent change
  h: number   // high
  l: number   // low
  o: number   // open
  pc: number  // previous close
}

export interface AIAnalysis {
  score: number
  verdict: 'Très mauvais' | 'Mauvais' | 'Neutre' | 'Bon' | 'Excellent'
  forces: string[]
  faiblesses: string[]
  risques: string[]
  opportunites: string[]
  resume: string
  recommandation: string
}
