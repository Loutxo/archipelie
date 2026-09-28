-- ============================================================
-- Archipelie - Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database.
-- Requires the PostGIS extension (enabled by default on Supabase).
-- ============================================================

-- Enable PostGIS for geographic queries
create extension if not exists postgis;

-- ============================================================
-- PROFILES
-- Extended user info (linked to auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio         text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- MAILLE
-- The user's real local geography (step 1)
-- ============================================================
create table if not exists public.maille (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- Raw pins stored as JSONB: [{type, label, lat, lng}]
  pins        jsonb not null default '[]',
  -- Computed center point of the maille (for proximity matching)
  center_lat  double precision,
  center_lng  double precision,
  -- Computed geography column for efficient radius queries
  center_geo  geography(Point, 4326),
  -- Derived classification
  maille_type text check (maille_type in ('dispersee', 'resserree', 'dense')),
  radius_km   double precision,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id)
);

-- Spatial index for fast proximity queries
create index if not exists maille_center_geo_idx on public.maille using gist(center_geo);

-- Function: auto-update center_geo from lat/lng, snapped to ~1 km grid
create or replace function public.update_maille_geo()
returns trigger language plpgsql as $$
begin
  if new.center_lat is not null and new.center_lng is not null then
    new.center_lat := round(new.center_lat::numeric / 0.009) * 0.009;
    new.center_lng := round(new.center_lng::numeric / 0.009) * 0.009;
    new.center_geo := st_makepoint(new.center_lng, new.center_lat)::geography;
  end if;
  return new;
end;
$$;

create trigger maille_geo_trigger
  before insert or update on public.maille
  for each row execute function public.update_maille_geo();

-- ============================================================
-- MANQUES
-- What's missing in the user's community (step 2)
-- ============================================================
create table if not exists public.manques (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- Array of manque keys from the predefined list
  manque_keys text[] not null default '{}',
  -- Optional free text
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id)
);

-- ============================================================
-- COMPETENCES
-- The user's skills and type (step 3)
-- ============================================================
create table if not exists public.competences (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  -- Primary type from Arthur Keller's 5
  primary_type    text check (primary_type in ('penseur', 'faiseur', 'relieur', 'conteur', 'gardien')),
  -- Secondary type (optional)
  secondary_type  text check (secondary_type in ('penseur', 'faiseur', 'relieur', 'conteur', 'gardien')),
  -- Free-text skills
  skills_free     text[] not null default '{}',
  -- What they're willing to learn
  learning_intent text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (user_id)
);

-- ============================================================
-- COMPAGNONS
-- Named companions the user already has (step 4)
-- ============================================================
create table if not exists public.compagnons (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  notes       text,
  created_at  timestamptz default now()
);

