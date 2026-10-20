"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AlertasCarros from "./AlertasCarros";
import CarritoBadges from "./CarritoBadges";
import DiaSelector from "./DiaSelector";
import AusenciaSheet from "./AusenciaSheet";
import EventoSheet from "./EventoSheet";
import ExcepcionSheet from "./ExcepcionSheet";
import FestivoSheet from "./FestivoSheet";
import HoraSalidaSheet from "./HoraSalidaSheet";
import Sheet from "./Sheet";
import TareaCard from "./TareaCard";
import VistaSencilla from "./VistaSencilla";
import { ahora as ahoraFn, diaSemana, etiquetaLarga, hoy as hoyFn, semanaDe, sumarDias } from "@/lib/dates";
import { alertasCarros, type AlertaCarro } from "@/lib/carros";
import {
  borrarAusencia,
  borrarDiaEspecial,
  borrarEvento,
  borrarExcepcion,
  cargarAusencias,
  cargarCarritos,
  cargarDiasEspeciales,
  cargarEventos,
  cargarExcepciones,
  cargarRutina,
  cargarHechas,
  cargarOmitidas,
  crearEvento,
  desmarcarHecha,
  guardarAusencias,
  guardarDiasEspeciales,
  guardarExcepcion,
  guardarHorasSalida,
  marcarHecha,
  moverCarrito,
  omitirTarea,
  omitirTareas,
  quitarHoraSalida,
  restaurarTarea,
  resolverDia,
} from "@/lib/queries";
import { rolDeSesion } from "@/lib/auth";
import type { RolConfig } from "@/lib/roles";
import { getSupabase } from "@/lib/supabase";
import type { Carrito, DiaEspecial, Evento, Ausencia, Excepcion, Hecha, Omitida, TareaDia, TareaRutina, Ubicacion } from "@/lib/types";

