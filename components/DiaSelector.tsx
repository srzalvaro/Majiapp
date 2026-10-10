"use client";

import { DIAS_CORTO, numeroDia, semanaDe } from "@/lib/dates";

export default function DiaSelector({
  fecha,
  hoy,
  onChange,
  onSemana,
}: {
  fecha: string;
  hoy: string;
  onChange: (f: string) => void;
  onSemana: (delta: number) => void;
}) {
  return (
    <nav className="flex items-center gap-1 px-2 py-2" aria-label="Día">
      <button onClick={() => onSemana(-7)} className="h-11 w-8 text-xl text-stone-500" aria-label="Semana anterior">
        ‹
      </button>
      {semanaDe(fecha).map((f, i) => {
        const activo = f === fecha;
        return (
          <button
            key={f}
            onClick={() => onChange(f)}
            aria-current={activo ? "date" : undefined}
            className={`flex h-14 flex-1 flex-col items-center justify-center rounded-xl text-sm ${
              activo ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200"
            } ${f === hoy && !activo ? "ring-2 ring-stone-900" : ""}`}
          >
            <span className="text-xs opacity-70">{DIAS_CORTO[i]}</span>
            <span className="font-semibold">{numeroDia(f)}</span>
          </button>
        );
      })}
      <button onClick={() => onSemana(7)} className="h-11 w-8 text-xl text-stone-500" aria-label="Semana siguiente">
        ›
      </button>
    </nav>
  );
}
