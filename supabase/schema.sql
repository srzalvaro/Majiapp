-- Calendario & Logística Familiar · esquema Supabase
-- Ejecutar completo en el SQL Editor. Es idempotente (se puede relanzar).

-- 1. Carritos --------------------------------------------------------------
create table if not exists public.carritos (
  id text primary key,
  nombre text not null,
  color_hex text not null,
  asignacion_preferente text,
  ubicacion_actual text not null
    check (ubicacion_actual in ('Casa Familia', 'Casa Abuelos', 'Casa Tía Lucía')),
  movido_por text, -- quién lo movió por última vez (lo rellena la app)
  updated_at timestamptz not null default now()
);

insert into public.carritos (id, nombre, color_hex, asignacion_preferente, ubicacion_actual) values
  ('beige', 'Carro Beige', '#d2b48c', 'Jimena', 'Casa Familia'),
  ('verde', 'Carro Verde', '#4caf50', 'Mateo',  'Casa Familia')
on conflict (id) do nothing;

-- 1b. Historial (trazabilidad: quién/cuándo movió cada carro) ---------------
create table if not exists public.carritos_historial (
  id bigserial primary key,
  carrito_id text not null references public.carritos(id),
  ubicacion text not null,
  movido_por text,
  created_at timestamptz not null default now()
);

create or replace function public.carritos_before_update() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.carritos_log_move() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.ubicacion_actual is distinct from old.ubicacion_actual then
    insert into public.carritos_historial (carrito_id, ubicacion, movido_por)
    values (new.id, new.ubicacion_actual, new.movido_por);
  end if;
  return new;
end $$;

drop trigger if exists trg_carritos_before on public.carritos;
create trigger trg_carritos_before before update on public.carritos
  for each row execute function public.carritos_before_update();

drop trigger if exists trg_carritos_log on public.carritos;
create trigger trg_carritos_log after update on public.carritos
  for each row execute function public.carritos_log_move();

