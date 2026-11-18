import { diaSemana } from "./dates";
import { AUSENCIAS, DIAS_ESPECIALES, EVENTOS, EXCEPCIONES, OMITIDAS } from "./cambios";
import { RUTINA } from "./rutina";
import type { Ausencia, DiaEspecial, TareaDia } from "./types";

/**
 * Agenda de una fecha: rutina semanal con los cambios aplicados + planes sueltos.
 * En un día especial (festivo / sin cole) la rutina semanal no se aplica.
 */
export function agendaDe(fecha: string): TareaDia[] {
  const dia = diaSemana(fecha);
  const especial = DIAS_ESPECIALES.some((d) => d.fecha === fecha);

  const deRutina: TareaDia[] = especial
    ? []
    : RUTINA.filter((t) => t.dia_semana === dia).map((t) => {
        const ex =
          (t.tipo === "recogida" || t.tipo === "llevar") && t.nino
            ? EXCEPCIONES.find((e) => e.fecha === fecha && e.nino === t.nino && e.tipo === t.tipo)
            : undefined;
        const base: TareaDia =
          ex && (ex.responsables || ex.hora)
            ? {
                ...t,
                key: `r:${t.id}`,
                hora: ex.hora ?? t.hora,
                horaRutina: ex.hora && ex.hora !== t.hora ? t.hora : undefined,
                responsables: ex.responsables ?? t.responsables,
                modificada: true,
                nota: ex.nota ?? null,
              }
            : { ...t, key: `r:${t.id}`, modificada: false, nota: null };

        const omitida = OMITIDAS.some(
          (o) =>
            o.fecha === fecha &&
            (o.hora === undefined || o.hora === t.hora) &&
            (o.texto === undefined || t.titulo.toLowerCase().includes(o.texto.toLowerCase())),
        );
        const ausente = !!t.nino && AUSENCIAS.some((a) => a.fecha === fecha && a.nino === t.nino);
        return ausente ? { ...base, omitida: true, ausente: true } : omitida ? { ...base, omitida: true } : base;
      });

  const deEventos: TareaDia[] = EVENTOS.map((e, i) => ({ e, i }))
    .filter(({ e }) => e.fecha === fecha)
    .map(({ e, i }) => ({
      id: -(i + 1), // negativo: no choca con ids de rutina
      key: `e:${i}`,
      esPlan: true,
      dia_semana: dia,
      hora: e.hora,
      titulo: e.titulo,
      detalle: e.detalle ?? null,
      tipo: "otro" as const,
      nino: null,
      responsables: e.responsables,
      carrito: null,
      destino: null,
      modificada: false,
      nota: null,
    }));

  return [...deRutina, ...deEventos].sort((a, b) => a.hora.localeCompare(b.hora));
}

export function especialDe(fecha: string): DiaEspecial | undefined {
  return DIAS_ESPECIALES.find((d) => d.fecha === fecha);
}

export function ausenciasDe(fecha: string): Ausencia[] {
  return AUSENCIAS.filter((a) => a.fecha === fecha);
}
