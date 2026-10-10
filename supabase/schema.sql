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
language plpgsql as $$
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
create index if not exists tareas_rutina_dia_idx on public.tareas_rutina (dia_semana, hora);

-- Reset del seed (la rutina es plantilla: se recarga entera)
truncate public.tareas_rutina restart identity;

insert into public.tareas_rutina (dia_semana, hora, titulo, detalle, tipo, nino, responsables, carrito) values
  -- LUNES
  (1, '08:00', 'Gloria trabaja (08:00–15:00)', 'Come en casa de los abuelos.', 'horario', null, '{gloria}', null),
  (1, '08:15', 'Llevar a Mateo a la guardería', 'Entrada flexible 8:45–9:30.', 'llevar', 'mateo', '{abuela}', null),
  (1, '08:30', 'Dejar el Carro Verde en casa de los abuelos', 'Antes de ir al trabajo.', 'carrito', null, '{gloria}', 'verde'),
  (1, '08:30', 'Álvaro teletrabaja (hasta 17:30)', 'Gym 13:00–14:00.', 'horario', null, '{alvaro}', null),
  (1, '16:00', 'Recoger a Jimena en el cole', 'Con el Carro Beige. Comida en el cole.', 'recogida', 'jimena', '{lucia}', 'beige'),
  (1, '16:00', 'Recoger a Mateo en la guardería', null, 'recogida', 'mateo', '{gloria}', null),
  -- MARTES
  (2, '09:00', 'Gloria trabaja (09:00–13:30)', null, 'horario', null, '{gloria}', null),
  (2, '09:00', 'Álvaro teletrabaja (hasta 17:30)', null, 'horario', null, '{alvaro}', null),
  (2, '16:00', 'Recoger a Jimena en el cole', 'Os quedáis la tarde entera con ellos.', 'recogida', 'jimena', '{goyo,abuela}', null),
  (2, '16:00', 'Recoger a Mateo en la guardería', 'Os quedáis la tarde entera con ellos.', 'recogida', 'mateo', '{goyo,abuela}', null),
  -- MIÉRCOLES
  (3, '08:00', 'Gloria trabaja (08:00–15:00)', 'Come en casa de los abuelos.', 'horario', null, '{gloria}', null),
  (3, '08:15', 'Llevar a Mateo a la guardería', 'Entrada flexible 8:45–9:30.', 'llevar', 'mateo', '{abuela}', null),
  (3, '08:30', 'Álvaro teletrabaja (para a las 15:50)', null, 'horario', null, '{alvaro}', null),
  (3, '16:00', 'Recoger a Jimena en el cole', 'Tarde con los padres.', 'recogida', 'jimena', '{gloria}', null),
  (3, '16:00', 'Recoger a Mateo en la guardería', 'Tarde con los padres.', 'recogida', 'mateo', '{alvaro}', null),
  -- JUEVES
  (4, '10:00', 'Gloria trabaja (10:00–14:00)', null, 'horario', null, '{gloria}', null),
  (4, '09:00', 'Álvaro teletrabaja (para a las 16:45)', 'Gym 13:00–14:00.', 'horario', null, '{alvaro}', null),
  (4, '16:00', 'Recoger a Jimena en el cole', 'Tarde con los padres.', 'recogida', 'jimena', '{gloria}', null),
  (4, '16:00', 'Recoger a Mateo en la guardería', 'Tarde con los padres.', 'recogida', 'mateo', '{goyo}', null),
  -- VIERNES
  (5, '09:00', 'Gloria trabaja (09:00–13:30)', null, 'horario', null, '{gloria}', null),
  (5, '09:00', 'Álvaro teletrabaja (hasta 17:00)', null, 'horario', null, '{alvaro}', null),
  (5, '14:00', 'Recoger a Jimena (salida a las 14:00)', 'Comen todos en casa.', 'recogida', 'jimena', '{gloria,alvaro}', null),
  (5, '14:00', 'Recoger a Mateo (salida a las 14:00)', 'Comen todos en casa.', 'recogida', 'mateo', '{gloria,alvaro}', null),
  -- DOMINGO
  (7, '10:00', 'Recoger el Carro Beige y llevarlo a tu casa', 'Durante el día, para tenerlo listo el lunes.', 'carrito', null, '{lucia}', 'beige');

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

-- 4. Seguridad ---------------------------------------------------------------
-- App familiar sin login: la anon key puede leer todo, mover carros y gestionar
-- excepciones; NO puede tocar la rutina plantilla. Comparte la URL solo con la familia.
alter table public.carritos enable row level security;
alter table public.carritos_historial enable row level security;
alter table public.tareas_rutina enable row level security;
alter table public.excepciones enable row level security;

drop policy if exists carritos_read on public.carritos;
drop policy if exists carritos_move on public.carritos;
drop policy if exists historial_read on public.carritos_historial;
drop policy if exists tareas_read on public.tareas_rutina;
drop policy if exists excepciones_all on public.excepciones;

create policy carritos_read on public.carritos for select using (true);
create policy carritos_move on public.carritos for update using (true) with check (true);
create policy historial_read on public.carritos_historial for select using (true);
create policy tareas_read on public.tareas_rutina for select using (true);
create policy excepciones_all on public.excepciones for all using (true) with check (true);

-- 5. Tiempo real -------------------------------------------------------------
do $$ begin
  begin alter publication supabase_realtime add table public.carritos; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.excepciones; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.tareas_rutina; exception when duplicate_object then null; end;
end $$;
