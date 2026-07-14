-- Activer UUID
create extension if not exists "uuid-ossp";

-- Positions ouvertes
create table positions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticker text not null,
  name text not null,
  logo text,
  sector text,
  buy_price numeric(12,4) not null,
  current_price numeric(12,4) default 0,
  shares numeric(12,4) not null,
  leverage numeric(4,2) default 1,
  buy_date date not null,
  target_price numeric(12,4),
  stop_loss numeric(12,4),
  created_at timestamptz default now()
);

-- Trades clôturés
create table trades (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticker text not null,
  name text not null,
  sector text,
  buy_price numeric(12,4) not null,
  sell_price numeric(12,4) not null,
  shares numeric(12,4) not null,
  leverage numeric(4,2) default 1,
  buy_date date not null,
  sell_date date not null,
  gain_loss numeric(12,4),
  gain_loss_percent numeric(8,4),
  created_at timestamptz default now()
);

-- Journal de trading
create table journal_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  position_id uuid references positions(id) on delete set null,
  trade_id uuid references trades(id) on delete set null,
  ticker text not null,
  type text check (type in ('buy', 'sell')) not null,
  why text not null,
  objective text,
  risk text,
  leverage numeric(4,2),
  lesson text,
  created_at timestamptz default now()
);

-- Alertes
create table alerts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticker text not null,
  type text check (type in ('price_above', 'price_below', 'earnings', 'news', 'unusual_move')) not null,
  value numeric(12,4),
  is_active boolean default true,
  triggered_at timestamptz,
  triggered_message text,
  created_at timestamptz default now()
);

-- Paramètres utilisateur
create table user_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  monthly_budget numeric(12,2),
  max_risk numeric(5,2),
  max_leverage numeric(4,2),
  annual_target numeric(5,2),
  max_positions int,
  personal_rules text[] default '{}',
  created_at timestamptz default now()
);

-- Analyses IA sauvegardées
create table ai_analyses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticker text not null,
  score int,
  verdict text,
  forces text[],
  faiblesses text[],
  risques text[],
  opportunites text[],
  resume text,
  recommandation text,
  created_at timestamptz default now()
);

-- Row Level Security (chaque user voit seulement ses données)
alter table positions enable row level security;
alter table trades enable row level security;
alter table journal_entries enable row level security;
alter table alerts enable row level security;
alter table user_settings enable row level security;
alter table ai_analyses enable row level security;

create policy "users own positions" on positions for all using (auth.uid() = user_id);
create policy "users own trades" on trades for all using (auth.uid() = user_id);
create policy "users own journal" on journal_entries for all using (auth.uid() = user_id);
create policy "users own alerts" on alerts for all using (auth.uid() = user_id);
create policy "users own settings" on user_settings for all using (auth.uid() = user_id);
create policy "users own analyses" on ai_analyses for all using (auth.uid() = user_id);
