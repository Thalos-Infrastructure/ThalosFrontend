-- Agreement Activity Log Table
-- Tracks all actions taken on agreements

create table if not exists public.agreement_activity (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.agreements(id) on delete cascade,
  actor_wallet text not null,
  action text not null,
  details jsonb default '{}',
  created_at timestamptz default now()
);

-- Index for faster lookups by agreement
create index if not exists idx_agreement_activity_agreement_id on public.agreement_activity(agreement_id);
create index if not exists idx_agreement_activity_actor on public.agreement_activity(actor_wallet);
create index if not exists idx_agreement_activity_created on public.agreement_activity(created_at desc);

-- Enable RLS
alter table public.agreement_activity enable row level security;

-- Policies
-- Anyone can view activity (it's a public log)
create policy "activity_select_all" on public.agreement_activity for select using (true);

-- Only authenticated operations can insert (handled by server actions)
create policy "activity_insert_all" on public.agreement_activity for insert with check (true);
