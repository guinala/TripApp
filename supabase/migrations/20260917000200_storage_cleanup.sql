begin;
create table public.storage_delete_jobs (
  id uuid primary key default gen_random_uuid(),
  bucket text not null check (bucket in ('trip-photos','trip-covers','user-avatars')),
  path text not null,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  unique(bucket,path)
);
alter table public.storage_delete_jobs enable row level security;
revoke all on public.storage_delete_jobs from anon, authenticated;
grant all on public.storage_delete_jobs to service_role;
create index storage_delete_jobs_due on public.storage_delete_jobs(next_attempt_at);

-- Solo triggers internos pueden encolar. Nunca aceptar rutas arbitrarias desde la app.
create function public.enqueue_trip_file(p_owner uuid,p_trip uuid,p_path text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_path is null then return; end if;
  if p_path not like p_owner::text || '/' || p_trip::text || '/%'
     or p_path like '%..%' then raise exception 'INVALID_STORAGE_PATH'; end if;
  insert into public.storage_delete_jobs(bucket,path) values ('trip-photos',p_path)
    on conflict(bucket,path) do nothing;
end; $$;
revoke all on function public.enqueue_trip_file(uuid,uuid,text) from public,anon,authenticated;

create function public.queue_deleted_media()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner_id uuid; old_path text; new_path text;
begin
  select user_id into owner_id from public.trips where id = old.trip_id;
  -- Al borrar el padre, su trigger ya encoló todas las rutas antes del cascade.
  if owner_id is null then return old; end if;
  if tg_table_name = 'photos' then
    old_path := old.uri;
    if tg_op = 'UPDATE' then new_path := new.uri; end if;
  else
    old_path := old.receipt_path;
    if tg_op = 'UPDATE' then new_path := new.receipt_path; end if;
  end if;
  if tg_op = 'DELETE' or old_path is distinct from new_path then
    perform public.enqueue_trip_file(owner_id,old.trip_id,old_path);
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end; $$;
revoke all on function public.queue_deleted_media() from public,anon,authenticated;
create trigger queue_photo_file after delete or update of uri on public.photos
  for each row execute function public.queue_deleted_media();
create trigger queue_receipt_file after delete or update of receipt_path on public.expenses
  for each row execute function public.queue_deleted_media();

create function public.queue_deleted_trip_files()
returns trigger language plpgsql security definer set search_path = '' as $$
declare media record;
begin
  for media in select uri as path from public.photos where trip_id = old.id
    union select receipt_path from public.expenses where trip_id = old.id loop
    perform public.enqueue_trip_file(old.user_id,old.id,media.path);
  end loop;
  insert into public.storage_delete_jobs(bucket,path)
    values ('trip-covers',old.user_id::text || '/' || old.id::text || '.jpg')
    on conflict(bucket,path) do nothing;
  return old;
end; $$;
revoke all on function public.queue_deleted_trip_files() from public,anon,authenticated;
create trigger queue_trip_files before delete on public.trips
  for each row execute function public.queue_deleted_trip_files();

-- Evita referencias cruzadas y reutilizar una ruta cuyo borrado está en cola.
create function public.validate_media_reference()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner_id uuid; file_path text;
begin
  select user_id into owner_id from public.trips where id = new.trip_id;
  if tg_table_name = 'photos' then file_path := new.uri; else file_path := new.receipt_path; end if;
  if file_path is not null and (owner_id is null or
     file_path not like owner_id::text || '/' || new.trip_id::text || '/%' or
     file_path like '%..%' or exists(select 1 from public.storage_delete_jobs where bucket='trip-photos' and path=file_path)) then
    raise exception 'INVALID_STORAGE_PATH';
  end if;
  if new.day_id is not null and not exists(select 1 from public.days where id=new.day_id and trip_id=new.trip_id) then
    raise exception 'DAY_NOT_IN_TRIP';
  end if;
  return new;
end; $$;
revoke all on function public.validate_media_reference() from public,anon,authenticated;
create trigger validate_photo_reference before insert or update on public.photos
  for each row execute function public.validate_media_reference();
create trigger validate_expense_reference before insert or update on public.expenses
  for each row execute function public.validate_media_reference();
commit;
