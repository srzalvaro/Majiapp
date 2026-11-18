"use client";

import { useEffect, useState } from "react";
import CompartirSheet from "./CompartirSheet";
import DiaSelector from "./DiaSelector";
import TareaCard from "./TareaCard";
import VistaSencilla from "./VistaSencilla";
import { agendaDe, ausenciasDe, especialDe } from "@/lib/agenda";
import { mensajeAgenda } from "@/lib/compartir";
import { aMinutos, ahora as ahoraFn, etiquetaLarga, sumarDias } from "@/lib/dates";
import { ROLES, type RolConfig } from "@/lib/roles";
import type { TareaDia } from "@/lib/types";

/** Una tarea de hoy se considera pasada cuando su hora ya quedó 30 minutos atrás. */
const MARGEN_MIN = 30;

export default function RolView({ rol }: { rol: RolConfig }) {
  const [ahora, setAhora] = useState<{ fecha: string; hora: string } | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [compartir, setCompartir] = useState(false);

  // La fecha y hora salen del móvil: se leen al montar y se refrescan cada minuto
  useEffect(() => {
    const a = ahoraFn();
    setAhora(a);
    setFecha(rol.grande && a.hora >= "19:00" ? sumarDias(a.fecha, 1) : a.fecha);
    const t = setInterval(() => setAhora(ahoraFn()), 60_000);
    return () => clearInterval(t);
  }, [rol.grande]);

  if (!ahora || !fecha) return <p className="p-6 text-stone-500">Cargando…</p>;

  const hoy = ahora.fecha;
  const esHoy = fecha === hoy;
  const pasada = (t: TareaDia) => esHoy && aMinutos(t.hora) + MARGEN_MIN < aMinutos(ahora.hora);
  const delRol = (ts: TareaDia[]) =>
    rol.admin ? ts : ts.filter((t) => !t.omitida && t.responsables.some((p) => rol.personas.includes(p)));

  const tareasDia = delRol(agendaDe(fecha));
  const especialDelDia = especialDe(fecha);
  const ausenciasDia = ausenciasDe(fecha);

  if (rol.grande) {
    return (
      <VistaSencilla
        rol={rol}
        hoy={hoy}
        fecha={fecha}
        setFecha={setFecha}
        especialDelDia={especialDelDia}
        ausenciasDia={ausenciasDia}
        pendientes={tareasDia.filter((t) => !pasada(t))}
        pasadas={tareasDia.filter(pasada)}
        manana={delRol(agendaDe(sumarDias(hoy, 1)))}
      />
    );
  }

  /** Mensaje de WhatsApp para un rol (hoy lo que queda + mañana completo). */
  function construirMensaje(slug: string): string {
    const r = ROLES[slug];
    const manana = sumarDias(hoy, 1);
    const dia = (f: string, soloPendientes: boolean) => ({
      fecha: f,
      tareas: agendaDe(f).filter(
        (t) =>
          !t.omitida &&
          t.responsables.some((p) => r.personas.includes(p)) &&
          !(soloPendientes && aMinutos(t.hora) + MARGEN_MIN < aMinutos(ahora!.hora)),
      ),
      especial: especialDe(f),
      ausencias: ausenciasDe(f),
    });
    return mensajeAgenda({
      saludo: r.saludo,
      hoy: dia(hoy, true),
      manana: dia(manana, false),
      enlace: `${window.location.origin}/${r.slug}`,
    });
  }

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 rounded-b-[26px] bg-gradient-to-br from-ciruela via-ciruela-claro to-[#8a4a3e] text-[#fff3e6] shadow-md">
        <div className="flex items-center justify-between px-4 pt-3">
          <h1 className="font-titulo text-xl font-extrabold">
            {rol.emoji} Hola, {rol.saludo}
          </h1>
          <div className="flex items-center gap-2">
            {[
              { txt: "Hoy", f: hoy },
              { txt: "Mañana", f: sumarDias(hoy, 1) },
            ].map(({ txt, f }) => (
              <button
                key={txt}
                onClick={() => setFecha(f)}
                className={`rounded-full px-3 py-1 text-sm ${
                  fecha === f ? "bg-calabaza font-bold text-white" : "text-white ring-1 ring-white/40"
                }`}
              >
                {txt}
              </button>
            ))}
          </div>
        </div>
        <DiaSelector
          fecha={fecha}
          hoy={hoy}
          onChange={setFecha}
          onSemana={(d) => setFecha(sumarDias(fecha, d))}
          oscuro
        />
      </header>

      <main className="mt-3 grid gap-3">
        <div className="px-4">
          <button
            onClick={() => setCompartir(true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] font-semibold text-stone-900 active:scale-95"
          >
            📲 Compartir agenda
          </button>
        </div>
        <p className="px-4 font-titulo text-lg font-bold text-ciruela-claro first-letter:uppercase">
          {etiquetaLarga(fecha)}
        </p>

        {especialDelDia && (
          <div className="mx-4 rounded-2xl bg-amber-100 p-4 ring-2 ring-amber-300">
            <p className="text-base font-bold text-amber-900">🎉 {especialDelDia.titulo}</p>
            <p className="text-sm text-amber-900">{especialDelDia.nota ?? "Hoy no hay rutina de cole."}</p>
          </div>
        )}

        {ausenciasDia.map((a) => (
          <div key={a.nino} className="mx-4 rounded-2xl bg-sky-50 p-3 ring-2 ring-sky-200">
            <p className="font-semibold text-sky-900">
              🤒 {a.nino === "mateo" ? "Mateo" : "Jimena"} no va este día{a.nota ? ` · ${a.nota}` : ""}
            </p>
          </div>
        ))}

        <ul className="grid gap-3 px-4">
          {tareasDia.length === 0 ? (
            <li className="rounded-2xl bg-white p-6 text-center text-stone-500 ring-1 ring-stone-200">
              {especialDelDia ? "Sin planes este día" : "Nada que hacer este día"} 🎉
            </li>
          ) : (
            tareasDia.map((t) => <TareaCard key={t.key} t={t} pasada={pasada(t)} />)
          )}
        </ul>
      </main>

      {compartir && (
        <CompartirSheet
          destinatarios={[{ slug: "abuelos", titulo: "Abuelos" }]}
          construir={construirMensaje}
          onCerrar={() => setCompartir(false)}
        />
      )}
    </div>
  );
}