-- ============================================================
-- MATCHING VISIBILITY
-- Whether the user consents to appearing in others' matches
-- ============================================================
create table if not exists public.matching_visibility (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  is_visible    boolean not null default false,
  -- What they're willing to share in their match card
  share_name    boolean not null default true,
  share_manques boolean not null default true,
  share_type    boolean not null default true,
  updated_at    timestamptz default now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================
alter table public.profiles enable row level security;
alter table public.maille enable row level security;
alter table public.manques enable row level security;
alter table public.competences enable row level security;
alter table public.compagnons enable row level security;
alter table public.matching_visibility enable row level security;

-- Profiles: own row
create policy "profiles: own row" on public.profiles
  for all using (auth.uid() = id);

-- Maille: own row (write); visible rows readable by all (for matching)
create policy "maille: own row write" on public.maille
  for all using (auth.uid() = user_id);

-- Manques: own row
create policy "manques: own row" on public.manques
  for all using (auth.uid() = user_id);

-- Competences: own row
create policy "competences: own row" on public.competences
  for all using (auth.uid() = user_id);

-- Compagnons: own row
create policy "compagnons: own row" on public.compagnons
  for all using (auth.uid() = user_id);

-- Matching visibility: own row (write); readable by authenticated users (for matching)
create policy "matching_visibility: own row write" on public.matching_visibility
  for all using (auth.uid() = user_id);

create policy "matching_visibility: authenticated read" on public.matching_visibility
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- MATCHING FUNCTION
-- Returns nearby users who have opted into matching
-- Requires the caller to be authenticated (enforced by RLS)
-- ============================================================
create or replace function public.find_nearby_matches(
  p_radius_km   double precision default 30
)
returns table (
  user_id         uuid,
  display_name    text,
  distance_bucket text,
  primary_type    text,
  manque_keys     text[],
  share_name      boolean,
  share_manques   boolean,
  share_type      boolean
)
language sql security definer as $$
  -- Identity comes from auth.uid() only - p_user_id is gone to prevent impersonation
  select
    mv.user_id,
    case when mv.share_name then pr.display_name else null end,
    case
      when st_distance(m_other.center_geo, m_self.center_geo) < 2000  then '< 2 km'
      when st_distance(m_other.center_geo, m_self.center_geo) < 5000  then '2 – 5 km'
      when st_distance(m_other.center_geo, m_self.center_geo) < 15000 then '5 – 15 km'
      else '> 15 km'
    end as distance_bucket,
    case when mv.share_type then co.primary_type else null end,
    case when mv.share_manques then ma.manque_keys else null end,
    mv.share_name,
    mv.share_manques,
    mv.share_type
  from public.matching_visibility mv
  join public.maille m_other on m_other.user_id = mv.user_id
  join public.maille m_self  on m_self.user_id  = auth.uid()
  left join public.profiles pr on pr.id = mv.user_id
  left join public.competences co on co.user_id = mv.user_id
  left join public.manques ma on ma.user_id = mv.user_id
  where mv.is_visible = true
    and mv.user_id != auth.uid()
    and m_other.center_geo is not null
    and m_self.center_geo is not null
    and st_dwithin(
      m_other.center_geo,
      m_self.center_geo,
      p_radius_km * 1000
    )
  order by st_distance(m_other.center_geo, m_self.center_geo) asc
  limit 20;
$$;

-- ============================================================
-- TRIGGER: auto-create profile + visibility on sign-up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
    values (new.id, split_part(new.email, '@', 1))
    on conflict (id) do nothing;

  insert into public.matching_visibility (user_id, is_visible)
    values (new.id, false)
    on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- COLLECTIFS
-- Initiatives et communs référencés dans une maille
-- ============================================================
create table if not exists public.collectifs (
  id           uuid primary key default gen_random_uuid(),
  nom          text not null,
  description  text,
  manque_keys  text[] not null default '{}',
  contact      text,
  center_lat   double precision,
  center_lng   double precision,
  center_geo   geography(Point, 4326),
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists collectifs_center_geo_idx
  on public.collectifs using gist(center_geo);

create trigger collectifs_geo_trigger
  before insert or update on public.collectifs
  for each row execute function public.update_maille_geo();

-- ============================================================
-- COLLECTIF_MEMBRES
-- ============================================================
create table if not exists public.collectif_membres (
  collectif_id uuid not null references public.collectifs(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  confirmed_at timestamptz default now(),
  primary key (collectif_id, user_id)
);

-- ============================================================
-- ECHANGES - SEL léger (offre / demande de compétences)
-- ============================================================
create table if not exists public.echanges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  direction   text not null check (direction in ('offre', 'demande')),
  description text not null,
  manque_key  text,
  actif       boolean not null default true,
  created_at  timestamptz default now()
);

-- notify_email sur matching_visibility
alter table public.matching_visibility
  add column if not exists notify_email boolean not null default true;

-- ============================================================
-- RLS
-- ============================================================
alter table public.collectifs enable row level security;
alter table public.collectif_membres enable row level security;
alter table public.echanges enable row level security;

create policy "collectifs: authenticated read"
  on public.collectifs for select using (auth.role() = 'authenticated');

create policy "collectifs: own write"
  on public.collectifs for insert with check (auth.uid() = created_by);

create policy "collectifs: own update delete"
  on public.collectifs for all using (auth.uid() = created_by);

create policy "collectif_membres: own"
  on public.collectif_membres for all using (auth.uid() = user_id);

create policy "collectif_membres: authenticated count"
  on public.collectif_membres for select using (auth.role() = 'authenticated');

create policy "echanges: own"
  on public.echanges for all using (auth.uid() = user_id);

create policy "echanges: authenticated read active"
  on public.echanges for select using (auth.role() = 'authenticated' and actif = true);

-- ============================================================
-- FIND_NEARBY_COLLECTIFS
-- ============================================================
create or replace function public.find_nearby_collectifs(
  p_radius_km double precision default 30
)
returns table (
  collectif_id   uuid,
  nom            text,
  description    text,
  contact        text,
  distance_label text,
  manque_keys    text[],
  membre_count   bigint
)
language sql security definer as $$
  select
    c.id, c.nom, c.description, c.contact,
    case
      when st_distance(c.center_geo, m.center_geo) < 2000  then 'moins de 2 km'
      when st_distance(c.center_geo, m.center_geo) < 5000  then '2 à 5 km'
      when st_distance(c.center_geo, m.center_geo) < 15000 then '5 à 15 km'
      else 'plus de 15 km'
    end as distance_label,
    c.manque_keys,
    count(cm.user_id) as membre_count
  from public.collectifs c
  join public.maille m on m.user_id = auth.uid()
  left join public.collectif_membres cm on cm.collectif_id = c.id
  where c.center_geo is not null and m.center_geo is not null
    and st_dwithin(c.center_geo, m.center_geo, p_radius_km * 1000)
    and exists (
      select 1 from public.manques ma
      where ma.user_id = auth.uid() and ma.manque_keys && c.manque_keys
    )
  group by c.id, m.center_geo
  order by st_distance(c.center_geo, m.center_geo) asc
  limit 10;
$$;

-- ============================================================
-- FIND_NEARBY_ECHANGES
-- ============================================================
create or replace function public.find_nearby_echanges(
  p_radius_km double precision default 15
)
returns table (
  id             uuid,
  user_id        uuid,
  direction      text,
  description    text,
  manque_key     text,
  distance_label text,
  display_name   text
)
language sql security definer as $$
  select
    e.id, e.user_id, e.direction, e.description, e.manque_key,
    case
      when st_distance(m_other.center_geo, m_self.center_geo) < 2000  then 'moins de 2 km'
      when st_distance(m_other.center_geo, m_self.center_geo) < 5000  then '2 à 5 km'
      when st_distance(m_other.center_geo, m_self.center_geo) < 15000 then '5 à 15 km'
      else 'plus de 15 km'
    end as distance_label,
    pr.display_name
  from public.echanges e
  join public.maille m_other on m_other.user_id = e.user_id
  join public.maille m_self  on m_self.user_id  = auth.uid()
  left join public.profiles pr on pr.id = e.user_id
  where e.actif = true and e.user_id != auth.uid()
    and m_other.center_geo is not null and m_self.center_geo is not null
    and st_dwithin(m_other.center_geo, m_self.center_geo, p_radius_km * 1000)
  order by st_distance(m_other.center_geo, m_self.center_geo) asc
  limit 20;
$$;

-- ============================================================
-- VARIANTES SERVICE-ROLE (pour edge function match-notify)
-- ============================================================
create or replace function public.find_nearby_collectifs_for_user(
  p_user_id    uuid,
  p_radius_km  double precision default 30,
  p_since_days integer default 7
)
returns table (collectif_id uuid, nom text)
language sql security definer as $$
  select c.id, c.nom
  from public.collectifs c
  join public.maille m on m.user_id = p_user_id
  where c.center_geo is not null and m.center_geo is not null
    and c.created_at > now() - (p_since_days || ' days')::interval
    and st_dwithin(c.center_geo, m.center_geo, p_radius_km * 1000)
    and exists (
      select 1 from public.manques ma
      where ma.user_id = p_user_id and ma.manque_keys && c.manque_keys
    )
  limit 5;
$$;

create or replace function public.find_new_matches_for_user(
  p_user_id    uuid,
  p_radius_km  double precision default 30,
  p_since_days integer default 7
)
returns table (matched_user_id uuid)
language sql security definer as $$
  select mv.user_id
  from public.matching_visibility mv
  join public.maille m_other on m_other.user_id = mv.user_id
  join public.maille m_self  on m_self.user_id  = p_user_id
  where mv.is_visible = true and mv.user_id != p_user_id
    and m_other.center_geo is not null and m_self.center_geo is not null
    and mv.updated_at > now() - (p_since_days || ' days')::interval
    and st_dwithin(m_other.center_geo, m_self.center_geo, p_radius_km * 1000)
  limit 5;
$$;
