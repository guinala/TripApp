begin;
-- Política: conserva los días por FECHA (y sus IDs), no desplaza su contenido.
-- Acortar/mover el intervalo se rechaza si dejaría contenido fuera.
create function public.reconcile_trip_days(p_trip_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare trip public.trips; day_row public.days; next_number integer;
begin
  select * into trip from public.trips where id=p_trip_id
    and (user_id=auth.uid() or current_user in ('postgres','service_role')) for update;
  if not found then raise exception 'TRIP_NOT_FOUND'; end if;
  if trip.end_date < trip.start_date or trip.end_date - trip.start_date > 365 then
    raise exception 'INVALID_TRIP_RANGE';
  end if;
  -- Bloquea los días excluidos antes de comprobar contenido (también frente a inserts con FK).
  perform 1 from public.days where trip_id=p_trip_id
    and (date < trip.start_date or date > trip.end_date) for update;
  if exists (
    select 1 from public.days d where d.trip_id=p_trip_id
      and (d.date<trip.start_date or d.date>trip.end_date)
      and (nullif(btrim(d.title),'') is not null or nullif(btrim(d.notes),'') is not null
        or exists(select 1 from public.activities a where a.day_id=d.id)
        or exists(select 1 from public.photos p where p.day_id=d.id)
        or exists(select 1 from public.expenses e where e.day_id=d.id))
  ) then raise exception 'TRIP_DAYS_HAVE_CONTENT'; end if;
  delete from public.days where trip_id=p_trip_id and (date<trip.start_date or date>trip.end_date);
  -- Renumera hacia abajo primero y hacia arriba en orden inverso: no colisionan números únicos.
  for day_row in select * from public.days where trip_id=p_trip_id
      and day_number > date-trip.start_date+1 order by day_number asc loop
    next_number := day_row.date-trip.start_date+1;
    update public.days set day_number=next_number where id=day_row.id;
  end loop;
  for day_row in select * from public.days where trip_id=p_trip_id
      and day_number < date-trip.start_date+1 order by day_number desc loop
    next_number := day_row.date-trip.start_date+1;
    update public.days set day_number=next_number where id=day_row.id;
  end loop;
  insert into public.days(trip_id,date,day_number)
    select p_trip_id, trip.start_date+n, n+1
    from generate_series(0,trip.end_date-trip.start_date) n
    where not exists(select 1 from public.days d where d.trip_id=p_trip_id and d.date=trip.start_date+n);
end; $$;
revoke all on function public.reconcile_trip_days(uuid) from public,anon;
-- Invoker mantiene RLS; este permiso permite ejecutarla desde ensure_trip_days/trigger.
grant execute on function public.reconcile_trip_days(uuid) to authenticated;

create function public.ensure_trip_days(p_trip_id uuid)
returns setof public.days language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null or not exists(select 1 from public.trips where id=p_trip_id and user_id=auth.uid()) then
    raise exception 'TRIP_NOT_FOUND' using errcode='42501';
  end if;
  perform public.reconcile_trip_days(p_trip_id);
  return query select * from public.days where trip_id=p_trip_id order by day_number;
end; $$;
revoke all on function public.ensure_trip_days(uuid) from public,anon;
grant execute on function public.ensure_trip_days(uuid) to authenticated;

create function public.sync_trip_days_trigger() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin perform public.reconcile_trip_days(new.id); return new; end; $$;
revoke all on function public.sync_trip_days_trigger() from public,anon;
grant execute on function public.sync_trip_days_trigger() to authenticated;
create trigger sync_trip_days after insert or update of start_date,end_date on public.trips
  for each row execute function public.sync_trip_days_trigger();
commit;
