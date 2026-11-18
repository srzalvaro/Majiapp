# Calendario & Logística Familiar

Web móvil (Next.js + Tailwind) con la rutina semanal de la familia: quién lleva y recoge a Jimena y Mateo, y los carritos.
**No tiene base de datos ni login**: todo está en el código y Vercel despliega solo al subir a `main`.

## Pantallas

- `/` elige vista.
- `/abuelos` · lo siguiente que toca, grande y sencillo (la hora sale del móvil).
- `/padres` · todas las tareas de la semana, selector de día y botón **Compartir agenda** (WhatsApp).

## Dónde está cada cosa

| Qué | Archivo |
|---|---|
| Rutina semanal fija | `lib/rutina.ts` |
| Cambios de un día (festivos, quién recoge, hora de salida, ausencias, planes, tareas omitidas) | `lib/cambios.ts` |
| Mensaje de WhatsApp | `lib/compartir.ts` |
| Personas y vistas | `lib/roles.ts` |

Los cambios puntuales se piden por el chat de Claude Code, que edita `lib/cambios.ts` y lo sube a `main`.

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```
