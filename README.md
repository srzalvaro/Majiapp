# Calendario & Logística Familiar

Next.js (App Router) + Tailwind + Supabase, pensado para móvil.

## Puesta en marcha
1. Crea un proyecto en Supabase y ejecuta `supabase/schema.sql` en el SQL Editor.
2. `cp .env.example .env.local` y rellena URL y anon key.
3. `npm install && npm run dev`
4. En Vercel, define las mismas dos variables de entorno.

## Rutas
- `/abuelos` · `/lucia`: solo sus tareas, tarjetas grandes, pueden mover los carritos.
- `/padres`: matriz completa + botón "¿Cambio de planes?" (excepciones por día).
- Todo se actualiza en tiempo real (Supabase Realtime).
