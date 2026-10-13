"use client";

import { useState } from "react";
import AlertasCarros from "./AlertasCarros";
import CarritoBadges from "./CarritoBadges";
import DiaSelector from "./DiaSelector";
import TareaCard from "./TareaCard";
import type { AlertaCarro } from "@/lib/carros";
import { etiquetaLarga, sumarDias } from "@/lib/dates";
import type { RolConfig } from "@/lib/roles";
import type { Carrito, DiaEspecial, TareaDia, Ubicacion } from "@/lib/types";

/**
 * Vista para abuelos y Lucía: una tarjeta grande con "lo siguiente", un solo botón,
 * un resumen de mañana y nada más. El selector de semana queda escondido.
 */
export default function VistaSencilla({
  rol,
  hoy,
  fecha,
  setFecha,
  error,
  cargando,
  especialDelDia,
  alertas,
  carritos,
  pendientes,
  completadas,
  manana,
  onMover,
  onHecho,
  onDeshacer,
  onSalir,
}: {
  rol: RolConfig;
  hoy: string;
  fecha: string;
  setFecha: (f: string) => void;
  error: string | null;
  cargando: boolean;
  especialDelDia?: DiaEspecial;
  alertas: AlertaCarro[];
  carritos: Carrito[];
  pendientes: TareaDia[];
  completadas: TareaDia[];
  manana: TareaDia[];
  onMover: (id: string, u: Ubicacion) => void;
  onHecho: (t: TareaDia) => void;
  onDeshacer: (t: TareaDia) => void;
  onSalir: () => void;
}) {
  const [verSemana, setVerSemana] = useState(false);
  const [verHechas, setVerHechas] = useState(false);

  const esHoy = fecha === hoy;
  const esManana = fecha === sumarDias(hoy, 1);
  const principal = pendientes.find((t) => t.tipo !== "horario");
  const despues = pendientes.filter((t) => t !== principal);
  const hayAlgo = pendientes.length + completadas.length > 0;
  const resumenManana = manana.slice(0, 3);

  const card = (t: TareaDia, hecha: boolean) => (
    <TareaCard
      key={t.key}
      t={t}
      grande
      hecha={hecha}
      onHecho={() => onHecho(t)}
      onDeshacer={() => onDeshacer(t)}
    />
  );

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/95 px-4 pb-3 pt-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {rol.emoji} Hola, {rol.saludo}
          </h1>
          <button onClick={onSalir} className="rounded-full px-3 py-1 text-sm text-stone-500 ring-1 ring-stone-300">
            Salir
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { txt: "Hoy", f: hoy, on: esHoy },
            { txt: "Mañana", f: sumarDias(hoy, 1), on: esManana },
          ].map(({ txt, f, on }) => (
            <button
              key={txt}
              onClick={() => setFecha(f)}
              aria-pressed={on}
              className={`h-14 rounded-2xl text-xl font-bold ${
                on ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-300"
              }`}
            >
              {txt}
            </button>
          ))}
        </div>
      </header>

      <main className="mt-3 grid gap-4">
        <p className="px-4 text-lg font-semibold capitalize text-stone-700">{etiquetaLarga(fecha)}</p>

        {error && (
          <p className="mx-4 rounded-xl bg-red-50 p-3 text-red-700" role="alert">
            Error: {error}
          </p>
        )}

        {especialDelDia && (
          <div className="mx-4 rounded-2xl bg-amber-100 p-4 ring-2 ring-amber-300">
            <p className="text-xl font-bold text-amber-900">🎉 {especialDelDia.titulo}</p>
            <p className="text-lg text-amber-900">{especialDelDia.nota ?? "No hay rutina de cole."}</p>
          </div>
        )}

        <AlertasCarros alertas={alertas} grande onMover={onMover} />

        <div className="grid gap-3 px-4">
          {cargando ? (
            <p className="p-6 text-center text-stone-500">Cargando…</p>
          ) : !hayAlgo ? (
            <p className="rounded-2xl bg-white p-6 text-center text-xl text-stone-500 ring-1 ring-stone-200">
              {esHoy ? "Hoy no tenéis nada" : "Este día no tenéis nada"} 🎉
            </p>
          ) : (
            <>
              {principal ? (
                <>
                  <p className="text-sm font-bold uppercase tracking-wide text-stone-500">
                    👉 {esHoy ? "Lo siguiente" : "Primero"}
                  </p>
                  <ul className="grid gap-3">{card(principal, false)}</ul>
                </>
              ) : (
                <p className="rounded-2xl bg-verde-light p-4 text-xl font-semibold text-verde-dark">
                  ✅ Todo hecho por ahora
                </p>
              )}

              {despues.length > 0 && (
                <>
                  <p className="mt-2 text-sm font-bold uppercase tracking-wide text-stone-500">Después</p>
                  <ul className="grid gap-3">{despues.map((t) => card(t, false))}</ul>
                </>
              )}

              {completadas.length > 0 && (
                <>
                  <button
                    onClick={() => setVerHechas((v) => !v)}
                    className="mt-2 h-11 rounded-xl text-left text-base font-semibold text-stone-500"
                  >
                    ✅ Hechas ({completadas.length}) {verHechas ? "▴" : "▾"}
                  </button>
                  {verHechas && <ul className="grid gap-3">{completadas.map((t) => card(t, true))}</ul>}
                </>
              )}
            </>
          )}
        </div>

        {esHoy && !cargando && (
          <section className="mx-4 rounded-2xl bg-white p-4 ring-1 ring-stone-200" aria-label="Mañana">
            <p className="mb-2 text-lg font-bold">Mañana te toca</p>
            {resumenManana.length === 0 ? (
              <p className="text-lg text-stone-500">Nada 🎉</p>
            ) : (
              <>
                <ul className="grid gap-1 text-lg">
                  {resumenManana.map((t) => (
                    <li key={t.key}>
                      <span className="font-bold">{t.hora}</span> · {t.titulo}
                    </li>
                  ))}
                </ul>
                {manana.length > 3 && (
                  <button onClick={() => setFecha(sumarDias(hoy, 1))} className="mt-2 h-11 text-base font-semibold text-stone-600 underline">
                    Ver todo mañana (+{manana.length - 3})
                  </button>
                )}
              </>
            )}
          </section>
        )}

        <CarritoBadges carritos={carritos} grande onMover={onMover} editable={false} />

        <div className="px-4">
          <button
            onClick={() => setVerSemana((v) => !v)}
            className="h-11 text-base font-semibold text-stone-500 underline"
          >
            {verSemana ? "Ocultar semana" : "Ver otro día"}
          </button>
          {verSemana && (
            <DiaSelector
              fecha={fecha}
              hoy={hoy}
              onChange={setFecha}
              onSemana={(d) => setFecha(sumarDias(fecha, d))}
            />
          )}
        </div>
      </main>
    </div>
  );
}
