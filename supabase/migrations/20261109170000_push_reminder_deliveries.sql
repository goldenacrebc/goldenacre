create table if not exists public.push_reminder_deliveries (
    reminder_key text primary key,
    delivered_at timestamptz not null default now()
);

alter table public.push_reminder_deliveries enable row level security;
