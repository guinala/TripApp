begin;
create table public.explore_destinations (
  id text primary key,
  place_id text null references public.place_references(google_place_id),
  name text not null,
  country text not null,
  country_code text null check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  continent text not null check (continent in ('Europa', 'Asia', 'África', 'América', 'Oceanía')),
  types text[] not null default '{}' check (types <@ array['cultural', 'gastro', 'aventura', 'relax']::text[]),
  description_es text not null default '',
  description_en text null,
  cover_query text not null,
  featured boolean not null default false,
  sort_order integer not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.explore_destinations enable row level security;
revoke all on public.explore_destinations from anon, authenticated;
grant select on public.explore_destinations to authenticated;
grant all on public.explore_destinations to service_role;
create policy "Read published editorial destinations"
  on public.explore_destinations for select to authenticated using (published = true);
create function public.touch_explore_destination()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.touch_explore_destination() from public, anon, authenticated;
create trigger touch_explore_destination before update on public.explore_destinations
  for each row execute function public.touch_explore_destination();
commit;