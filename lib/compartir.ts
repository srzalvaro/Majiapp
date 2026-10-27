import { etiquetaLarga } from "./dates";
import type { Ausencia, Carrito, DiaEspecial, TareaDia } from "./types";

const ICONO = { recogida: "🎒", llevar: "🚶", horario: "🍽️", carrito: "⚪", otro: "📌" } as const;
const CARRO = { beige: "🟤", verde: "🟢" } as const;
const NINO = { mateo: "Mateo", jimena: "Jimena" } as const;

export interface DiaMensaje {
  fecha: string;
  tareas: TareaDia[];
  especial?: DiaEspecial;
  ausencias: Ausencia[];
}

function bloque(titulo: string, d: DiaMensaje): string {
  const lineas: string[] = [`${titulo} · ${etiquetaLarga(d.fecha).toLowerCase()}`.replace(/^(.+?) ·/, "*$1* ·")];

  if (d.especial) lineas.push(`🎉 *${d.especial.titulo}*${d.especial.nota ? ` · ${d.especial.nota}` : ""}`);
  for (const a of d.ausencias) lineas.push(`🤒 ${NINO[a.nino]} no va${a.nota ? ` · ${a.nota}` : ""}`);

  if (d.tareas.length === 0) {
    lineas.push("Nada que hacer 🎉");
  } else {
    for (const t of d.tareas) {
      lineas.push(`${t.tipo === "carrito" && t.carrito ? CARRO[t.carrito] : ICONO[t.tipo]} *${t.hora}* ${t.titulo}`);
      if (t.detalle && t.eventoId) lineas.push(`      _${t.detalle}_`);
      if (t.modificada) {
        const cambios = [t.horaRutina ? `ahora a las ${t.hora} (antes ${t.horaRutina})` : "", t.nota ?? ""].filter(Boolean);
        lineas.push(`      ⚠️ Cambio de planes${cambios.length ? `: ${cambios.join(" · ")}` : ""}`);
      }
    }
  }
  return lineas.join("\n");
}

/** Mensaje de WhatsApp: plan de hoy y de mañana + dónde están los carros. */
export function mensajeAgenda(o: {
  saludo: string;
  hoy: DiaMensaje;
  manana: DiaMensaje;
  carritos: Carrito[];
  enlace?: string;
}): string {
  const partes = [
    `👋 ¡Hola, ${o.saludo}! Vuestra agenda:`,
    bloque("📅 HOY", o.hoy),
    bloque("🌙 MAÑANA", o.manana),
  ];
  if (o.carritos.length > 0) {
    partes.push(
      ["📍 *Carros ahora*", ...o.carritos.map((c) => `${CARRO[c.id]} ${c.nombre.replace("Carro ", "")} → ${c.ubicacion_actual}`)].join(
        "\n",
      ),
    );
  }
  if (o.enlace) partes.push(`🔗 ${o.enlace}`);
  return partes.join("\n\n");
}
