begin;
-- Solo los 30 destinos del catálogo inicial; no publica otros borradores.
update public.explore_destinations as destination
set published = true, country_code = coalesce(destination.country_code, seed.country_code)
from (values
  ('lisboa', 'Portugal', 'PT'),
  ('madrid', 'España', 'ES'),
  ('paris', 'Francia', 'FR'),
  ('roma', 'Italia', 'IT'),
  ('praga', 'Chequia', 'CZ'),
  ('amsterdam', 'Países Bajos', 'NL'),
  ('reikiavik', 'Islandia', 'IS'),
  ('atenas', 'Grecia', 'GR'),
  ('santorini', 'Grecia', 'GR'),
  ('estambul', 'Turquía', 'TR'),
  ('tokio', 'Japón', 'JP'),
  ('kioto', 'Japón', 'JP'),
  ('bali', 'Indonesia', 'ID'),
  ('bangkok', 'Tailandia', 'TH'),
  ('hanoi', 'Vietnam', 'VN'),
  ('seul', 'Corea del Sur', 'KR'),
  ('singapur', 'Singapur', 'SG'),
  ('dubai', 'Emiratos Árabes', 'AE'),
  ('nueva-york', 'EEUU', 'US'),
  ('cusco', 'Perú', 'PE'),
  ('buenos-aires', 'Argentina', 'AR'),
  ('rio', 'Brasil', 'BR'),
  ('cdmx', 'México', 'MX'),
  ('vancouver', 'Canadá', 'CA'),
  ('la-habana', 'Cuba', 'CU'),
  ('marrakech', 'Marruecos', 'MA'),
  ('el-cairo', 'Egipto', 'EG'),
  ('ciudad-del-cabo', 'Sudáfrica', 'ZA'),
  ('sidney', 'Australia', 'AU'),
  ('auckland', 'Nueva Zelanda', 'NZ')
) as seed(id, country, country_code)
where destination.id = seed.id and destination.country = seed.country;
commit;
