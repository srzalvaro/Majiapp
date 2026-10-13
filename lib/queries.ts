import type { SupabaseClient } from "@supabase/supabase-js";
import { diaSemana } from "./dates";
import type {
  Carrito,
  DiaEspecial,
  Evento,
  Excepcion,
  Hecha,
  Nino,
  Persona,
  TareaDia,
  TareaRutina,
  Ubicacion,
} from "./types";

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function cargarRutina(sb: SupabaseClient): Promise<TareaRutina[]> {
  return check(
    await sb.from("tareas_rutina").select("*").order("dia_semana").order("hora").order("id"),
  );
}

export async function cargarCarritos(sb: SupabaseClient): Promise<Carrito[]> {
  return check(await sb.from("carritos").select("*").order("id"));
}

export async function cargarExcepciones(
  sb: SupabaseClient,
  desde: string,
  hasta: string,
): Promise<Excepcion[]> {
  return check(
    await sb.from("excepciones").select("*").gte("fecha", desde).lte("fecha", hasta),
  );
}

export async function moverCarrito(
  sb: SupabaseClient,
  id: string,
  ubicacion: Ubicacion,
  movidoPor: string,
) {
  check(
    await sb
      .from("carritos")
      .update({ ubicacion_actual: ubicacion, movido_por: movidoPor })
      .eq("id", id)
      .select("id"),
  );
}

export async function guardarExcepcion(
  sb: SupabaseClient,
  e: { fecha: string; nino: Nino; responsables: Persona[]; nota: string | null },
) {
  check(await sb.from("excepciones").upsert(e, { onConflict: "fecha,nino" }).select("id"));
}

export async function borrarExcepcion(sb: SupabaseClient, fecha: string, nino: Nino) {
  check(await sb.from("excepciones").delete().eq("fecha", fecha).eq("nino", nino).select("id"));
}

export async function cargarDiasEspeciales(
  sb: SupabaseClient,
  desde: string,
  hasta: string,
): Promise<DiaEspecial[]> {
  return check(await sb.from("dias_especiales").select("*").gte("fecha", desde).lte("fecha", hasta));
}

export async function guardarDiasEspeciales(
  sb: SupabaseClient,
  fechas: string[],
  titulo: string,
  nota: string | null,
) {
  check(
    await sb
      .from("dias_especiales")
      .upsert(
        fechas.map((fecha) => ({ fecha, titulo, nota })),
        { onConflict: "fecha" },
      )
      .select("id"),
  );
}

export async function borrarDiaEspecial(sb: SupabaseClient, fecha: string) {
  check(await sb.from("dias_especiales").delete().eq("fecha", fecha).select("id"));
}

export async function cargarEventos(sb: SupabaseClient, desde: string, hasta: string): Promise<Evento[]> {
  return check(await sb.from("eventos").select("*").gte("fecha", desde).lte("fecha", hasta));
}

export async function crearEvento(sb: SupabaseClient, e: Omit<Evento, "id">) {
  check(await sb.from("eventos").insert(e).select("id"));
}

export async function borrarEvento(sb: SupabaseClient, id: number) {
  check(await sb.from("eventos").delete().eq("id", id).select("id"));
}

export async function cargarHechas(sb: SupabaseClient, desde: string, hasta: string): Promise<Hecha[]> {
  return check(await sb.from("tareas_hechas").select("fecha,tarea_key").gte("fecha", desde).lte("fecha", hasta));
}

export async function marcarHecha(sb: SupabaseClient, fecha: string, tareaKey: string, por: string) {
  check(
    await sb
      .from("tareas_hechas")
      .upsert({ fecha, tarea_key: tareaKey, hecho_por: por }, { onConflict: "fecha,tarea_key" })
      .select("id"),
  );
}

export async function desmarcarHecha(sb: SupabaseClient, fecha: string, tareaKey: string) {
  check(await sb.from("tareas_hechas").delete().eq("fecha", fecha).eq("tarea_key", tareaKey).select("id"));
}

/**
 * Agenda de una fecha: rutina semanal con excepciones aplicadas + planes sueltos.
 * En un día especial (festivo / sin cole) la rutina semanal no se aplica.
 */
export function resolverDia(
  fecha: string,
  rutina: TareaRutina[],
  excepciones: Excepcion[],
  especiales: DiaEspecial[] = [],
  eventos: Evento[] = [],
): TareaDia[] {
  const dia = diaSemana(fecha);
  const especial = especiales.some((d) => d.fecha === fecha);

  const deRutina: TareaDia[] = especial
    ? []
    : rutina
        .filter((t) => t.dia_semana === dia)
        .map((t) => {
          const ex =
            t.tipo === "recogida" && t.nino
              ? excepciones.find((e) => e.fecha === fecha && e.nino === t.nino)
              : undefined;
          return ex
            ? { ...t, key: `r:${t.id}`, responsables: ex.responsables, modificada: true, nota: ex.nota }
            : { ...t, key: `r:${t.id}`, modificada: false, nota: null };
        });

  const deEventos: TareaDia[] = eventos
    .filter((e) => e.fecha === fecha)
    .map((e) => ({
      id: -e.id, // negativo: no choca con ids de rutina
      eventoId: e.id,
      key: `e:${e.id}`,
      dia_semana: dia,
      hora: e.hora,
      titulo: e.titulo,
      detalle: e.detalle,
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
