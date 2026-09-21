begin;
-- Datos editoriales recuperados del catálogo original, no reseñas de Google.
alter table public.explore_destinations
  add column if not exists editorial_rating numeric check (editorial_rating between 0 and 5),
  add column if not exists price_range text check (price_range in ('low', 'mid', 'high')),
  add column if not exists language_code text,
  add column if not exists language_label text;
-- Conserva cualquier edición que ya se haya realizado en Supabase.
update public.explore_destinations as destination
set editorial_rating = coalesce(destination.editorial_rating, original.rating::numeric),
    price_range = coalesce(destination.price_range, original.price_range),
    language_code = coalesce(destination.language_code, original.language_code),
    language_label = coalesce(destination.language_label, original.language_label)
from (values
  ('lisboa', 'Portugal', '4.8', 'mid', 'PT', 'Portugués'),
  ('madrid', 'España', '4.4', 'low', 'ES', 'Español'),
  ('paris', 'Francia', '4.6', 'high', 'FR', 'Francés'),
  ('roma', 'Italia', '4.7', 'mid', 'IT', 'Italiano'),
  ('praga', 'Chequia', '4.5', 'low', 'CS', 'Checo'),
  ('amsterdam', 'Países Bajos', '4.4', 'high', 'NL', 'Neerlandés'),
  ('reikiavik', 'Islandia', '4.6', 'high', 'IS', 'Islandés'),
  ('atenas', 'Grecia', '4.3', 'low', 'EL', 'Griego'),
  ('santorini', 'Grecia', '4.7', 'high', 'EL', 'Griego'),
  ('estambul', 'Turquía', '4.6', 'low', 'TR', 'Turco'),
  ('tokio', 'Japón', '4.5', 'high', 'JA', 'Japonés'),
  ('kioto', 'Japón', '4.8', 'high', 'JA', 'Japonés'),
  ('bali', 'Indonesia', '4.7', 'mid', 'ID', 'Indonesio'),
  ('bangkok', 'Tailandia', '4.4', 'low', 'TH', 'Tailandés'),
  ('hanoi', 'Vietnam', '4.3', 'low', 'VI', 'Vietnamita'),
  ('seul', 'Corea del Sur', '4.5', 'mid', 'KO', 'Coreano'),
  ('singapur', 'Singapur', '4.4', 'high', 'EN', 'Inglés'),
  ('dubai', 'Emiratos Árabes', '4.2', 'high', 'AR', 'Árabe'),
  ('nueva-york', 'EEUU', '4.2', 'high', 'EN', 'Inglés'),
  ('cusco', 'Perú', '4.8', 'low', 'ES', 'Español'),
  ('buenos-aires', 'Argentina', '4.5', 'low', 'ES', 'Español'),
  ('rio', 'Brasil', '4.6', 'mid', 'PT', 'Portugués'),
  ('cdmx', 'México', '4.5', 'low', 'ES', 'Español'),
  ('vancouver', 'Canadá', '4.3', 'high', 'EN', 'Inglés'),
  ('la-habana', 'Cuba', '4.1', 'low', 'ES', 'Español'),
  ('marrakech', 'Marruecos', '4.4', 'low', 'AR', 'Árabe'),
  ('el-cairo', 'Egipto', '4.3', 'low', 'AR', 'Árabe'),
  ('ciudad-del-cabo', 'Sudáfrica', '4.7', 'mid', 'EN', 'Inglés'),
  ('sidney', 'Australia', '4.5', 'high', 'EN', 'Inglés'),
  ('auckland', 'Nueva Zelanda', '4.2', 'high', 'EN', 'Inglés')
) as original(id, country, rating, price_range, language_code, language_label)
where destination.id = original.id and destination.country = original.country;
commit;
