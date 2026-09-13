begin;

-- Función atómica para reemplazar los ítems de equipaje de un viaje en una única transacción
create or replace function public.replace_packing_items(
  p_trip_id uuid,
  p_items jsonb
)
returns setof public.packing_items
language plpgsql
security definer
as $$
begin
  -- Borrar los elementos existentes del viaje
  delete from public.packing_items where trip_id = p_trip_id;

  -- Insertar los nuevos elementos si la lista no está vacía
  if p_items is not null and jsonb_array_length(p_items) > 0 then
    return query
    insert into public.packing_items (trip_id, name, category, checked)
    select
      p_trip_id,
      (item->>'name')::text,
      (item->>'category')::text,
      coalesce((item->>'checked')::boolean, false)
    from jsonb_array_elements(p_items) as item
    returning *;
  end if;

  return;
end;
$$;

grant execute on function public.replace_packing_items(uuid, jsonb) to authenticated;

commit;
