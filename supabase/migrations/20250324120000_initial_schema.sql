-- WanderSync: profiles, trips, trip_members, activities, rankings, itineraries
-- Apply: Supabase Dashboard → SQL Editor, or `supabase db push`

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  destination text not null,
  date_start date not null,
  date_end date not null,
  cover_image text,
  status text not null default 'draft'
    check (status in ('draft', 'voting', 'planning', 'active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trips_owner_id_idx on public.trips (owner_id);

alter table public.trips enable row level security;

-- SELECT policy for trips is created after trip_members exists (see below).

create policy "trips_insert_owner"
  on public.trips for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "trips_update_owner"
  on public.trips for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "trips_delete_owner"
  on public.trips for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- trip_members (user_id → profiles for PostgREST embed)
-- ---------------------------------------------------------------------------
create table if not exists public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create index if not exists trip_members_user_id_idx on public.trip_members (user_id);

-- Avoid RLS infinite recursion when PostgREST embeds trip_members on trips (each policy
-- must not re-scan trip_members under the same table's RLS).
create or replace function public.is_trip_participant(_user_id uuid, _trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trip_members tm
    where tm.trip_id = _trip_id and tm.user_id = _user_id
  );
$$;

revoke all on function public.is_trip_participant(uuid, uuid) from public;
grant execute on function public.is_trip_participant(uuid, uuid) to authenticated;

alter table public.trip_members enable row level security;

create policy "trip_members_select"
  on public.trip_members for select
  to authenticated
  using ( public.is_trip_participant(auth.uid(), trip_id) );

create policy "trip_members_insert_owner"
  on public.trip_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.owner_id = auth.uid()
    )
  );

create policy "trip_members_delete_owner"
  on public.trip_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_members.trip_id and t.owner_id = auth.uid()
    )
  );

create or replace function public.trips_after_insert_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (trip_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trips_after_insert_owner_member on public.trips;
create trigger trips_after_insert_owner_member
  after insert on public.trips
  for each row
  execute function public.trips_after_insert_owner_member();

-- After trip_members + is_trip_participant exist.
create policy "trips_select_member"
  on public.trips for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.is_trip_participant(auth.uid(), id)
  );

-- ---------------------------------------------------------------------------
-- activities
-- ---------------------------------------------------------------------------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  sort_order int not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activities_trip_id_idx on public.activities (trip_id);

alter table public.activities enable row level security;

create policy "activities_select_trip_access"
  on public.activities for select
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = activities.trip_id
        and (
          t.owner_id = auth.uid()
          or exists (
            select 1 from public.trip_members m
            where m.trip_id = t.id and m.user_id = auth.uid()
          )
        )
    )
  );

create policy "activities_insert_owner"
  on public.activities for insert
  to authenticated
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.owner_id = auth.uid()
    )
  );

create policy "activities_update_owner"
  on public.activities for update
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = activities.trip_id and t.owner_id = auth.uid()
    )
  );

create policy "activities_delete_owner"
  on public.activities for delete
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = activities.trip_id and t.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- rankings
-- ---------------------------------------------------------------------------
create table if not exists public.rankings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

create index if not exists rankings_trip_id_idx on public.rankings (trip_id);

alter table public.rankings enable row level security;

create policy "rankings_select_trip_access"
  on public.rankings for select
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = rankings.trip_id
        and (
          t.owner_id = auth.uid()
          or exists (
            select 1 from public.trip_members m
            where m.trip_id = t.id and m.user_id = auth.uid()
          )
        )
    )
  );

create policy "rankings_insert_own"
  on public.rankings for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.trips t
      where t.id = trip_id
        and (
          t.owner_id = auth.uid()
          or exists (
            select 1 from public.trip_members m
            where m.trip_id = t.id and m.user_id = auth.uid()
          )
        )
    )
  );

create policy "rankings_update_own"
  on public.rankings for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "rankings_delete_own"
  on public.rankings for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- itineraries
-- ---------------------------------------------------------------------------
create table if not exists public.itineraries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  days jsonb not null default '[]'::jsonb,
  version int not null default 1,
  updated_at timestamptz not null default now(),
  unique (trip_id)
);

alter table public.itineraries enable row level security;

create policy "itineraries_select_trip_access"
  on public.itineraries for select
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = itineraries.trip_id
        and (
          t.owner_id = auth.uid()
          or exists (
            select 1 from public.trip_members m
            where m.trip_id = t.id and m.user_id = auth.uid()
          )
        )
    )
  );

create policy "itineraries_insert_owner"
  on public.itineraries for insert
  to authenticated
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.owner_id = auth.uid()
    )
  );

create policy "itineraries_update_owner"
  on public.itineraries for update
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = itineraries.trip_id and t.owner_id = auth.uid()
    )
  );

create policy "itineraries_delete_owner"
  on public.itineraries for delete
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = itineraries.trip_id and t.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- New auth user → profile row
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
