"use client";

import { useState } from "react";
import Sheet from "./Sheet";
import { rangoFechas } from "./FestivoSheet";
import { diaSemana } from "@/lib/dates";
import type { Excepcion, Nino, TareaRutina } from "@/lib/types";

const CAMPO = "h-12 w-full rounded-xl bg-stone-100 px-4";
const NINOS: { id: Nino; nombre: string }[] = [
  { id: "jimena", nombre: "Jimena" },
  { id: "mateo", nombre: "Mateo" },
];

export default function HoraSalidaSheet({
  fechaInicial,
  rutina,
  cambiosDia,
  onGuardar,
  onQuitar,
  onCerrar,
}: {
  fechaInicial: string;
  rutina: TareaRutina[];
  /** Cambios de hora ya guardados en el día seleccionado. */
  cambiosDia: Excepcion[];
  onGuardar: (filas: { fecha: string; nino: Nino; hora: string; nota: string | null }[]) => Promise<void>;
  onQuitar: (nino: Nino) => Promise<void>;
  onCerrar: () => void;
}) {
  const [ninos, setNinos] = useState<Nino[]>(["jimena", "mateo"]);
  const [desde, setDesde] = useState(fechaInicial);
  const [hasta, setHasta] = useState(fechaInicial);
  const [hora, setHora] = useState("14:00");
  const [nota, setNota] = useState("Sin comedor");
  const [guardando, setGuardando] = useState(false);

  const fechas = desde && hasta ? rangoFechas(desde, hasta) : [];
  // Solo los días en que ese niño tiene recogida en la rutina
  const filas = fechas.flatMap((fecha) =>
    ninos
      .filter((n) =>
        rutina.some((t) => t.tipo === "recogida" && t.nino === n && t.dia_semana === diaSemana(fecha)),
      )
      .map((n) => ({ fecha, nino: n, hora, nota: nota.trim() || null })),
  );
  const valido = filas.length > 0 && fechas.length <= 31 && hora !== "" && ninos.length > 0;

  async function guardar() {
    setGuardando(true);
    try {
      await onGuardar(filas);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Sheet
      titulo="Cambiar hora de salida"
      subtitulo="Ej.: salir del cole a las 14:00 en vez de a las 16:00. Quién recoge no cambia."
      onCerrar={onCerrar}
    >
      <div className="grid gap-3">
        <div className="flex gap-2">
          {NINOS.map((n) => (
            <button
              key={n.id}
              onClick={() => setNinos((s) => (s.includes(n.id) ? s.filter((x) => x !== n.id) : [...s, n.id]))}
              aria-pressed={ninos.includes(n.id)}
              className={`h-11 flex-1 rounded-xl font-semibold ${
                ninos.includes(n.id) ? "bg-stone-900 text-white" : "bg-stone-100"
              }`}
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
        <div className="flex gap-2">
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={`${CAMPO} w-32`} aria-label="Nueva hora" />
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional)" className={CAMPO} />
        </div>
        <p className="text-sm text-stone-500">
          {filas.length === 0
            ? "Ningún día del rango tiene recogida de los niños elegidos."
            : `Se cambiarán ${filas.length} salida${filas.length === 1 ? "" : "s"} a las ${hora}.`}
        </p>
        <button
          onClick={guardar}
          disabled={!valido || guardando}
          className="h-12 rounded-xl bg-stone-900 font-semibold text-white disabled:opacity-40"
        >
          {guardando ? "Guardando…" : "Guardar cambio de hora"}
        </button>

        {cambiosDia.length > 0 && (
          <div className="mt-2 grid gap-2 border-t border-stone-200 pt-3">
            <p className="text-sm font-medium">Cambios de hora del día seleccionado</p>
            {cambiosDia.map((c) => (
              <button
                key={c.nino}
                onClick={() => onQuitar(c.nino)}
                className="h-12 rounded-xl bg-stone-100 px-4 text-left font-medium"
              >
                Quitar la hora de {c.nino === "mateo" ? "Mateo" : "Jimena"} ({c.hora})
              </button>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
