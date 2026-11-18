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
  /** Los padres ven todas las tareas y pueden compartir la agenda. */
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
    admin: false,
    grande: true,
  },
  padres: {
    slug: "padres",
    titulo: "Padres",
    saludo: "Álvaro y Gloria",
    emoji: "🏠",
    personas: ["alvaro", "gloria", "goyo", "abuela", "lucia"],
    admin: true,
    grande: false,
  },
};
