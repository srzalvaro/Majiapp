import type { Persona } from "./types";

export const PERSONAS: Record<Persona, string> = {
  alvaro: "Álvaro",
  gloria: "Gloria (mamá)",
  goyo: "Abuelo Goyo",
  abuela: "Abuela Gloria",
  lucia: "Tía Lucía",
};

export interface RolConfig {
  slug: string;
  titulo: string;
  saludo: string;
  emoji: string;
  /** Personas cuyas tareas se muestran en esta vista. */
  personas: Persona[];
  carritos: ("beige" | "verde")[];
  /** Los padres ven toda la matriz y pueden crear excepciones. */
  admin: boolean;
  /** Vista con tarjetas grandes y texto ampliado. */
  grande: boolean;
}

export const ROLES: Record<string, RolConfig> = {
  abuelos: {
    slug: "abuelos",
    titulo: "Abuelos",
    saludo: "Goyo y Gloria",
    emoji: "👵",
    personas: ["goyo", "abuela"],
    carritos: ["verde", "beige"],
    admin: false,
    grande: true,
  },
  lucia: {
    slug: "lucia",
    titulo: "Tía Lucía",
    saludo: "Lucía",
    emoji: "💛",
    personas: ["lucia"],
    carritos: ["beige"],
    admin: false,
    grande: true,
  },
  padres: {
    slug: "padres",
    titulo: "Padres",
    saludo: "Álvaro y Gloria",
    emoji: "🏠",
    personas: ["alvaro", "gloria", "goyo", "abuela", "lucia"],
    carritos: ["beige", "verde"],
    admin: true,
    grande: false,
  },
};
