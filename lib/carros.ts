import type { Carrito, TareaRutina, Ubicacion } from "./types";

export interface AlertaCarro {
  carrito: Carrito;
  esperado: Ubicacion;
  desde: string; // "HH:MM" de la tarea que lo movía
}

const MIN_SEMANA = 7 * 1440;

function minutos(dia: number, hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return (dia - 1) * 1440 + h * 60 + m;
}

/**
 * Para cada carro, el destino de su última tarea ya vencida (semana circular).
 * Si no coincide con la ubicación actual, devuelve una alerta.
 * `gracia`: minutos de margen tras la hora de la tarea antes de avisar.
 */
export function alertasCarros(
  rutina: TareaRutina[],
  carritos: Carrito[],
  ahora: { dia: number; hora: string },
  gracia = 30,
): AlertaCarro[] {
  const ahoraMin = (minutos(ahora.dia, ahora.hora) - gracia + MIN_SEMANA) % MIN_SEMANA;
  const alertas: AlertaCarro[] = [];

  for (const c of carritos) {
    const tareas = rutina
      .filter((t) => t.carrito === c.id && t.destino)
      .sort((a, b) => minutos(a.dia_semana, a.hora) - minutos(b.dia_semana, b.hora));
    if (tareas.length === 0) continue;

    const vencidas = tareas.filter((t) => minutos(t.dia_semana, t.hora) <= ahoraMin);
    const ultima = vencidas.length ? vencidas[vencidas.length - 1] : tareas[tareas.length - 1];

    if (ultima.destino && ultima.destino !== c.ubicacion_actual) {
      alertas.push({ carrito: c, esperado: ultima.destino, desde: ultima.hora });
    }
  }
  return alertas;
}
