"use client";

import { useState } from "react";
import Sheet from "./Sheet";
import { PERSONAS } from "@/lib/roles";
import type { Evento, Persona } from "@/lib/types";

const CAMPO = "h-12 w-full rounded-xl bg-stone-100 px-4";

export default function EventoSheet({
  fechaInicial,
  onGuardar,
  onCerrar,
}: {
  fechaInicial: string;
  onGuardar: (e: Omit<Evento, "id">) => Promise<void>;
  onCerrar: () => void;
}) {
  const [fecha, setFecha] = useState(fechaInicial);
  const [hora, setHora] = useState("10:00");
  const [titulo, setTitulo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [sel, setSel] = useState<Persona[]>([]);
  const [guardando, setGuardando] = useState(false);

  const valido = titulo.trim() !== "" && sel.length > 0 && fecha !== "" && hora !== "";

  async function guardar() {
    setGuardando(true);
    try {
      await onGuardar({ fecha, hora, titulo: titulo.trim(), detalle: detalle.trim() || null, responsables: sel });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Sheet titulo="Añadir plan" subtitulo="Ej.: sábado, abuelos con los peques" onCerrar={onCerrar}>
      <div className="grid gap-3">
        <div className="flex gap-2">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={CAMPO} aria-label="Fecha" />
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={`${CAMPO} w-32`} aria-label="Hora" />
        </div>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Qué (ej. Tarde con Jimena y Mateo)"
          className={CAMPO}
        />
        <input
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          placeholder="Detalle (opcional)"
          className={CAMPO}
        />
        <p className="text-sm font-medium">¿A quién se avisa?</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PERSONAS) as Persona[]).map((p) => (
            <button
              key={p}
              onClick={() => setSel((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]))}
              aria-pressed={sel.includes(p)}
              className={`h-11 rounded-full px-4 text-sm font-medium ${
                sel.includes(p) ? "bg-amber-400 text-stone-900" : "bg-stone-100 text-stone-700"
              }`}
            >
              {PERSONAS[p]}
            </button>
          ))}
        </div>
        <button
          onClick={guardar}
          disabled={!valido || guardando}
          className="mt-2 h-12 rounded-xl bg-stone-900 font-semibold text-white disabled:opacity-40"
        >
          {guardando ? "Guardando…" : "Guardar plan"}
        </button>
      </div>
    </Sheet>
  );
}
