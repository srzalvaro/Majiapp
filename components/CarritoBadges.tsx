"use client";

import { UBICACIONES, type Carrito, type Ubicacion } from "@/lib/types";

const ESTILO = {
  beige: { emoji: "🟤", bg: "bg-beige-light", ring: "ring-beige", txt: "text-stone-800" },
  verde: { emoji: "🟢", bg: "bg-verde-light", ring: "ring-verde", txt: "text-verde-dark" },
} as const;

export default function CarritoBadges({
  carritos,
  grande,
  onMover,
}: {
  carritos: Carrito[];
  grande: boolean;
  onMover: (id: string, ubicacion: Ubicacion) => void;
}) {
  return (
    <section aria-label="Carritos" className="grid gap-2 px-4">
      {carritos.map((c) => {
        const s = ESTILO[c.id];
        return (
          <label
            key={c.id}
            className={`flex items-center justify-between gap-3 rounded-2xl p-3 ring-2 ${s.bg} ${s.ring} ${s.txt}`}
          >
            <span className={`font-semibold ${grande ? "text-lg" : "text-base"}`}>
              {s.emoji} {c.nombre}
              {c.asignacion_preferente && (
                <span className="font-normal opacity-70"> ({c.asignacion_preferente})</span>
              )}
            </span>
            <select
              value={c.ubicacion_actual}
              onChange={(e) => onMover(c.id, e.target.value as Ubicacion)}
              className={`rounded-xl border-0 bg-white/80 py-2 pl-3 pr-8 font-medium ${grande ? "text-base" : "text-sm"}`}
              aria-label={`Ubicación del ${c.nombre}`}
            >
              {UBICACIONES.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
        );
      })}
    </section>
  );
}
