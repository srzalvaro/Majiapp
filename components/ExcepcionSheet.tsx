"use client";

import { useState } from "react";
import { PERSONAS } from "@/lib/roles";
import type { Excepcion, Nino, Persona, TareaDia } from "@/lib/types";

const NINOS: { id: Nino; nombre: string }[] = [
  { id: "jimena", nombre: "Jimena" },
  { id: "mateo", nombre: "Mateo" },
];

export default function ExcepcionSheet({
  fecha,
  etiqueta,
  tareas,
  excepciones,
  onGuardar,
  onRestaurar,
  onCerrar,
}: {
  fecha: string;
  etiqueta: string;
  tareas: TareaDia[];
  excepciones: Excepcion[];
  onGuardar: (e: { fecha: string; nino: Nino; responsables: Persona[]; nota: string | null }) => Promise<void>;
  onRestaurar: (nino: Nino) => Promise<void>;
  onCerrar: () => void;
}) {
  const [nino, setNino] = useState<Nino>("jimena");
  const recogida = tareas.find((t) => t.tipo === "recogida" && t.nino === nino);
  const existente = excepciones.find((e) => e.fecha === fecha && e.nino === nino);

  const [sel, setSel] = useState<Persona[]>(recogida?.responsables ?? []);
  const [nota, setNota] = useState(existente?.nota ?? "");
  const [guardando, setGuardando] = useState(false);

  function cambiarNino(n: Nino) {
    setNino(n);
    const r = tareas.find((t) => t.tipo === "recogida" && t.nino === n);
    const ex = excepciones.find((e) => e.fecha === fecha && e.nino === n);
    setSel(r?.responsables ?? []);
    setNota(ex?.nota ?? "");
  }

  function toggle(p: Persona) {
    setSel((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  }

  async function guardar() {
    setGuardando(true);
    try {
      await onGuardar({ fecha, nino, responsables: sel, nota: nota.trim() || null });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/40" onClick={onCerrar}>
      <div
        className="mx-auto w-full max-w-lg rounded-t-3xl bg-white p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Cambio de planes"
      >
        <h2 className="text-xl font-bold">¿Cambio de planes?</h2>
        <p className="mb-4 text-sm text-stone-500">{etiqueta} · solo afecta a este día</p>

        <div className="mb-4 flex gap-2">
          {NINOS.map((n) => (
            <button
              key={n.id}
              onClick={() => cambiarNino(n.id)}
              className={`h-11 flex-1 rounded-xl font-semibold ${
                nino === n.id ? "bg-stone-900 text-white" : "bg-stone-100"
              }`}
            >
              {n.nombre}
            </button>
          ))}
        </div>

        {!recogida ? (
          <p className="rounded-xl bg-stone-100 p-4 text-stone-600">
            Este día no hay recogida de {nino === "jimena" ? "Jimena" : "Mateo"} en la rutina.
          </p>
        ) : (
          <>
            <p className="mb-2 text-sm font-medium">
              ¿Quién recoge a las {recogida.hora}?
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {(Object.keys(PERSONAS) as Persona[]).map((p) => (
                <button
                  key={p}
                  onClick={() => toggle(p)}
                  aria-pressed={sel.includes(p)}
                  className={`h-11 rounded-full px-4 text-sm font-medium ${
                    sel.includes(p) ? "bg-amber-400 text-stone-900" : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {PERSONAS[p]}
                </button>
              ))}
            </div>
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Nota (opcional)"
              className="mb-4 h-11 w-full rounded-xl bg-stone-100 px-4"
            />
            <div className="flex gap-2">
              {existente && (
                <button
                  onClick={() => onRestaurar(nino)}
                  className="h-12 rounded-xl bg-stone-100 px-4 font-medium"
                >
                  Restaurar rutina
                </button>
              )}
              <button
                onClick={guardar}
                disabled={sel.length === 0 || guardando}
                className="h-12 flex-1 rounded-xl bg-stone-900 font-semibold text-white disabled:opacity-40"
              >
                {guardando ? "Guardando…" : "Guardar cambio"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
