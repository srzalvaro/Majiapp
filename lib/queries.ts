import type { SupabaseClient } from "@supabase/supabase-js";
import { diaSemana } from "./dates";
import type {
  Carrito,
  Excepcion,
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

/** Rutina del día de la semana + excepciones de esa fecha aplicadas. */
export function resolverDia(
  fecha: string,
  rutina: TareaRutina[],
  excepciones: Excepcion[],
): TareaDia[] {
  const dia = diaSemana(fecha);
  return rutina
    .filter((t) => t.dia_semana === dia)
    .map((t) => {
      const ex =
        t.tipo === "recogida" && t.nino
          ? excepciones.find((e) => e.fecha === fecha && e.nino === t.nino)
          : undefined;
      return ex
        ? { ...t, responsables: ex.responsables, modificada: true, nota: ex.nota }
        : { ...t, modificada: false, nota: null };
    })
    .sort((a, b) => a.hora.localeCompare(b.hora));
}
