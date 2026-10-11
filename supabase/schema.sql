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

insert into public.tareas_rutina (dia_semana, hora, titulo, detalle, tipo, nino, responsables, carrito) values
  -- LUNES
  (1, '08:30', 'Gloria trabaja en vuestra casa (hasta 15:00)', 'Come con vosotros.', 'horario', null, '{gloria,goyo,abuela}', null),
  (1, '08:15', 'Llevar a Mateo a la guardería', 'Entrada flexible 8:45–9:30.', 'llevar', 'mateo', '{abuela}', null),
  (1, '08:30', 'Dejar el Carro Verde en casa de los abuelos', 'Antes de ir al trabajo.', 'carrito', null, '{gloria}', 'verde'),
  (1, '16:00', 'Recoger a Jimena en el cole', 'Con el Carro Beige. Comida en el cole.', 'recogida', 'jimena', '{lucia}', 'beige'),
  (1, '16:00', 'Recoger a Mateo en la guardería', null, 'recogida', 'mateo', '{gloria}', null),
  (1, '17:00', 'Llevar el Carro Beige a Casa Familia', 'Los carros acaban el lunes en casa.', 'carrito', null, '{lucia}', 'beige'),
  (1, '17:00', 'Llevar el Carro Verde de casa de los abuelos a Casa Familia', 'Los carros acaban el lunes en casa.', 'carrito', null, '{gloria}', 'verde'),
  -- MARTES
  (2, '09:00', 'Gloria trabaja (09:00–13:30)', null, 'horario', null, '{gloria}', null),
  (2, '16:00', 'Recoger a Jimena en el cole', 'Os quedáis la tarde entera con ellos.', 'recogida', 'jimena', '{goyo,abuela}', null),
  (2, '16:00', 'Recoger a Mateo en la guardería', 'Os quedáis la tarde entera con ellos.', 'recogida', 'mateo', '{goyo,abuela}', null),
  -- MIÉRCOLES
  (3, '08:30', 'Gloria trabaja en vuestra casa (hasta 15:00)', 'Come con vosotros.', 'horario', null, '{gloria,goyo,abuela}', null),
  (3, '08:15', 'Llevar a Mateo a la guardería', 'Entrada flexible 8:45–9:30.', 'llevar', 'mateo', '{abuela}', null),
  (3, '16:00', 'Recoger a Jimena en el cole', 'Tarde con los padres.', 'recogida', 'jimena', '{gloria}', null),
  (3, '16:00', 'Recoger a Mateo en la guardería', 'Tarde con los padres.', 'recogida', 'mateo', '{alvaro}', null),
  -- JUEVES
  (4, '10:00', 'Gloria trabaja (10:00–14:00)', null, 'horario', null, '{gloria}', null),
  (4, '16:00', 'Recoger a Jimena en el cole', 'Tarde con los padres.', 'recogida', 'jimena', '{gloria}', null),
  (4, '16:00', 'Recoger a Mateo en la guardería', 'Tarde con los padres.', 'recogida', 'mateo', '{goyo}', null),
  (4, '17:00', 'Llevar a Jimena y Mateo a inglés', 'Se queda con ellos durante la clase.', 'otro', null, '{alvaro}', null),
  (4, '17:00', 'Gimnasio (17:00–18:00)', null, 'horario', null, '{gloria}', null),
  (4, '17:00', 'Libre desde las 17:00', null, 'horario', null, '{goyo}', null),
  -- VIERNES
  (5, '09:00', 'Gloria trabaja (09:00–13:30)', null, 'horario', null, '{gloria}', null),
  (5, '14:00', 'Recoger a Jimena (salida a las 14:00)', 'Comen todos en casa.', 'recogida', 'jimena', '{gloria}', null),
  (5, '14:00', 'Recoger a Mateo (salida a las 14:00)', 'Comen todos en casa.', 'recogida', 'mateo', '{alvaro}', null),
  -- DOMINGO
  (7, '10:00', 'Recoger el Carro Beige y llevarlo a tu casa', 'Durante el día, para tenerlo listo el lunes.', 'carrito', null, '{lucia}', 'beige');

update public.tareas_rutina set destino = 'Casa Abuelos'  where carrito = 'verde' and dia_semana = 1 and hora = '08:30';
update public.tareas_rutina set destino = 'Casa Familia'   where carrito = 'verde' and dia_semana = 1 and hora = '17:00';
update public.tareas_rutina set destino = 'Casa Tía Lucía' where carrito = 'beige' and dia_semana = 7;
update public.tareas_rutina set destino = 'Casa Familia'   where carrito = 'beige' and dia_semana = 1 and hora = '17:00';

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

-- 5. Tiempo real -------------------------------------------------------------
do $$ begin
  begin alter publication supabase_realtime add table public.carritos; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.excepciones; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.dias_especiales; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.eventos; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.tareas_rutina; exception when duplicate_object then null; end;
end $$;
