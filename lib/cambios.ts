import type { Ausencia, DiaEspecial, Evento, Excepcion, Omitida } from "./types";

/**
 * Cambios puntuales sobre la rutina semanal (rutina.ts).
 * Se piden por el chat y se añaden aquí; Vercel despliega solo al subirlos a main.
 * Fechas en formato "AAAA-MM-DD". Borra las líneas de días que ya pasaron cuando quieras.
 */

/** Quién lleva o recoge a un niño un día concreto, o su hora. */
export const EXCEPCIONES: Excepcion[] = [
  // { fecha: "2026-11-20", nino: "jimena", tipo: "recogida", responsables: ["abuela"], nota: "Álvaro trabaja" },
  // { fecha: "2026-11-21", nino: "jimena", tipo: "recogida", hora: "13:00" }, // solo cambia la hora
];

/** Festivos o días sin cole (no se aplica la rutina). */
export const DIAS_ESPECIALES: DiaEspecial[] = [
  // { fecha: "2026-12-08", titulo: "Inmaculada", nota: "Sin cole" },
];

/** Planes sueltos. */
export const EVENTOS: Evento[] = [
  // { fecha: "2026-11-22", hora: "10:00", titulo: "Los abuelos se quedan con los peques", responsables: ["goyo", "abuela"] },
];

/** Un niño que no va ese día (malo, vacaciones…). */
export const AUSENCIAS: Ausencia[] = [
  // { fecha: "2026-11-19", nino: "mateo", nota: "Malo" },
];

/** Tareas de la rutina que no aplican un día concreto. */
export const OMITIDAS: Omitida[] = [
  // { fecha: "2026-11-19", hora: "09:00", texto: "Carro Beige" },
];
