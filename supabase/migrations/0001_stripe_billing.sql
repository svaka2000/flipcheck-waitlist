-- FlipCheck billing tables (Supabase project bosykedtplxgkmoujkie).
-- Stripe is the source of truth; these mirror it via the webhook. RLS lets a user read
-- only their own rows; the webhook writes with the service-role key (bypasses RLS).

create table if not exists public.stripe_customers (
  id uuid references auth.users(id) on delete cascade primary key,
  stripe_customer_id text unique not null,
  created_at timestamptz default now() not null
);
alter table public.stripe_customers enable row level security;
drop policy if exists "own customer row" on public.stripe_customers;
create policy "own customer row" on public.stripe_customers
  for select using (auth.uid() = id);

create table if not exists public.subscriptions (
  id text primary key,                       -- stripe subscription id
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_price_id text not null,
  status text not null,                       -- trialing | active | past_due | canceled | ...
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  canceled_at timestamptz,
  trial_end timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.subscriptions enable row level security;
drop policy if exists "own subscriptions" on public.subscriptions;
create policy "own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
