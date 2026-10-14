"use client";

import type { AlertaCarro } from "@/lib/carros";
import type { Ubicacion } from "@/lib/types";

export default function AlertasCarros({
  alertas,
  grande,
  onMover,
  onNoAplica,
}: {
  alertas: AlertaCarro[];
  grande: boolean;
  onMover: (id: string, u: Ubicacion) => void;
  /** Solo padres: la tarea que provoca el aviso no aplica ese día. */
  onNoAplica?: (a: AlertaCarro) => void;
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
          {onNoAplica && (
            <button
              onClick={() => onNoAplica(a)}
              className="ml-2 mt-2 h-11 rounded-xl bg-white px-4 font-medium text-red-800 ring-1 ring-red-300"
            >
              Hoy no aplica
            </button>
          )}
        </div>
      ))}
    </section>
  );
}
