import { diaSemana, sumarDias } from "./dates";
import type { Carrito, TareaRutina, Ubicacion } from "./types";

export interface AlertaCarro {
  carrito: Carrito;
  esperado: Ubicacion;
  desde: string; // "HH:MM" de la tarea que lo movía
}

const DIAS_ATRAS = 7;

function aMinutos(fecha: string, hora: string): number {
  const [y, m, d] = fecha.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  return Date.UTC(y, m - 1, d, h, min) / 60000;
}

/**
 * Para cada carro, el destino de su última tarea ya vencida, usando FECHAS REALES
 * de los últimos 7 días. Si no coincide con la ubicación actual, devuelve una alerta.
 *
 * - En un día especial (festivo / sin cole) la rutina no se aplica: sus tareas se saltan.
 * - Las tareas de domingo preparan el lunes: si el lunes es especial, también se saltan.
 * - `gracia`: minutos de margen tras la hora de la tarea antes de avisar.
 */
export function alertasCarros(
  rutina: TareaRutina[],
  carritos: Carrito[],
  ahora: { fecha: string; hora: string },
  especiales: string[],
  gracia = 30,
): AlertaCarro[] {
  const esEspecial = new Set(especiales);
  const limite = aMinutos(ahora.fecha, ahora.hora) - gracia;
  const alertas: AlertaCarro[] = [];

  for (const c of carritos) {
    const tareas = rutina.filter((t) => t.carrito === c.id && t.destino);
    let ultima: { min: number; hora: string; destino: Ubicacion } | null = null;

    for (let i = DIAS_ATRAS; i >= 0; i--) {
      const fecha = sumarDias(ahora.fecha, -i);
      if (esEspecial.has(fecha)) continue;
      const dia = diaSemana(fecha);
      for (const t of tareas) {
        if (t.dia_semana !== dia) continue;
        if (t.dia_semana === 7 && esEspecial.has(sumarDias(fecha, 1))) continue;
        const min = aMinutos(fecha, t.hora);
        if (min <= limite && (!ultima || min >= ultima.min)) {
          ultima = { min, hora: t.hora, destino: t.destino! };
        }
      }
    }

    if (ultima && ultima.destino !== c.ubicacion_actual) {
      alertas.push({ carrito: c, esperado: ultima.destino, desde: ultima.hora });
    }
  }
  return alertas;
}
