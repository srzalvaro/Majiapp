"use client";

import { useState } from "react";
import { PERSONAS } from "@/lib/roles";
import type { Excepcion, Nino, Persona, TareaDia } from "@/lib/types";

type Tipo = "recogida" | "llevar";

const NINOS: { id: Nino; nombre: string }[] = [
  { id: "jimena", nombre: "Jimena" },
  { id: "mateo", nombre: "Mateo" },
];
const TIPOS: { id: Tipo; txt: string; pregunta: string }[] = [
  { id: "llevar", txt: "Quién lleva", pregunta: "llevar" },
  { id: "recogida", txt: "Quién recoge", pregunta: "recoger" },
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
  onGuardar: (e: {
    fecha: string;
    nino: Nino;
    tipo: Tipo;
    responsables: Persona[];
    nota: string | null;
  }) => Promise<void>;
  onRestaurar: (nino: Nino, tipo: Tipo) => Promise<void>;
  onCerrar: () => void;
}) {
  const [tipo, setTipo] = useState<Tipo>("llevar");
  const [nino, setNino] = useState<Nino>("jimena");

  const tarea = (t: Tipo, n: Nino) => tareas.find((x) => x.tipo === t && x.nino === n);
  const excepcion = (t: Tipo, n: Nino) =>
    excepciones.find((e) => e.fecha === fecha && e.nino === n && e.tipo === t);

  const [sel, setSel] = useState<Persona[]>(tarea("llevar", "jimena")?.responsables ?? []);
  const [nota, setNota] = useState(excepcion("llevar", "jimena")?.nota ?? "");
  const [guardando, setGuardando] = useState(false);

  const actual = tarea(tipo, nino);
  const existente = excepcion(tipo, nino);
  const verbo = TIPOS.find((t) => t.id === tipo)!.pregunta;

  function cambiar(t: Tipo, n: Nino) {
    setTipo(t);
    setNino(n);
    setSel(tarea(t, n)?.responsables ?? []);
    setNota(excepcion(t, n)?.nota ?? "");
  }

  function toggle(p: Persona) {
    setSel((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  }

  async function guardar() {
    setGuardando(true);
    try {
      await onGuardar({ fecha, nino, tipo, responsables: sel, nota: nota.trim() || null });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/40" onClick={onCerrar}>
      <div
        className="mx-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Cambio de planes"
      >
        <h2 className="text-xl font-bold">¿Cambio de planes?</h2>
        <p className="mb-4 text-sm text-stone-500">{etiqueta} · solo afecta a este día</p>

        <div className="mb-2 flex gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              onClick={() => cambiar(t.id, nino)}
              aria-pressed={tipo === t.id}
              className={`h-11 flex-1 rounded-xl font-semibold ${
                tipo === t.id ? "bg-stone-900 text-white" : "bg-stone-100"
              }`}
            >
              {t.txt}
            </button>
          ))}
        </div>
        <div className="mb-4 flex gap-2">
          {NINOS.map((n) => (
            <button
              key={n.id}
              onClick={() => cambiar(tipo, n.id)}
              aria-pressed={nino === n.id}
              className={`h-11 flex-1 rounded-xl font-semibold ${
                nino === n.id ? "bg-stone-900 text-white" : "bg-stone-100"
              }`}
            >
              {n.nombre}
            </button>
          ))}
        </div>

        {!actual ? (
          <p className="rounded-xl bg-stone-100 p-4 text-stone-600">
            Este día no hay que {verbo} a {nino === "jimena" ? "Jimena" : "Mateo"} en la rutina.
          </p>
        ) : (
          <>
            <p className="mb-2 text-sm font-medium">
              ¿Quién va a {verbo} a las {actual.hora}?
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
                  onClick={() => onRestaurar(nino, tipo)}
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
