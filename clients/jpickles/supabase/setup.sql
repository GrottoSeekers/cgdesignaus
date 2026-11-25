-- J.Pickles Coaching: client forms. Run once in Supabase (SQL Editor > New query > Run).
-- Anyone can SEND a form (insert). Nobody can read forms except James, signed in at /coach.
-- Turn OFF public sign-ups (Authentication > Sign In / Providers) so his account is the only one.

-- ---------- Onboarding & consultation ----------
create table if not exists public.onboarding (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  phone text,
  plan text,
  answers jsonb not null default '{}'::jsonb check (pg_column_size(answers) < 64000),
  status text not null default 'new' check (status in ('new', 'contacted', 'active', 'archived'))
);

-- ---------- Weekly check-ins ----------
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  checkin_date date not null default current_date,
  weight_kg numeric(5,1) check (weight_kg is null or weight_kg between 20 and 400),
  answers jsonb not null default '{}'::jsonb check (pg_column_size(answers) < 32000),
  reviewed boolean not null default false
);

create index if not exists check_ins_email_date on public.check_ins (email, checkin_date desc);
create index if not exists onboarding_created on public.onboarding (created_at desc);

alter table public.onboarding enable row level security;
alter table public.check_ins enable row level security;

-- Public (the website) can only insert, and only new rows in their default state.
drop policy if exists "Anyone can send onboarding" on public.onboarding;
create policy "Anyone can send onboarding" on public.onboarding
  for insert to anon, authenticated with check (status = 'new');

drop policy if exists "Anyone can send a check-in" on public.check_ins;
create policy "Anyone can send a check-in" on public.check_ins
  for insert to anon, authenticated with check (reviewed = false);

-- Only James's own login can read, update (status / reviewed) and delete. Pinned to his email,
-- so even if sign-ups were ever switched back on, a new account couldn't read anything.
-- If he signs in to /coach with a different address, change it in the six lines below.
drop policy if exists "James reads onboarding" on public.onboarding;
create policy "James reads onboarding" on public.onboarding for select to authenticated using ((auth.jwt() ->> 'email') = 'jpickles.coaching@outlook.com');
drop policy if exists "James updates onboarding" on public.onboarding;
create policy "James updates onboarding" on public.onboarding for update to authenticated using ((auth.jwt() ->> 'email') = 'jpickles.coaching@outlook.com') with check ((auth.jwt() ->> 'email') = 'jpickles.coaching@outlook.com');
drop policy if exists "James deletes onboarding" on public.onboarding;
create policy "James deletes onboarding" on public.onboarding for delete to authenticated using ((auth.jwt() ->> 'email') = 'jpickles.coaching@outlook.com');

drop policy if exists "James reads check-ins" on public.check_ins;
create policy "James reads check-ins" on public.check_ins for select to authenticated using ((auth.jwt() ->> 'email') = 'jpickles.coaching@outlook.com');
drop policy if exists "James updates check-ins" on public.check_ins;
create policy "James updates check-ins" on public.check_ins for update to authenticated using ((auth.jwt() ->> 'email') = 'jpickles.coaching@outlook.com') with check ((auth.jwt() ->> 'email') = 'jpickles.coaching@outlook.com');
drop policy if exists "James deletes check-ins" on public.check_ins;
create policy "James deletes check-ins" on public.check_ins for delete to authenticated using ((auth.jwt() ->> 'email') = 'jpickles.coaching@outlook.com');

-- The website's public key can insert but never read back.
revoke select, update, delete on public.onboarding from anon;
revoke select, update, delete on public.check_ins from anon;
grant insert on public.onboarding to anon;
grant insert on public.check_ins to anon;