-- 2. Rutina semanal: UNA FILA POR TAREA (se puede filtrar por persona) -----
-- Personas: alvaro, gloria (madre), goyo (abuelo), abuela, lucia (tía)
create table if not exists public.tareas_rutina (
  id bigserial primary key,
  dia_semana int not null check (dia_semana between 1 and 7), -- 1=Lunes … 7=Domingo
  hora text not null check (hora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  titulo text not null,
  detalle text,
  tipo text not null check (tipo in ('recogida', 'llevar', 'horario', 'carrito', 'otro')),
  nino text check (nino in ('jimena', 'mateo')),
  responsables text[] not null,
  carrito text references public.carritos(id)
);
-- Dónde debe quedar el carro al hacer esta tarea (alertas si no está ahí)
alter table public.tareas_rutina add column if not exists destino text
  check (destino in ('Casa Familia', 'Casa Abuelos', 'Casa Tía Lucía'));
create index if not exists tareas_rutina_dia_idx on public.tareas_rutina (dia_semana, hora);

-- Reset del seed (la rutina es plantilla: se recarga entera)
truncate public.tareas_rutina restart identity;

-- Fundición = Casa Familia · Viveros = Casa Abuelos.
-- Las tareas con "destino" alimentan las alertas de carros (si a su hora el carro no está ahí).
-- Las que llevan carrito pero no destino son solo informativas.
insert into public.tareas_rutina (dia_semana, hora, titulo, detalle, tipo, nino, responsables, carrito, destino) values
  -- LUNES · el Beige llega de casa de Lucía (domingo)
  (1, '08:30', 'Llevar a Jimena al cole', 'Entrada 8:30.', 'llevar', 'jimena', '{alvaro}', null, null),
  (1, '08:15', 'Llevar a Mateo a la guardería', 'Entrada flexible 8:45–9:30. Al volver te llevas el Carro Verde a Viveros.', 'llevar', 'mateo', '{abuela}', null, null),
  (1, '09:30', 'Llevar el Carro Verde a Viveros (casa de los abuelos)', 'Desde Fundición.', 'carrito', null, '{abuela}', 'verde', 'Casa Abuelos'),
  (1, '15:00', 'Gloria viene a comer a vuestra casa', 'Sale del cole a las 15:00 y come con vosotros.', 'horario', null, '{gloria,goyo,abuela}', null, null),
  (1, '15:30', 'Gloria se lleva el Carro Verde después de comer', 'Para recoger a Mateo.', 'carrito', null, '{gloria,goyo,abuela}', 'verde', null),
  (1, '16:00', 'Recoger a Jimena en el cole', 'Con el Carro Beige (que Lucía tiene desde el domingo).', 'recogida', 'jimena', '{lucia}', 'beige', null),
  (1, '16:00', 'Recoger a Mateo en la guardería', 'Con el Carro Verde.', 'recogida', 'mateo', '{gloria}', 'verde', null),
  (1, '20:00', 'Llevar el Carro Beige a Fundición (Casa Familia)', 'Los carros acaban el lunes en casa.', 'carrito', null, '{lucia}', 'beige', 'Casa Familia'),
  (1, '20:00', 'Llevar el Carro Verde a Fundición (Casa Familia)', 'Los carros acaban el lunes en casa.', 'carrito', null, '{gloria}', 'verde', 'Casa Familia'),
  -- MARTES · Beige en Viveros todo el día; el Verde lo buscan los abuelos por la tarde
  (2, '08:30', 'Llevar a Jimena al cole', 'Entrada 8:30.', 'llevar', 'jimena', '{alvaro}', null, null),
  (2, '08:30', 'Llevar a Mateo a la guardería', null, 'llevar', 'mateo', '{gloria}', null, null),
  (2, '08:30', 'Gloria deja el Carro Beige en Viveros', 'Lo usáis toda la tarde.', 'carrito', null, '{gloria,goyo,abuela}', 'beige', 'Casa Abuelos'),
  (2, '15:00', 'Pasar por Fundición a por el Carro Verde', 'En algún momento antes de recoger a Mateo.', 'carrito', null, '{goyo,abuela}', 'verde', 'Casa Abuelos'),
  (2, '16:00', 'Recoger a Jimena en el cole', 'Con el Carro Beige. Os quedáis la tarde entera con ellos.', 'recogida', 'jimena', '{goyo,abuela}', 'beige', null),
  (2, '16:00', 'Recoger a Mateo en la guardería', 'Con el Carro Verde. Os quedáis la tarde entera con ellos.', 'recogida', 'mateo', '{goyo,abuela}', 'verde', null),
  (2, '20:00', 'Devolver el Carro Beige a Fundición (Casa Familia)', 'Por la noche, al traer a los peques.', 'carrito', null, '{goyo,abuela}', 'beige', 'Casa Familia'),
  (2, '20:00', 'Llevaros el Carro Verde a Viveros', 'Se queda en vuestra casa esta noche.', 'carrito', null, '{goyo,abuela}', 'verde', 'Casa Abuelos'),
  -- MIÉRCOLES
  (3, '08:30', 'Llevar a Jimena al cole', 'Entrada 8:30.', 'llevar', 'jimena', '{alvaro}', null, null),
  (3, '08:15', 'Llevar a Mateo a la guardería', 'Entrada flexible 8:45–9:30. Al volver te llevas el Carro Beige a Viveros.', 'llevar', 'mateo', '{abuela}', null, null),
  (3, '09:30', 'Llevar el Carro Beige de Fundición a Viveros', 'Al volver de la guardería. El Verde ya está en vuestra casa.', 'carrito', null, '{abuela}', 'beige', 'Casa Abuelos'),
  (3, '15:00', 'Gloria viene a comer a vuestra casa', 'Sale del cole a las 15:00 y come con vosotros.', 'horario', null, '{gloria,goyo,abuela}', null, null),
  (3, '15:30', 'Gloria coge el Carro Beige en Viveros', 'Para recoger a Jimena.', 'carrito', null, '{gloria,goyo,abuela}', 'beige', null),
  (3, '16:00', 'Recoger a Jimena en el cole', 'Con el Carro Beige. Tarde con los padres.', 'recogida', 'jimena', '{gloria}', 'beige', null),
  (3, '16:00', 'Recoger a Mateo y traerlo a Fundición', 'Con el Carro Verde (el de Viveros). Lo dejas en casa a las 16:30.', 'recogida', 'mateo', '{abuela}', 'verde', null),
  (3, '20:00', 'Dejar el Carro Verde en Fundición (Casa Familia)', 'A final del día. La abuela lo trae con Mateo.', 'carrito', null, '{abuela}', 'verde', 'Casa Familia'),
  (3, '20:00', 'Dejar el Carro Beige en Fundición (Casa Familia)', 'A final del día. Gloria lo trae con Jimena.', 'carrito', null, '{gloria}', 'beige', 'Casa Familia'),
  -- JUEVES
  (4, '08:30', 'Llevar a Jimena al cole', 'Entrada 8:30.', 'llevar', 'jimena', '{gloria}', null, null),
  (4, '08:45', 'Llevar a Mateo a la guardería', 'Entrada flexible 8:45–9:30.', 'llevar', 'mateo', '{alvaro}', null, null),
  (4, '15:00', 'Coger el Carro Beige en Fundición y llevarlo a Viveros', 'Para recoger a Mateo.', 'carrito', null, '{goyo,abuela}', 'beige', 'Casa Abuelos'),
  (4, '16:00', 'Recoger a Jimena en el cole', 'Con el Carro Verde. Tarde con los padres.', 'recogida', 'jimena', '{gloria}', 'verde', null),
  (4, '16:00', 'Recoger a Mateo en la guardería', 'Con el Carro Beige (el de Viveros).', 'recogida', 'mateo', '{goyo}', 'beige', null),
  (4, '17:00', 'Llevar a Jimena y Mateo a inglés', 'Se queda con ellos durante la clase.', 'otro', null, '{alvaro}', null, null),
  (4, '17:00', 'Gimnasio (17:00–18:00)', null, 'horario', null, '{gloria}', null, null),
  (4, '17:00', 'Libre desde las 17:00', null, 'horario', null, '{goyo}', null, null),
  (4, '20:00', 'Los dos carros vuelven a Fundición (Casa Familia)', 'A final del día. Trae el Beige de Viveros.', 'carrito', null, '{goyo,abuela}', 'beige', 'Casa Familia'),
  (4, '20:00', 'Carro Verde en Fundición (Casa Familia)', null, 'carrito', null, '{gloria}', 'verde', 'Casa Familia'),
  -- VIERNES
  (5, '08:30', 'Llevar a Jimena al cole', 'Entrada 8:30.', 'llevar', 'jimena', '{alvaro}', null, null),
  (5, '08:15', 'Llevar a Mateo a la guardería con el Carro Beige', 'Después te llevas el carro al cole.', 'llevar', 'mateo', '{gloria}', 'beige', null),
  (5, '14:00', 'Recoger a Jimena (salida a las 14:00)', 'Con el Carro Beige. Comen todos en casa.', 'recogida', 'jimena', '{gloria}', 'beige', null),
  (5, '14:00', 'Recoger a Mateo (salida a las 14:00)', 'Con el Carro Verde. Comen todos en casa.', 'recogida', 'mateo', '{alvaro}', 'verde', null),
  -- DOMINGO
  (7, '10:00', 'Recoger el Carro Beige y llevarlo a tu casa', 'Durante el día, para tenerlo listo el lunes.', 'carrito', null, '{lucia}', 'beige', 'Casa Tía Lucía');

-- 3. Excepciones puntuales: sustituyen a quién recoge a un niño ese día ------
create table if not exists public.excepciones (
  id bigserial primary key,
  fecha date not null,
  nino text not null check (nino in ('jimena', 'mateo')),
  responsables text[] not null,
  nota text,
  created_at timestamptz not null default now(),
  unique (fecha, nino)
);

-- Una excepción puede ser de "recogida" o de "llevar" (misma fecha y niño, tareas distintas)
alter table public.excepciones add column if not exists tipo text not null default 'recogida'
  check (tipo in ('recogida', 'llevar'));
alter table public.excepciones drop constraint if exists excepciones_fecha_nino_key;
alter table public.excepciones drop constraint if exists excepciones_fecha_nino_tipo_key;
alter table public.excepciones add constraint excepciones_fecha_nino_tipo_key unique (fecha, nino, tipo);

-- 3b. Días especiales (festivo / sin cole): ese día NO se aplica la rutina semanal
create table if not exists public.dias_especiales (
  id bigserial primary key,
  fecha date not null unique,
  titulo text not null default 'Festivo',
  nota text,
  created_at timestamptz not null default now()
);

-- 3c. Planes sueltos (p. ej. "Abuelos con los peques el sábado"), aparecen solo a quien se asigna
create table if not exists public.eventos (
  id bigserial primary key,
  fecha date not null,
  hora text not null check (hora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  titulo text not null,
  detalle text,
  responsables text[] not null,
  created_at timestamptz not null default now()
);
create index if not exists eventos_fecha_idx on public.eventos (fecha);

-- 3d. Tareas marcadas como hechas (por fecha). tarea_key: 'r:<id>' rutina · 'e:<id>' plan suelto
create table if not exists public.tareas_hechas (
  id bigserial primary key,
  fecha date not null,
  tarea_key text not null,
  hecho_por text,
  created_at timestamptz not null default now(),
  unique (fecha, tarea_key)
);

-- 3e. Tareas omitidas un día concreto (p. ej. "hoy recoge Lucía con el Beige, no aplica llevarlo a Viveros")
create table if not exists public.tareas_omitidas (
  id bigserial primary key,
  fecha date not null,
  tarea_key text not null, -- 'r:<id>' de la rutina
  created_at timestamptz not null default now(),
  unique (fecha, tarea_key)
);

-- 3f. Ausencias: un peque no va al cole/guardería esos días (malo, vacaciones…)
create table if not exists public.ausencias (
  id bigserial primary key,
  fecha date not null,
  nino text not null check (nino in ('jimena', 'mateo')),
  nota text,
  created_at timestamptz not null default now(),
  unique (fecha, nino)
);

-- 4. Seguridad ---------------------------------------------------------------
-- Login por rol (Supabase Auth). El rol vive en app_metadata.rol del usuario
-- ('abuelos' | 'lucia' | 'padres'); app_metadata solo lo puede cambiar el servidor,
-- el usuario no. Sin sesión no se lee nada.
alter table public.carritos enable row level security;
alter table public.carritos_historial enable row level security;
alter table public.tareas_rutina enable row level security;
alter table public.excepciones enable row level security;
alter table public.dias_especiales enable row level security;
alter table public.eventos enable row level security;
alter table public.tareas_hechas enable row level security;
alter table public.tareas_omitidas enable row level security;
alter table public.ausencias enable row level security;

create or replace function public.rol_actual() returns text
language sql stable as $$ select auth.jwt() -> 'app_metadata' ->> 'rol' $$;

drop policy if exists carritos_read on public.carritos;
drop policy if exists carritos_move on public.carritos;
drop policy if exists historial_read on public.carritos_historial;
drop policy if exists tareas_read on public.tareas_rutina;
drop policy if exists excepciones_all on public.excepciones;
drop policy if exists excepciones_read on public.excepciones;
drop policy if exists excepciones_write on public.excepciones;
drop policy if exists especiales_read on public.dias_especiales;
drop policy if exists especiales_write on public.dias_especiales;
drop policy if exists eventos_read on public.eventos;
drop policy if exists eventos_write on public.eventos;
drop policy if exists hechas_all on public.tareas_hechas;
drop policy if exists omitidas_read on public.tareas_omitidas;
drop policy if exists omitidas_write on public.tareas_omitidas;
drop policy if exists ausencias_read on public.ausencias;
drop policy if exists ausencias_write on public.ausencias;

create policy carritos_read on public.carritos for select to authenticated using (public.rol_actual() is not null);
create policy carritos_move on public.carritos for update to authenticated
  using (public.rol_actual() is not null) with check (public.rol_actual() is not null);
create policy historial_read on public.carritos_historial for select to authenticated using (public.rol_actual() is not null);
create policy tareas_read on public.tareas_rutina for select to authenticated using (public.rol_actual() is not null);
create policy excepciones_read on public.excepciones for select to authenticated using (public.rol_actual() is not null);
-- Solo los padres crean/modifican/borran excepciones
create policy excepciones_write on public.excepciones for all to authenticated
  using (public.rol_actual() = 'padres') with check (public.rol_actual() = 'padres');

create policy especiales_read on public.dias_especiales for select to authenticated using (public.rol_actual() is not null);
create policy especiales_write on public.dias_especiales for all to authenticated
  using (public.rol_actual() = 'padres') with check (public.rol_actual() = 'padres');
create policy eventos_read on public.eventos for select to authenticated using (public.rol_actual() is not null);
create policy eventos_write on public.eventos for all to authenticated
  using (public.rol_actual() = 'padres') with check (public.rol_actual() = 'padres');

-- Cualquier rol puede marcar/desmarcar tareas como hechas
create policy hechas_all on public.tareas_hechas for all to authenticated
  using (public.rol_actual() is not null) with check (public.rol_actual() is not null);

-- Omitir tareas: lo ven todos, solo los padres lo cambian
create policy omitidas_read on public.tareas_omitidas for select to authenticated using (public.rol_actual() is not null);
create policy omitidas_write on public.tareas_omitidas for all to authenticated
  using (public.rol_actual() = 'padres') with check (public.rol_actual() = 'padres');

create policy ausencias_read on public.ausencias for select to authenticated using (public.rol_actual() is not null);
create policy ausencias_write on public.ausencias for all to authenticated
  using (public.rol_actual() = 'padres') with check (public.rol_actual() = 'padres');

-- 5. Tiempo real -------------------------------------------------------------
do $$ begin
  begin alter publication supabase_realtime add table public.carritos; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.excepciones; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.dias_especiales; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.eventos; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.tareas_hechas; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.tareas_omitidas; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.ausencias; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.tareas_rutina; exception when duplicate_object then null; end;
end $$;
