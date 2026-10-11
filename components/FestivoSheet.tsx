"use client";

import { useState } from "react";
import Sheet from "./Sheet";
import { sumarDias } from "@/lib/dates";
import type { DiaEspecial } from "@/lib/types";

const CAMPO = "h-12 w-full rounded-xl bg-stone-100 px-4";
const MAX_DIAS = 31;

/** Fechas "YYYY-MM-DD" desde..hasta, ambas incluidas. */
export function rangoFechas(desde: string, hasta: string): string[] {
  const out: string[] = [];
  for (let f = desde; f <= hasta && out.length <= MAX_DIAS; f = sumarDias(f, 1)) out.push(f);
  return out;
}

export default function FestivoSheet({
  fechaInicial,
  existente,
  onGuardar,
  onQuitar,
  onCerrar,
}: {
  fechaInicial: string;
  existente?: DiaEspecial;
  onGuardar: (fechas: string[], titulo: string, nota: string | null) => Promise<void>;
  onQuitar: () => Promise<void>;
  onCerrar: () => void;
}) {
  const [desde, setDesde] = useState(fechaInicial);
  const [hasta, setHasta] = useState(fechaInicial);
  const [titulo, setTitulo] = useState("Festivo");
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);

  const fechas = desde && hasta ? rangoFechas(desde, hasta) : [];
  const valido = fechas.length > 0 && fechas.length <= MAX_DIAS && titulo.trim() !== "";

  async function guardar() {
    setGuardando(true);
    try {
      await onGuardar(fechas, titulo.trim(), nota.trim() || null);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Sheet
      titulo="Festivo / sin cole"
      subtitulo="Esos días no se aplica la rutina semanal. Puedes añadir planes sueltos después."
      onCerrar={onCerrar}
    >
      <div className="grid gap-3">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              if (hasta < e.target.value) setHasta(e.target.value);
            }}
            className={CAMPO}
            aria-label="Desde"
          />
          <span>→</span>
          <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} className={CAMPO} aria-label="Hasta" />
        </div>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" className={CAMPO} />
        <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional)" className={CAMPO} />
        <p className="text-sm text-stone-500">
          {fechas.length > MAX_DIAS ? `Máximo ${MAX_DIAS} días.` : `${fechas.length} día${fechas.length === 1 ? "" : "s"}`}
        </p>
        <button
          onClick={guardar}
          disabled={!valido || guardando}
          className="h-12 rounded-xl bg-stone-900 font-semibold text-white disabled:opacity-40"
        >
          {guardando ? "Guardando…" : "Marcar como festivo"}
        </button>
        {existente && (
          <button onClick={onQuitar} className="h-12 rounded-xl bg-stone-100 font-medium">
            Quitar festivo del día seleccionado
          </button>
        )}
      </div>
    </Sheet>
  );
}
