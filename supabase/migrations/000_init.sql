-- Schema for AI Cover Letter SaaS

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  plan text not null default 'free', -- free | pro | premium
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  job_title text,
  company text,
  content text not null,
  created_at timestamp with time zone default now()
);

create index if not exists letters_user_created_idx on public.letters(user_id, created_at desc);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null, -- active, canceled, past_due, trialing
  plan text not null,  -- free | pro | premium
  current_period_end timestamp with time zone,
  paddle_subscription_id text,
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create table if not exists public.webhook_events (
  id bigserial primary key,
  provider text not null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamp with time zone default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.letters enable row level security;
alter table public.subscriptions enable row level security;
alter table public.webhook_events enable row level security;

create policy "Users can view their profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update their profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users manage own letters" on public.letters
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view their subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Helper function: upsert profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
