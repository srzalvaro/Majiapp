"use client";

import { useState } from "react";
import AlertasCarros from "./AlertasCarros";
import CarritoBadges from "./CarritoBadges";
import DiaSelector from "./DiaSelector";
import { IconoTarea } from "./TareaCard";
import type { AlertaCarro } from "@/lib/carros";
import { etiquetaLarga, sumarDias } from "@/lib/dates";
import { PERSONAS, type RolConfig } from "@/lib/roles";
import type { Ausencia, Carrito, DiaEspecial, TareaDia, Ubicacion } from "@/lib/types";

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
  ausenciasDia,
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
  ausenciasDia: Ausencia[];
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

  const textoHecho = (t: TareaDia) =>
    `✓ Hecho${t.carrito && t.destino ? ` · ${t.carrito_extra ? "carros" : "carro"} en ${t.destino.replace("Casa ", "")}` : ""}`;
  const cambio = (t: TareaDia) =>
    t.modificada
      ? `⚠️ Cambio de planes${t.horaRutina ? ` · ahora a las ${t.hora} (antes ${t.horaRutina})` : ""}${t.nota ? ` · ${t.nota}` : ""}`
      : null;
  const quien = (t: TareaDia) => t.responsables.map((p) => PERSONAS[p]).join(" + ");

  const ficha = (t: TareaDia, hecha: boolean) => (
    <li key={t.key} className={`rounded-2xl bg-white p-3 shadow-sm ring-1 ring-orange-100 ${hecha ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-[64px] rounded-xl bg-mostaza px-2 py-2 text-center font-titulo text-lg font-extrabold text-mostaza-oscuro">
          {t.hora}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`flex items-center gap-2 text-lg font-bold leading-tight ${hecha ? "line-through" : ""}`}>
            <span className="shrink-0 text-xl"><IconoTarea t={t} className="h-7 w-7" /></span>
            <span>{t.titulo}</span>
          </p>
          {t.detalle && <p className="mt-1 text-base text-stone-600">{t.detalle}</p>}
          <p className="mt-1 text-sm font-semibold text-ciruela-claro">{quien(t)}</p>
          {cambio(t) && <p className="mt-1 text-base font-semibold text-amber-700">{cambio(t)}</p>}
          {t.tipo !== "horario" &&
            (hecha ? (
              <div className="mt-2 flex items-center gap-3">
                <span className="font-semibold text-verde-dark">✅ Hecho</span>
                <button onClick={() => onDeshacer(t)} className="h-9 rounded-lg px-3 text-sm text-stone-500 ring-1 ring-stone-300">
                  Deshacer
                </button>
              </div>
            ) : (
              <button
                onClick={() => onHecho(t)}
                className="mt-2 h-11 rounded-xl bg-mostaza px-4 text-base font-bold text-mostaza-oscuro active:scale-95"
              >
                {textoHecho(t)}
              </button>
            ))}
        </div>
      </div>
    </li>
  );

  return (
    <div className="min-h-dvh bg-crema pb-10 font-cuerpo">
      <header className="rounded-b-[30px] bg-gradient-to-br from-ciruela via-ciruela-claro to-[#8a4a3e] px-5 pb-6 pt-4 text-[#fff3e6]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-extrabold uppercase tracking-widest opacity-80">
            {rol.emoji} Hola, {rol.saludo}
          </p>
          <button onClick={onSalir} className="rounded-full px-3 py-1 text-sm text-[#fff3e6]/80 ring-1 ring-white/40">
            Salir
          </button>
        </div>
        <h1 className="mt-2 font-titulo text-3xl font-extrabold leading-tight first-letter:uppercase">{etiquetaLarga(fecha)}</h1>
      </header>

      <main className="mt-4 grid gap-4">
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

        {ausenciasDia.map((a) => (
          <div key={a.nino} className="mx-4 rounded-2xl bg-sky-50 p-4 ring-2 ring-sky-200">
            <p className="text-xl font-bold text-sky-900">
              🤒 {a.nino === "mateo" ? "Mateo" : "Jimena"} no va este día
            </p>
            {a.nota && <p className="text-lg text-sky-900">{a.nota}</p>}
          </div>
        ))}

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
                <section className="rounded-3xl bg-gradient-to-br from-calabaza-claro to-calabaza p-4 text-white shadow-lg shadow-orange-300/50">
                  <p className="text-xs font-extrabold uppercase tracking-widest opacity-90">
                    👉 {esHoy ? "Lo siguiente" : "Primero"}
                  </p>
                  <div className="mt-1 flex items-center gap-3">
                    <p className="font-titulo text-5xl font-extrabold leading-none">{principal.hora}</p>
                    <span className="rounded-2xl bg-white/90 p-1.5">
                      <IconoTarea t={principal} className="h-9 w-9" />
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-extrabold leading-tight">{principal.titulo}</p>
                  {principal.detalle && <p className="mt-1 text-lg opacity-95">{principal.detalle}</p>}
                  <span className="mt-3 inline-block rounded-full bg-white/25 px-3 py-1 text-base font-bold">
                    {quien(principal)}
                  </span>
                  {cambio(principal) && <p className="mt-2 text-base font-bold">{cambio(principal)}</p>}
                  {principal.tipo !== "horario" && (
                    <button
                      onClick={() => onHecho(principal)}
                      className="mt-3 h-14 w-full rounded-2xl bg-[#fff3e6] text-xl font-extrabold text-[#a8431c] active:scale-95"
                    >
                      {textoHecho(principal)}
                    </button>
                  )}
                </section>
              ) : (
                <p className="rounded-2xl bg-verde-light p-4 text-xl font-semibold text-verde-dark">
                  ✅ Todo hecho por ahora
                </p>
              )}

              {despues.length > 0 && (
                <>
                  <p className="mt-2 font-titulo text-lg font-bold text-ciruela-claro">Después</p>
                  <ul className="grid gap-3">{despues.map((t) => ficha(t, false))}</ul>
                </>
              )}

              {completadas.length > 0 && (
                <>
                  <button
                    onClick={() => setVerHechas((v) => !v)}
                    className="flex h-12 items-center justify-between rounded-2xl bg-[#efdcc8] px-4 text-left text-base font-bold text-[#7a5a4a]"
                  >
                    ✅ Hechas ({completadas.length}) {verHechas ? "▴" : "▾"}
                  </button>
                  {verHechas && <ul className="grid gap-3">{completadas.map((t) => ficha(t, true))}</ul>}
                </>
              )}
            </>
          )}
        </div>

        {esHoy && !cargando && (
          <section className="mx-4 rounded-3xl bg-ciruela p-4 text-[#ffe9d2]" aria-label="Mañana">
            <p className="mb-2 font-titulo text-lg font-bold">Mañana te toca</p>
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
                  <button onClick={() => setFecha(sumarDias(hoy, 1))} className="mt-2 h-11 text-base font-semibold text-[#ffe9d2] underline">
                    Ver todo mañana (+{manana.length - 3})
                  </button>
                )}
              </>
            )}
          </section>
        )}

        <div className="mx-4 grid grid-cols-2 gap-3">
          {[
            { txt: "Hoy", f: hoy, on: esHoy },
            { txt: "Mañana", f: sumarDias(hoy, 1), on: esManana },
          ].map(({ txt, f, on }) => (
            <button
              key={txt}
              onClick={() => setFecha(f)}
              aria-pressed={on}
              className={`h-14 rounded-2xl text-xl font-extrabold ${
                on ? "bg-calabaza text-white" : "bg-mostaza text-mostaza-oscuro"
              }`}
            >
              {txt}
            </button>
          ))}
        </div>

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
