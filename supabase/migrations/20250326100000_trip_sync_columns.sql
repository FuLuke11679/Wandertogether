-- Extra trip fields + voting session + relax itineraries/trips updates for participants

-- ---------------------------------------------------------------------------
-- trips: JSON blobs for client state (preferences, merged rankings snapshot, live execution)
-- ---------------------------------------------------------------------------
alter table public.trips
  add column if not exists preferences jsonb;

alter table public.trips
  add column if not exists group_priorities jsonb;

alter table public.trips
  add column if not exists execution_state jsonb;

-- ---------------------------------------------------------------------------
-- Per-user pairwise voting progress (completed pair keys + count)
-- ---------------------------------------------------------------------------
create table if not exists public.trip_voting_session (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  completed_pairs jsonb not null default '[]'::jsonb,
  comparison_count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create index if not exists trip_voting_session_user_idx
  on public.trip_voting_session (user_id);

alter table public.trip_voting_session enable row level security;

create policy "trip_voting_session_select"
  on public.trip_voting_session for select
  to authenticated
  using ( public.is_trip_participant(auth.uid(), trip_id) );

create policy "trip_voting_session_upsert_own"
  on public.trip_voting_session for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_trip_participant(auth.uid(), trip_id)
  );

create policy "trip_voting_session_update_own"
  on public.trip_voting_session for update
  to authenticated
  using ( user_id = auth.uid() )
  with check (
    user_id = auth.uid()
    and public.is_trip_participant(auth.uid(), trip_id)
  );

create policy "trip_voting_session_delete_own"
  on public.trip_voting_session for delete
  to authenticated
  using ( user_id = auth.uid() );

-- ---------------------------------------------------------------------------
-- Itineraries: participants may update (execution mode advances stops)
-- ---------------------------------------------------------------------------
drop policy if exists "itineraries_insert_owner" on public.itineraries;
drop policy if exists "itineraries_update_owner" on public.itineraries;
drop policy if exists "itineraries_delete_owner" on public.itineraries;

create policy "itineraries_insert_participant"
  on public.itineraries for insert
  to authenticated
  with check ( public.is_trip_participant(auth.uid(), trip_id) );

create policy "itineraries_update_participant"
  on public.itineraries for update
  to authenticated
  using ( public.is_trip_participant(auth.uid(), trip_id) )
  with check ( public.is_trip_participant(auth.uid(), trip_id) );

create policy "itineraries_delete_participant"
  on public.itineraries for delete
  to authenticated
  using ( public.is_trip_participant(auth.uid(), trip_id) );

-- ---------------------------------------------------------------------------
-- Trips: participants may update sync columns (not ideal for prod; OK for group app MVP)
-- ---------------------------------------------------------------------------
drop policy if exists "trips_update_owner" on public.trips;

create policy "trips_update_participant"
  on public.trips for update
  to authenticated
  using ( public.is_trip_participant(auth.uid(), id) )
  with check ( public.is_trip_participant(auth.uid(), id) );
