import { PERSONAS } from "@/lib/roles";
import type { TareaDia } from "@/lib/types";

const ICONO = { recogida: "🎒", llevar: "🚶", horario: "💼", carrito: "🛒", otro: "📌" } as const;

export default function TareaCard({
  t,
  grande,
  hecha,
  onHecho,
  onDeshacer,
  onBorrar,
  onOmitir,
  onRestaurar,
}: {
  t: TareaDia;
  grande: boolean;
  hecha: boolean;
  onHecho: () => void;
  onDeshacer: () => void;
  onBorrar?: () => void;
  /** Solo padres: omitir/restaurar la tarea de rutina este día. */
  onOmitir?: () => void;
  onRestaurar?: () => void;
}) {
  return (
    <li
      className={`rounded-2xl bg-white shadow-sm ring-1 ${hecha || t.omitida ? "opacity-60" : ""} ${
        t.modificada ? "ring-2 ring-amber-400" : "ring-stone-200"
      } ${grande ? "p-5" : "p-3"}`}
    >
      <div className="flex gap-3">
        <div className={grande ? "text-3xl" : "text-2xl"}>{ICONO[t.tipo]}</div>
        <div className="min-w-0 flex-1">
          <p className={`font-bold ${grande ? "text-2xl" : "text-base"} ${hecha || t.omitida ? "line-through" : ""}`}>
            {t.hora} <span className="font-semibold">· {t.titulo}</span>
          </p>
          {t.detalle && (
            <p className={`mt-1 text-stone-600 ${grande ? "text-lg" : "text-sm"}`}>{t.detalle}</p>
          )}
          <p className={`mt-1 text-stone-500 ${grande ? "text-base" : "text-sm"}`}>
            {t.responsables.map((p) => PERSONAS[p]).join(" + ")}
          </p>
          {t.omitida ? (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-sm font-semibold text-stone-600">⛔ Omitida este día</span>
              {onRestaurar && (
                <button onClick={onRestaurar} className="h-9 rounded-lg px-3 text-sm text-stone-600 ring-1 ring-stone-300">
                  Restaurar
                </button>
              )}
            </div>
          ) : (
            t.tipo !== "horario" &&
            (hecha ? (
              <div className="mt-2 flex items-center gap-3">
                <span className={`font-semibold text-verde-dark ${grande ? "text-lg" : "text-sm"}`}>✅ Hecho</span>
                <button onClick={onDeshacer} className="h-9 rounded-lg px-3 text-sm text-stone-500 ring-1 ring-stone-300">
                  Deshacer
                </button>
              </div>
            ) : (
              <button
                onClick={onHecho}
                className={`mt-3 rounded-xl bg-verde font-semibold text-white active:scale-95 ${
                  grande ? "h-12 px-6 text-lg" : "h-10 px-4"
                }`}
              >
                ✓ Hecho{t.carrito && t.destino ? ` · carro en ${t.destino.replace("Casa ", "")}` : ""}
              </button>
            ))
          )}
          {!t.omitida && onOmitir && (
            <button onClick={onOmitir} className="ml-2 mt-2 h-9 rounded-lg px-3 text-sm text-stone-500 ring-1 ring-stone-300">
              Omitir este día
            </button>
          )}
          {onBorrar && (
            <button onClick={onBorrar} className="mt-2 h-9 rounded-lg bg-stone-100 px-3 text-sm text-stone-700">
              Borrar plan
            </button>
          )}
          {t.modificada && (
            <p className={`mt-2 font-medium text-amber-700 ${grande ? "text-base" : "text-sm"}`}>
              ⚠️ Cambio de planes{t.nota ? `: ${t.nota}` : ""}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
