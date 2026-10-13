"use client";

import { useState } from "react";
import { UBICACIONES, type Carrito, type Ubicacion } from "@/lib/types";

const ESTILO = {
  beige: { emoji: "🟤", bg: "bg-beige-light", ring: "ring-beige", txt: "text-stone-800" },
  verde: { emoji: "🟢", bg: "bg-verde-light", ring: "ring-verde", txt: "text-verde-dark" },
} as const;

export default function CarritoBadges({
  carritos,
  grande,
  onMover,
  editable = true,
}: {
  carritos: Carrito[];
  grande: boolean;
  onMover: (id: string, ubicacion: Ubicacion) => void;
  /** false: se ve la ubicación y el selector queda detrás de "Cambiar". */
  editable?: boolean;
}) {
  return (
    <section aria-label="Carritos" className="grid gap-2 px-4">
      {carritos.map((c) => (
        <Badge key={c.id} c={c} grande={grande} onMover={onMover} editable={editable} />
      ))}
    </section>
  );
}

function Badge({
  c,
  grande,
  onMover,
  editable,
}: {
  c: Carrito;
  grande: boolean;
  onMover: (id: string, ubicacion: Ubicacion) => void;
  editable: boolean;
}) {
  const s = ESTILO[c.id];
  const [editando, setEditando] = useState(false);
  const mostrarSelector = editable || editando;

  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl p-3 ring-2 ${s.bg} ${s.ring} ${s.txt}`}>
      <span className={`font-semibold ${grande ? "text-lg" : "text-base"}`}>
        {s.emoji} {c.nombre}
        {c.asignacion_preferente && <span className="font-normal opacity-70"> ({c.asignacion_preferente})</span>}
        {!mostrarSelector && (
          <>
            <br />
            <span className="font-bold">{c.ubicacion_actual}</span>
          </>
        )}
      </span>
      {mostrarSelector ? (
        <select
          value={c.ubicacion_actual}
          onChange={(e) => {
            onMover(c.id, e.target.value as Ubicacion);
            setEditando(false);
          }}
          className={`rounded-xl border-0 bg-white/80 py-2 pl-3 pr-8 font-medium ${grande ? "text-base" : "text-sm"}`}
          aria-label={`Ubicación del ${c.nombre}`}
        >
          {UBICACIONES.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      ) : (
        <button onClick={() => setEditando(true)} className="h-11 rounded-xl bg-white/80 px-4 font-medium">
          Cambiar
        </button>
      )}
    </div>
  );
}
