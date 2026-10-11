import { PERSONAS } from "@/lib/roles";
import type { TareaDia } from "@/lib/types";

const ICONO = { recogida: "🎒", llevar: "🚶", horario: "💼", carrito: "🛒", otro: "📌" } as const;

export default function TareaCard({
  t,
  grande,
  onBorrar,
}: {
  t: TareaDia;
  grande: boolean;
  onBorrar?: () => void;
}) {
  return (
    <li
      className={`rounded-2xl bg-white shadow-sm ring-1 ${
        t.modificada ? "ring-2 ring-amber-400" : "ring-stone-200"
      } ${grande ? "p-5" : "p-3"}`}
    >
      <div className="flex gap-3">
        <div className={grande ? "text-3xl" : "text-2xl"}>{ICONO[t.tipo]}</div>
        <div className="min-w-0 flex-1">
          <p className={`font-bold ${grande ? "text-2xl" : "text-base"}`}>
            {t.hora} <span className="font-semibold">· {t.titulo}</span>
          </p>
          {t.detalle && (
            <p className={`mt-1 text-stone-600 ${grande ? "text-lg" : "text-sm"}`}>{t.detalle}</p>
          )}
          <p className={`mt-1 text-stone-500 ${grande ? "text-base" : "text-sm"}`}>
            {t.responsables.map((p) => PERSONAS[p]).join(" + ")}
          </p>
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
