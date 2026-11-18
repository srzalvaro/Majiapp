import { PERSONAS } from "@/lib/roles";
import CarroIcon from "./CarroIcon";
import { carrosDe, type TareaDia } from "@/lib/types";

const ICONO = { recogida: "🎒", llevar: "🚶", horario: "🍽️", carrito: "🚼", otro: "📌" } as const;

export function IconoTarea({ t, className }: { t: TareaDia; className: string }) {
  if (t.tipo !== "carrito") return <>{ICONO[t.tipo]}</>;
  return (
    <span className="flex">
      {(carrosDe(t).length ? carrosDe(t) : [null]).map((c, i) => (
        <CarroIcon key={i} carro={c} className={className} />
      ))}
    </span>
  );
}

export function cambioDePlanes(t: TareaDia): string | null {
  if (!t.modificada) return null;
  return `⚠️ Cambio de planes${t.horaRutina ? ` · ahora a las ${t.hora} (antes ${t.horaRutina})` : ""}${t.nota ? ` · ${t.nota}` : ""}`;
}

export default function TareaCard({ t, pasada = false }: { t: TareaDia; pasada?: boolean }) {
  return (
    <li
      className={`rounded-2xl bg-white p-3 shadow-sm ring-1 ${pasada || t.omitida ? "opacity-60" : ""} ${
        t.modificada ? "ring-2 ring-amber-400" : "ring-orange-100"
      }`}
    >
      <div className="flex gap-3">
        <div className="text-2xl">
          <IconoTarea t={t} className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-base font-bold ${t.omitida ? "line-through" : ""}`}>
            <span className="mr-2 inline-block rounded-lg bg-mostaza px-2 py-0.5 font-titulo font-extrabold text-mostaza-oscuro">
              {t.hora}
            </span>
            {t.titulo}
          </p>
          {t.detalle && <p className="mt-1 text-sm text-stone-600">{t.detalle}</p>}
          <p className="mt-1 text-sm font-semibold text-ciruela-claro">
            {t.responsables.map((p) => PERSONAS[p]).join(" + ")}
          </p>
          {t.omitida && (
            <p className="mt-1 text-sm font-semibold text-stone-600">
              {t.ausente ? `🤒 ${t.nino === "mateo" ? "Mateo" : "Jimena"} no va este día` : "⛔ No aplica este día"}
            </p>
          )}
          {cambioDePlanes(t) && <p className="mt-2 text-sm font-medium text-amber-700">{cambioDePlanes(t)}</p>}
        </div>
      </div>
    </li>
  );
}
