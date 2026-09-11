begin;

create table public.place_references (
  google_place_id text primary key,
  created_at timestamptz not null default now(),
  constraint google_place_id_not_blank
    check (length(btrim(google_place_id)) > 0)
);

alter table public.place_references enable row level security;

revoke all on public.place_references from anon, authenticated;
grant select on public.place_references to authenticated;
grant all on public.place_references to service_role;

create policy "Authenticated users can read place identifiers"
  on public.place_references for select
  to authenticated using (true);

alter table public.trips
  add column destination_place_id text null
  references public.place_references(google_place_id)
  on delete restrict;

create index trips_destination_place_id_idx
  on public.trips(destination_place_id);

commit;