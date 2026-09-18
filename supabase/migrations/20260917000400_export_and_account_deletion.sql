begin;
create function public.export_my_data() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'format_version',2,'exported_at',now(),
    'profile',(select to_jsonb(p) from public.profiles p where p.id=auth.uid()),
    'trips',coalesce((select jsonb_agg(t order by t.id) from public.trips t where t.user_id=auth.uid()),'[]'::jsonb),
    'days',coalesce((select jsonb_agg(d order by d.id) from public.days d join public.trips t on t.id=d.trip_id where t.user_id=auth.uid()),'[]'::jsonb),
    'activities',coalesce((select jsonb_agg(a order by a.id) from public.activities a join public.days d on d.id=a.day_id join public.trips t on t.id=d.trip_id where t.user_id=auth.uid()),'[]'::jsonb),
    'expenses',coalesce((select jsonb_agg(e order by e.id) from public.expenses e join public.trips t on t.id=e.trip_id where t.user_id=auth.uid()),'[]'::jsonb),
    'packing_items',coalesce((select jsonb_agg(i order by i.id) from public.packing_items i join public.trips t on t.id=i.trip_id where t.user_id=auth.uid()),'[]'::jsonb),
    'photos',coalesce((select jsonb_agg(p order by p.id) from public.photos p join public.trips t on t.id=p.trip_id where t.user_id=auth.uid()),'[]'::jsonb)
  ) where auth.uid() is not null;
$$;
revoke all on function public.export_my_data() from public,anon;
grant execute on function public.export_my_data() to authenticated;

alter table public.profiles add column deletion_requested_at timestamptz;
-- La eliminación de Auth debe poder retirar el perfil tras purgar los viajes.
do $$ declare fk record; found_fk boolean := false; begin
  for fk in select conname from pg_constraint
    where conrelid='public.profiles'::regclass and confrelid='auth.users'::regclass
      and contype='f' and conkey=array[(select attnum from pg_attribute where attrelid='public.profiles'::regclass and attname='id')] loop
    found_fk := true;
    execute format('alter table public.profiles drop constraint %I',fk.conname);
    execute format('alter table public.profiles add constraint %I foreign key(id) references auth.users(id) on delete cascade',fk.conname);
  end loop;
  if not found_fk then
    alter table public.profiles add constraint profiles_auth_user_fkey foreign key(id) references auth.users(id) on delete cascade;
  end if;
end $$;
create table public.account_delete_jobs (
  user_id uuid primary key,
  created_at timestamptz not null default now(),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text
);
alter table public.account_delete_jobs enable row level security;
revoke all on public.account_delete_jobs from anon,authenticated;
grant all on public.account_delete_jobs to service_role;

create function public.account_is_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and deletion_requested_at is null)
$$;
revoke all on function public.account_is_active() from public,anon;
grant execute on function public.account_is_active() to authenticated;

-- RESTRICTIVE añade una condición a las políticas existentes; no concede acceso nuevo.
do $$ declare table_name text; begin
  foreach table_name in array array['trips','days','activities','expenses','packing_items','photos'] loop
    execute format('create policy account_must_be_active on public.%I as restrictive for all to authenticated using (public.account_is_active()) with check (public.account_is_active())',table_name);
  end loop;
end $$;
create policy active_account_storage on storage.objects as restrictive for all to authenticated
  using (public.account_is_active()) with check (public.account_is_active());
create policy active_profile_update on public.profiles as restrictive for update to authenticated
  using (public.account_is_active()) with check (public.account_is_active());

create function public.request_account_deletion() returns void
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  update public.profiles set deletion_requested_at=coalesce(deletion_requested_at,now()) where id=owner_id;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
  insert into public.account_delete_jobs(user_id) values(owner_id) on conflict(user_id) do nothing;
end; $$;
revoke all on function public.request_account_deletion() from public,anon;
grant execute on function public.request_account_deletion() to authenticated;

-- No depende de que todas las FK antiguas tengan ON DELETE CASCADE.
-- Se conserva profiles hasta que Auth confirme su eliminación.
create function public.purge_account_rows(p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.account_delete_jobs where user_id=p_user_id) then raise exception 'NO_DELETE_REQUEST'; end if;
  delete from public.activities where day_id in (select d.id from public.days d join public.trips t on t.id=d.trip_id where t.user_id=p_user_id);
  delete from public.photos where trip_id in (select id from public.trips where user_id=p_user_id);
  delete from public.expenses where trip_id in (select id from public.trips where user_id=p_user_id);
  delete from public.packing_items where trip_id in (select id from public.trips where user_id=p_user_id);
  delete from public.days where trip_id in (select id from public.trips where user_id=p_user_id);
  delete from public.trips where user_id=p_user_id;
end; $$;
revoke all on function public.purge_account_rows(uuid) from public,anon,authenticated;
grant execute on function public.purge_account_rows(uuid) to service_role;
commit;
