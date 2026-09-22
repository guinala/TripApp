begin;

alter table private.places_request_limits
  drop constraint if exists places_request_limits_action_check;

alter table private.places_request_limits
  add constraint places_request_limits_action_check
  check (action in (
    'autocomplete', 'details', 'nearby', 'textSearch',
    'discover', 'browse', 'content', 'photo'
  ));

create or replace function public.consume_places_request(
  p_user_id uuid,
  p_action text
)
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
    when 'discover' then 6
    when 'browse' then 10
    when 'content' then 20
    when 'photo' then 30
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
