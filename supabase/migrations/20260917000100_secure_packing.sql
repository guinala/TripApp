begin;

create or replace function public.replace_packing_items(p_trip_id uuid, p_items jsonb)
returns setof public.packing_items
language plpgsql security invoker set search_path = ''
as $$
declare item jsonb;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  perform 1 from public.trips where id = p_trip_id and user_id = auth.uid() for update;
  if not found then raise exception 'TRIP_NOT_FOUND' using errcode = '42501'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_PACKING_ITEMS' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 500 then raise exception 'TOO_MANY_ITEMS'; end if;
  for item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(item) <> 'object'
      or jsonb_typeof(item->'name') is distinct from 'string'
      or length(btrim(item->>'name')) not between 1 and 200
      or coalesce(item->>'category', '') not in ('docs','clothes','tech','hygiene','other')
      or (item ? 'checked' and jsonb_typeof(item->'checked') is distinct from 'boolean') then
      raise exception 'INVALID_PACKING_ITEM' using errcode = '22023';
    end if;
  end loop;
  delete from public.packing_items where trip_id = p_trip_id;
  return query
    insert into public.packing_items(trip_id, name, category, checked)
    select p_trip_id, btrim(value->>'name'), value->>'category',
           coalesce((value->>'checked')::boolean, false)
    from jsonb_array_elements(p_items) returning *;
end;
$$;
revoke all on function public.replace_packing_items(uuid,jsonb) from public, anon;
grant execute on function public.replace_packing_items(uuid,jsonb) to authenticated;
commit;
