begin;

create schema if not exists private;

create table private.places_request_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (
    action in ('autocomplete', 'details', 'nearby', 'textSearch')
  ),
  window_start timestamptz not null,
  request_count integer not null,
  primary key (user_id, action)
);

revoke all on private.places_request_limits from public, anon, authenticated;

create function public.consume_places_request(p_user_id uuid, p_action text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := date_trunc('minute', clock_timestamp());
  v_limit integer;
  v_count integer;
begin
  v_limit := case p_action
    when 'autocomplete' then 60
    when 'details' then 20
    when 'nearby' then 10
    when 'textSearch' then 10
    else null
  end;
  if p_user_id is null or v_limit is null then
    raise exception 'Invalid request limit arguments';
  end if;

  insert into private.places_request_limits as limits
    (user_id, action, window_start, request_count)
  values (p_user_id, p_action, v_window, 1)
  on conflict (user_id, action) do update
    set request_count = case
      when limits.window_start = excluded.window_start
        then least(limits.request_count + 1, v_limit + 1)
      else 1
    end,
    window_start = excluded.window_start
  returning request_count into v_count;

  return v_count <= v_limit;
end;
$$;

revoke all on function public.consume_places_request(uuid, text)
  from public, anon, authenticated;
grant execute on function public.consume_places_request(uuid, text)
  to service_role;

commit;