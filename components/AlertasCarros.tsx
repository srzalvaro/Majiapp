"use client";

import type { AlertaCarro } from "@/lib/carros";
import type { Ubicacion } from "@/lib/types";

export default function AlertasCarros({
  alertas,
  grande,
  onMover,
}: {
  alertas: AlertaCarro[];
  grande: boolean;
  onMover: (id: string, u: Ubicacion) => void;
}) {
  if (alertas.length === 0) return null;
  return (
    <section aria-label="Alertas de carros" className="grid gap-2 px-4" role="alert">
      {alertas.map((a) => (
        <div key={a.carrito.id} className="rounded-2xl bg-red-50 p-3 ring-2 ring-red-300">
          <p className={`font-semibold text-red-800 ${grande ? "text-lg" : "text-sm"}`}>
            ⚠️ El {a.carrito.nombre} debería estar en {a.esperado} (desde las {a.desde}), pero está en{" "}
            {a.carrito.ubicacion_actual}.
          </p>
          <button
            onClick={() => onMover(a.carrito.id, a.esperado)}
            className="mt-2 h-11 rounded-xl bg-red-700 px-4 font-semibold text-white active:scale-95"
          >
            Ya está en {a.esperado}
          </button>
        </div>
      ))}
    </section>
  );
}
