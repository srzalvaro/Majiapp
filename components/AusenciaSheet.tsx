"use client";

import { useState } from "react";
import Sheet from "./Sheet";
import { rangoFechas } from "./FestivoSheet";
import type { Ausencia, Nino } from "@/lib/types";

const CAMPO = "h-12 w-full rounded-xl bg-stone-100 px-4";
const NINOS: { id: Nino; nombre: string }[] = [
  { id: "mateo", nombre: "Mateo" },
  { id: "jimena", nombre: "Jimena" },
];
const CARROS: { id: "beige" | "verde"; nombre: string }[] = [
  { id: "verde", nombre: "🟢 Carro Verde" },
  { id: "beige", nombre: "🟤 Carro Beige" },
];

export default function AusenciaSheet({
  fechaInicial,
  ausenciasDia,
  onGuardar,
  onQuitar,
  onCerrar,
}: {
  fechaInicial: string;
  ausenciasDia: Ausencia[];
  onGuardar: (a: { fechas: string[]; nino: Nino; nota: string | null; carros: ("beige" | "verde")[] }) => Promise<void>;
  onQuitar: (nino: Nino) => Promise<void>;
  onCerrar: () => void;
}) {
  const [nino, setNino] = useState<Nino>("mateo");
  const [desde, setDesde] = useState(fechaInicial);
  const [hasta, setHasta] = useState(fechaInicial);
  const [nota, setNota] = useState("Malo");
  const [carros, setCarros] = useState<("beige" | "verde")[]>([]);
  const [guardando, setGuardando] = useState(false);

  const fechas = desde && hasta ? rangoFechas(desde, hasta) : [];
  const valido = fechas.length > 0 && fechas.length <= 31;

  async function guardar() {
    setGuardando(true);
    try {
      await onGuardar({ fechas, nino, nota: nota.trim() || null, carros });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Sheet
      titulo="Un peque no va"
      subtitulo="Sus tareas de llevar y recoger desaparecen esos días. Los fines de semana no afectan."
      onCerrar={onCerrar}
    >
      <div className="grid gap-3">
        <div className="flex gap-2">
          {NINOS.map((n) => (
            <button
              key={n.id}
              onClick={() => setNino(n.id)}
              aria-pressed={nino === n.id}
              className={`h-11 flex-1 rounded-xl font-semibold ${nino === n.id ? "bg-stone-900 text-white" : "bg-stone-100"}`}
            >
              {n.nombre}
            </button>
          ))}
        </div>
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
        <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Motivo (opcional)" className={CAMPO} />

        <p className="text-sm font-medium">¿Qué carros no hace falta mover esos días?</p>
        <div className="flex flex-wrap gap-2">
          {CARROS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCarros((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))}
              aria-pressed={carros.includes(c.id)}
              className={`h-11 rounded-full px-4 text-sm font-medium ${
                carros.includes(c.id) ? "bg-amber-400 text-stone-900" : "bg-stone-100 text-stone-700"
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
        <p className="text-sm text-stone-500">
          {fechas.length > 31 ? "Máximo 31 días." : `${fechas.length} día${fechas.length === 1 ? "" : "s"}`}
        </p>
        <button
          onClick={guardar}
          disabled={!valido || guardando}
          className="h-12 rounded-xl bg-stone-900 font-semibold text-white disabled:opacity-40"
        >
          {guardando ? "Guardando…" : "Guardar ausencia"}
        </button>

        {ausenciasDia.length > 0 && (
          <div className="mt-2 grid gap-2 border-t border-stone-200 pt-3">
            <p className="text-sm font-medium">Ausencias del día seleccionado</p>
            {ausenciasDia.map((a) => (
              <button
                key={a.nino}
                onClick={() => onQuitar(a.nino)}
                className="h-12 rounded-xl bg-stone-100 px-4 text-left font-medium"
              >
                Quitar ausencia de {a.nino === "mateo" ? "Mateo" : "Jimena"}
                {a.nota ? ` (${a.nota})` : ""}
              </button>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
