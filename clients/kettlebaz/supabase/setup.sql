-- Kettlebaz content: run this once in Supabase (SQL Editor > New query > Run).
-- Anyone can read what's published; only signed-in users can change anything.
-- Turn OFF public sign-ups (Authentication > Sign In / Providers > "Allow new
-- users to sign up") so Ryan's account is the only one that can sign in.

-- ---------- Workouts ----------
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  note text not null default '',
  moves text not null default '',          -- one move per line
  video_path text not null,                -- path inside the "media" bucket
  poster_path text,                        -- still frame shown before play
  instagram_url text,
  position integer not null default 0,     -- lower shows first
  published boolean not null default true
);

alter table public.workouts enable row level security;

drop policy if exists "Public can read published workouts" on public.workouts;
create policy "Public can read published workouts"
  on public.workouts for select
  to anon, authenticated
  using (published or auth.role() = 'authenticated');

drop policy if exists "Ryan can add workouts" on public.workouts;
create policy "Ryan can add workouts"
  on public.workouts for insert to authenticated with check (true);

drop policy if exists "Ryan can edit workouts" on public.workouts;
create policy "Ryan can edit workouts"
  on public.workouts for update to authenticated using (true) with check (true);

drop policy if exists "Ryan can delete workouts" on public.workouts;
create policy "Ryan can delete workouts"
  on public.workouts for delete to authenticated using (true);

-- ---------- Photos (one per slot: hero, training, portrait) ----------
create table if not exists public.site_photos (
  slot text primary key check (slot in ('hero', 'training', 'portrait')),
  path text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_photos enable row level security;

drop policy if exists "Public can read photos" on public.site_photos;
create policy "Public can read photos"
  on public.site_photos for select to anon, authenticated using (true);

drop policy if exists "Ryan can set photos" on public.site_photos;
create policy "Ryan can set photos"
  on public.site_photos for all to authenticated using (true) with check (true);

-- ---------- File storage ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)  -- 50 MB per file (free-plan maximum)
on conflict (id) do update set public = true;

drop policy if exists "Public can view media" on storage.objects;
create policy "Public can view media"
  on storage.objects for select to anon, authenticated using (bucket_id = 'media');

drop policy if exists "Ryan can upload media" on storage.objects;
create policy "Ryan can upload media"
  on storage.objects for insert to authenticated with check (bucket_id = 'media');

drop policy if exists "Ryan can replace media" on storage.objects;
create policy "Ryan can replace media"
  on storage.objects for update to authenticated using (bucket_id = 'media');

drop policy if exists "Ryan can delete media" on storage.objects;
create policy "Ryan can delete media"
  on storage.objects for delete to authenticated using (bucket_id = 'media');

-- ---------- Starting content ----------
-- The three workouts already on the site, so Ryan sees them in /admin and can
-- edit, reorder or remove them. Paths starting with "/" are files that ship
-- with the website. Only runs while the table is empty.
insert into public.workouts (name, note, moves, video_path, poster_path, instagram_url, position)
select * from (values
  ('AMRAP 10', '10 minutes', E'5 thrusters\n5 high pulls\n5 press-ups',
   '/media/full-thrusters.mp4', '/media/reel-thrusters.webp', 'https://www.instagram.com/p/Dfk5dDdh1A8/', 1),
  ('Clean & press', 'As many rounds as you can', E'4 cleans\n4 presses\n4 squats\n4 rows',
   '/media/full-clean-press.mp4', '/media/reel-clean-press.webp', 'https://www.instagram.com/p/DfX9B9yIern/', 2),
  ('Full body', 'As many rounds as you can', E'4 deadlifts\n4 cleans\n4 presses\n4 press-ups\n4 switch lunges each leg',
   '/media/full-deadlift.mp4', '/media/reel-deadlift.webp', 'https://www.instagram.com/p/DfiDSjLu8s6/', 3)
) as seed(name, note, moves, video_path, poster_path, instagram_url, position)
where not exists (select 1 from public.workouts);
