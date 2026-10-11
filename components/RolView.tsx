"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AlertasCarros from "./AlertasCarros";
import CarritoBadges from "./CarritoBadges";
import DiaSelector from "./DiaSelector";
import ExcepcionSheet from "./ExcepcionSheet";
import TareaCard from "./TareaCard";
import { ahora as ahoraFn, etiquetaLarga, hoy as hoyFn, semanaDe, sumarDias } from "@/lib/dates";
import { alertasCarros } from "@/lib/carros";
import {
  borrarExcepcion,
  cargarCarritos,
  cargarExcepciones,
  cargarRutina,
  guardarExcepcion,
  moverCarrito,
  resolverDia,
} from "@/lib/queries";
import { rolDeSesion } from "@/lib/auth";
import type { RolConfig } from "@/lib/roles";
import { getSupabase } from "@/lib/supabase";
import type { Carrito, Excepcion, TareaRutina, Ubicacion } from "@/lib/types";

export default function RolView({ rol }: { rol: RolConfig }) {
  const sb = getSupabase();
  const router = useRouter();
  const [autenticado, setAutenticado] = useState(false);
  const hoy = useMemo(hoyFn, []);
  const [fecha, setFecha] = useState(hoy);
  const [rutina, setRutina] = useState<TareaRutina[]>([]);
  const [carritos, setCarritos] = useState<Carrito[]>([]);
  const [excepciones, setExcepciones] = useState<Excepcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [ahora, setAhora] = useState(ahoraFn);

  // Reevalúa las alertas cada minuto
  useEffect(() => {
    const t = setInterval(() => setAhora(ahoraFn()), 60_000);
    return () => clearInterval(t);
  }, []);

  const semana = semanaDe(fecha);
  const desde = semana[0];
  const hasta = semana[6];

  const recargarCarritos = useCallback(async () => {
    if (sb) setCarritos(await cargarCarritos(sb));
  }, [sb]);

  const recargarExcepciones = useCallback(async () => {
    if (sb) setExcepciones(await cargarExcepciones(sb, desde, hasta));
  }, [sb, desde, hasta]);

  // Sesión: sin login -> /login; un rol que no es "padres" solo ve su vista
  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      const mio = rolDeSesion(data.session);
      if (!mio) return router.replace("/login");
      if (mio !== "padres" && mio !== rol.slug) return router.replace(`/${mio}`);
      setAutenticado(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      if (!s) router.replace("/login");
    });
    return () => sub.subscription.unsubscribe();
  }, [sb, rol.slug, router]);

  // Rutina + carritos: una vez
  useEffect(() => {
    if (!sb || !autenticado) return;
    Promise.all([cargarRutina(sb), cargarCarritos(sb)])
      .then(([r, c]) => {
        setRutina(r);
        setCarritos(c);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [sb, autenticado]);

  // Excepciones: al cambiar de semana
  useEffect(() => {
    if (!autenticado) return;
    recargarExcepciones().catch((e) => setError(e.message));
  }, [autenticado, recargarExcepciones]);

  // Tiempo real
  useEffect(() => {
    if (!sb || !autenticado) return;
    const canal = sb
      .channel(`familia-${rol.slug}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "carritos" }, () =>
        recargarCarritos().catch((e) => setError(e.message)),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "excepciones" }, () =>
        recargarExcepciones().catch((e) => setError(e.message)),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "tareas_rutina" }, () =>
        cargarRutina(sb).then(setRutina).catch((e) => setError(e.message)),
      )
      .subscribe();
    return () => {
      sb.removeChannel(canal);
    };
  }, [sb, autenticado, rol.slug, recargarCarritos, recargarExcepciones]);

  const tareasDia = useMemo(() => resolverDia(fecha, rutina, excepciones), [fecha, rutina, excepciones]);
  const visibles = useMemo(
    () =>
      rol.admin
        ? tareasDia
        : tareasDia.filter((t) => t.responsables.some((p) => rol.personas.includes(p))),
    [tareasDia, rol],
  );
  const carritosRol = carritos.filter((c) => rol.carritos.includes(c.id));
  const alertas = useMemo(() => alertasCarros(rutina, carritosRol, ahora), [rutina, carritosRol, ahora]);

  async function onMover(id: string, ubicacion: Ubicacion) {
    if (!sb) return;
    const previo = carritos;
    setCarritos((cs) => cs.map((c) => (c.id === id ? { ...c, ubicacion_actual: ubicacion } : c)));
    try {
      await moverCarrito(sb, id, ubicacion, rol.titulo);
    } catch (e) {
      setCarritos(previo);
      setError((e as Error).message);
    }
  }

  if (!sb) return <SetupAviso />;
  if (!autenticado) return <p className="p-6 text-stone-500">Cargando…</p>;

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 pt-3">
          <h1 className={`font-bold ${rol.grande ? "text-2xl" : "text-xl"}`}>
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
                  fecha === f ? "bg-stone-900 text-white" : "text-stone-700 ring-1 ring-stone-300"
                }`}
              >
                {txt}
              </button>
            ))}
            <button
              onClick={() => sb.auth.signOut()}
              className="rounded-full px-3 py-1 text-sm text-stone-500 ring-1 ring-stone-300"
            >
              Salir
            </button>
          </div>
        </div>
        <DiaSelector
          fecha={fecha}
          hoy={hoy}
          onChange={setFecha}
          onSemana={(d) => setFecha(sumarDias(fecha, d))}
        />
      </header>

      <main className="mt-3 grid gap-3">
        <p className={`px-4 font-semibold capitalize text-stone-700 ${rol.grande ? "text-lg" : ""}`}>
          {etiquetaLarga(fecha)}
        </p>

        {error && (
          <p className="mx-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
            Error: {error}
          </p>
        )}

        <AlertasCarros alertas={alertas} grande={rol.grande} onMover={onMover} />
        <CarritoBadges carritos={carritosRol} grande={rol.grande} onMover={onMover} />

        <ul className="grid gap-3 px-4">
          {cargando ? (
            <li className="p-6 text-center text-stone-500">Cargando…</li>
          ) : visibles.length === 0 ? (
            <li className={`rounded-2xl bg-white p-6 text-center text-stone-500 ring-1 ring-stone-200 ${rol.grande ? "text-xl" : ""}`}>
              Nada que hacer este día 🎉
            </li>
          ) : (
            visibles.map((t) => <TareaCard key={t.id} t={t} grande={rol.grande} />)
          )}
        </ul>
      </main>

      {rol.admin && (
        <button
          onClick={() => setSheet(true)}
          className="fixed bottom-5 right-4 z-10 h-14 rounded-full bg-amber-400 px-5 font-semibold shadow-lg active:scale-95"
        >
          ¿Cambio de planes?
        </button>
      )}

      {sheet && (
        <ExcepcionSheet
          key={fecha}
          fecha={fecha}
          etiqueta={etiquetaLarga(fecha)}
          tareas={tareasDia}
          excepciones={excepciones}
          onCerrar={() => setSheet(false)}
          onGuardar={async (e) => {
            try {
              await guardarExcepcion(sb, e);
              await recargarExcepciones();
              setSheet(false);
            } catch (err) {
              setError((err as Error).message);
              setSheet(false);
            }
          }}
          onRestaurar={async (nino) => {
            try {
              await borrarExcepcion(sb, fecha, nino);
              await recargarExcepciones();
              setSheet(false);
            } catch (err) {
              setError((err as Error).message);
              setSheet(false);
            }
          }}
        />
      )}
    </div>
  );
}

function SetupAviso() {
  return (
    <main className="p-6">
      <h1 className="mb-2 text-xl font-bold">Falta conectar Supabase</h1>
      <p className="text-stone-600">
        Define <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (en{" "}
        <code>.env.local</code> o en Vercel) y ejecuta <code>supabase/schema.sql</code> en el SQL Editor.
      </p>
    </main>
  );
}