export default function RolView({ rol }: { rol: RolConfig }) {
  const sb = getSupabase();
  const router = useRouter();
  const [autenticado, setAutenticado] = useState(false);
  const hoy = useMemo(hoyFn, []);
  const [fecha, setFecha] = useState(() =>
    rol.grande && ahoraFn().hora >= "20:00" ? sumarDias(hoyFn(), 1) : hoyFn(),
  );
  const [rutina, setRutina] = useState<TareaRutina[]>([]);
  const [carritos, setCarritos] = useState<Carrito[]>([]);
  const [excepciones, setExcepciones] = useState<Excepcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [especiales, setEspeciales] = useState<DiaEspecial[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [hechas, setHechas] = useState<Hecha[]>([]);
  const [omitidas, setOmitidas] = useState<Omitida[]>([]);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [sheet, setSheet] = useState<null | "menu" | "excepcion" | "evento" | "festivo" | "ausencia" | "hora">(null);
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
    if (sb) setExcepciones(await cargarExcepciones(sb, desde, [hasta, sumarDias(hoy, 1)].sort()[1]));
  }, [sb, desde, hasta, hoy]);

  // Festivos y planes: semana visible + semana actual (para silenciar alertas en festivo)
  const atras = sumarDias(hoy, -7); // las alertas de carros miran 7 días atrás
  const adelante = sumarDias(hoy, 1); // y el día siguiente (el domingo prepara el lunes)
  const planDesde = [desde, atras].sort()[0];
  const planHasta = [hasta, adelante].sort()[1];
  const recargarPlanes = useCallback(async () => {
    if (!sb) return;
    const [d, e, h, o, au] = await Promise.all([
      cargarDiasEspeciales(sb, planDesde, planHasta),
      cargarEventos(sb, planDesde, planHasta),
      cargarHechas(sb, planDesde, planHasta),
      cargarOmitidas(sb, planDesde, planHasta),
      cargarAusencias(sb, planDesde, planHasta),
    ]);
    setEspeciales(d);
    setEventos(e);
    setHechas(h);
    setOmitidas(o);
    setAusencias(au);
  }, [sb, planDesde, planHasta]);

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

  useEffect(() => {
    if (!autenticado) return;
    recargarPlanes().catch((e) => setError(e.message));
  }, [autenticado, recargarPlanes]);

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
      .on("postgres_changes", { event: "*", schema: "public", table: "dias_especiales" }, () =>
        recargarPlanes().catch((e) => setError(e.message)),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "eventos" }, () =>
        recargarPlanes().catch((e) => setError(e.message)),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "tareas_hechas" }, () =>
        recargarPlanes().catch((e) => setError(e.message)),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "tareas_omitidas" }, () =>
        recargarPlanes().catch((e) => setError(e.message)),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "ausencias" }, () =>
        recargarPlanes().catch((e) => setError(e.message)),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "tareas_rutina" }, () =>
        cargarRutina(sb).then(setRutina).catch((e) => setError(e.message)),
      )
      .subscribe();
    return () => {
      sb.removeChannel(canal);
    };
  }, [sb, autenticado, rol.slug, recargarCarritos, recargarExcepciones, recargarPlanes]);

  const tareasDia = useMemo(
    () => resolverDia(fecha, rutina, excepciones, especiales, eventos, omitidas, ausencias),
    [fecha, rutina, excepciones, especiales, eventos, omitidas, ausencias],
  );
  const especialDelDia = especiales.find((d) => d.fecha === fecha);
  const ausenciasDia = ausencias.filter((a) => a.fecha === fecha);
  const hechasDia = useMemo(
    () => new Set(hechas.filter((h) => h.fecha === fecha).map((h) => h.tarea_key)),
    [hechas, fecha],
  );
  const delRol = useCallback(
    (ts: TareaDia[]) =>
      rol.admin
        ? ts
        : ts.filter((t) => !t.omitida && t.responsables.some((p) => rol.personas.includes(p))),
    [rol],
  );
  const esHecha = useCallback((t: TareaDia) => t.tipo !== "horario" && hechasDia.has(t.key), [hechasDia]);
  // pendientes primero (por hora), hechas al final; las de solo información no cuentan
  const visibles = useMemo(() => {
    const mias = delRol(tareasDia);
    const activas = mias.filter((t) => !t.omitida);
    // las omitidas (solo las ven los padres) van al final
    return [...activas.filter((t) => !esHecha(t)), ...activas.filter(esHecha), ...mias.filter((t) => t.omitida)];
  }, [tareasDia, delRol, esHecha]);
  const tareasManana = useMemo(
    () => delRol(resolverDia(sumarDias(hoy, 1), rutina, excepciones, especiales, eventos, omitidas, ausencias)),
    [delRol, hoy, rutina, excepciones, especiales, eventos, omitidas, ausencias],
  );
  const carritosRol = carritos.filter((c) => rol.carritos.includes(c.id));
  // Alertas con fechas reales: los festivos no cuentan (ver lib/carros.ts)
  const alertas = useMemo(
    () => alertasCarros(
        rutina,
        carritosRol,
        ahora,
        especiales.map((d) => d.fecha),
        new Set(omitidas.map((o) => `${o.fecha}|${o.tarea_key}`)),
      ),
    [rutina, carritosRol, ahora, especiales, omitidas],
  );

  async function onHecho(t: TareaDia) {
    if (!sb) return;
    try {
      await marcarHecha(sb, fecha, t.key, rol.titulo);
      await recargarPlanes();
      // Tarea de carro de hoy: además deja el carro en su destino
      if (fecha === hoy && t.carrito && t.destino) await onMover(t.carrito, t.destino);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function onOmitir(fechaTarea: string, key: string) {
    if (!sb) return;
    try {
      await omitirTarea(sb, fechaTarea, key);
      await recargarPlanes();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function onRestaurar(t: TareaDia) {
    if (!sb) return;
    try {
      await restaurarTarea(sb, fecha, t.key);
      await recargarPlanes();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function guardarAusencia(a: {
    fechas: string[];
    nino: "jimena" | "mateo";
    nota: string | null;
    carros: ("beige" | "verde")[];
  }) {
    await accion(async () => {
      if (!sb) return;
      await guardarAusencias(sb, a.fechas, a.nino, a.nota);
      // Traslados de los carros elegidos: no hacen falta esos días
      const filas = a.fechas.flatMap((f) =>
        rutina
          .filter((t) => t.dia_semana === diaSemana(f) && t.tipo === "carrito" && t.carrito && a.carros.includes(t.carrito))
          .map((t) => ({ fecha: f, tarea_key: `r:${t.id}` })),
      );
      await omitirTareas(sb, filas);
    });
  }

  async function onNoAplica(a: AlertaCarro) {
    await onOmitir(a.fecha, a.tareaKey);
  }

  async function onDeshacer(t: TareaDia) {
    if (!sb) return;
    try {
      await desmarcarHecha(sb, fecha, t.key);
      await recargarPlanes();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  /** Ejecuta una escritura, refresca datos y cierra la hoja; los errores se muestran arriba. */
  async function accion(fn: () => Promise<unknown>) {
    try {
      await fn();
      await Promise.all([recargarExcepciones(), recargarPlanes()]);
    } catch (e) {
      setError((e as Error).message);
    }
    setSheet(null);
  }

  async function onMover(id: string, ubicacion: Ubicacion) {
    if (!sb) return;
    const previo = carritos;
    setCarritos((cs) => cs.map((c) => (c.id === id ? { ...c, ubicacion_actual: ubicacion } : c)));
    try {
      await moverCarrito(sb, id, ubicacion, rol.titulo);
      // Si hoy hay tareas de ese carro cuyo destino es esta ubicación, quedan hechas
      const ya = new Set(hechas.filter((h) => h.fecha === hoy).map((h) => h.tarea_key));
      const pendientes = resolverDia(hoy, rutina, [], especiales, eventos, omitidas, ausencias).filter(
        (t) => !t.omitida && t.carrito === id && t.destino === ubicacion && !ya.has(t.key),
      );
      if (pendientes.length) {
        await Promise.all(pendientes.map((t) => marcarHecha(sb, hoy, t.key, rol.titulo)));
        await recargarPlanes();
      }
    } catch (e) {
      setCarritos(previo);
      setError((e as Error).message);
    }
  }

  if (!sb) return <SetupAviso />;
  if (!autenticado) return <p className="p-6 text-stone-500">Cargando…</p>;

  if (rol.grande) {
    return (
      <VistaSencilla
        rol={rol}
        hoy={hoy}
        fecha={fecha}
        setFecha={setFecha}
        error={error}
        cargando={cargando}
        especialDelDia={especialDelDia}
        ausenciasDia={ausenciasDia}
        alertas={alertas}
        carritos={carritosRol}
        pendientes={visibles.filter((t) => !esHecha(t))}
        completadas={visibles.filter(esHecha)}
        manana={tareasManana}
        onMover={onMover}
        onHecho={onHecho}
        onDeshacer={onDeshacer}
        onSalir={() => sb.auth.signOut()}
      />
    );
  }

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

        {especialDelDia && (
          <div className="mx-4 rounded-2xl bg-amber-100 p-4 ring-2 ring-amber-300">
            <p className={`font-bold text-amber-900 ${rol.grande ? "text-xl" : "text-base"}`}>
              🎉 {especialDelDia.titulo}
            </p>
            <p className={`text-amber-900 ${rol.grande ? "text-lg" : "text-sm"}`}>
              {especialDelDia.nota ?? "Hoy no hay rutina de cole."}
            </p>
          </div>
        )}

        {ausenciasDia.map((a) => (
          <div key={a.nino} className="mx-4 rounded-2xl bg-sky-50 p-3 ring-2 ring-sky-200">
            <p className="font-semibold text-sky-900">
              🤒 {a.nino === "mateo" ? "Mateo" : "Jimena"} no va este día{a.nota ? ` · ${a.nota}` : ""}
            </p>
          </div>
        ))}

        <AlertasCarros
          alertas={alertas}
          grande={rol.grande}
          onMover={onMover}
          onNoAplica={rol.admin ? onNoAplica : undefined}
        />
        <CarritoBadges carritos={carritosRol} grande={rol.grande} onMover={onMover} />

        <ul className="grid gap-3 px-4">
          {cargando ? (
            <li className="p-6 text-center text-stone-500">Cargando…</li>
          ) : visibles.length === 0 ? (
            <li className={`rounded-2xl bg-white p-6 text-center text-stone-500 ring-1 ring-stone-200 ${rol.grande ? "text-xl" : ""}`}>
              {especialDelDia ? "Sin planes este día" : "Nada que hacer este día"} 🎉
            </li>
          ) : (
            visibles.map((t) => (
              <TareaCard
                key={t.id}
                t={t}
                grande={rol.grande}
                hecha={t.tipo !== "horario" && hechasDia.has(t.key)}
                onHecho={() => onHecho(t)}
                onDeshacer={() => onDeshacer(t)}
                onOmitir={rol.admin && !t.eventoId ? () => onOmitir(fecha, t.key) : undefined}
                onRestaurar={rol.admin ? () => onRestaurar(t) : undefined}
                onBorrar={rol.admin && t.eventoId ? () => accion(() => borrarEvento(sb, t.eventoId!)) : undefined}
              />
            ))
          )}
        </ul>
      </main>

      {rol.admin && (
        <button
          onClick={() => setSheet("menu")}
          className="fixed bottom-5 right-4 z-10 h-14 rounded-full bg-amber-400 px-5 font-semibold shadow-lg active:scale-95"
        >
          ＋ Cambios
        </button>
      )}

      {sheet === "menu" && (
        <Sheet titulo="¿Qué quieres cambiar?" subtitulo={etiquetaLarga(fecha)} onCerrar={() => setSheet(null)}>
          <div className="grid gap-2">
            {[
              { id: "excepcion", txt: "🔁 Cambiar quién lleva o recoge este día" },
              { id: "evento", txt: "➕ Añadir un plan (fin de semana, abuelos…)" },
              { id: "festivo", txt: "🎉 Festivo / sin cole (uno o varios días)" },
              { id: "hora", txt: "🕑 Cambiar hora de salida (comedor…)" },
              { id: "ausencia", txt: "🤒 Un peque no va (malo, vacaciones…)" },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => setSheet(o.id as "excepcion" | "evento" | "festivo" | "ausencia" | "hora")}
                className="h-14 rounded-xl bg-stone-100 px-4 text-left font-medium active:bg-stone-200"
              >
                {o.txt}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {sheet === "excepcion" && (
        <ExcepcionSheet
          key={fecha}
          fecha={fecha}
          etiqueta={etiquetaLarga(fecha)}
          tareas={tareasDia}
          excepciones={excepciones}
          onCerrar={() => setSheet(null)}
          onGuardar={(e) => accion(() => guardarExcepcion(sb, e))}
          onRestaurar={(nino, tipo) => accion(() => borrarExcepcion(sb, fecha, nino, tipo))}
        />
      )}

      {sheet === "evento" && (
        <EventoSheet
          fechaInicial={fecha}
          onCerrar={() => setSheet(null)}
          onGuardar={(e) => accion(() => crearEvento(sb, e))}
        />
      )}

      {sheet === "hora" && (
        <HoraSalidaSheet
          fechaInicial={fecha}
          rutina={rutina}
          cambiosDia={excepciones.filter((e) => e.fecha === fecha && e.tipo === "recogida" && e.hora)}
          onCerrar={() => setSheet(null)}
          onGuardar={(filas) => accion(() => guardarHorasSalida(sb, filas))}
          onQuitar={(nino) => accion(() => quitarHoraSalida(sb, fecha, nino))}
        />
      )}

      {sheet === "ausencia" && (
        <AusenciaSheet
          fechaInicial={fecha}
          ausenciasDia={ausenciasDia}
          onCerrar={() => setSheet(null)}
          onGuardar={guardarAusencia}
          onQuitar={(nino) => accion(() => borrarAusencia(sb, fecha, nino))}
        />
      )}

      {sheet === "festivo" && (
        <FestivoSheet
          fechaInicial={fecha}
          existente={especialDelDia}
          onCerrar={() => setSheet(null)}
          onGuardar={(fechas, titulo, nota) => accion(() => guardarDiasEspeciales(sb, fechas, titulo, nota))}
          onQuitar={() => accion(() => borrarDiaEspecial(sb, fecha))}
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
