export type Persona = "alvaro" | "gloria" | "goyo" | "abuela" | "lucia";
export type Nino = "jimena" | "mateo";
export type TipoTarea = "recogida" | "llevar" | "horario" | "carrito" | "otro";

export const UBICACIONES = ["Casa Familia", "Casa Abuelos", "Casa Tía Lucía"] as const;
export type Ubicacion = (typeof UBICACIONES)[number];

export interface Carrito {
  id: "beige" | "verde";
  nombre: string;
  color_hex: string;
  asignacion_preferente: string | null;
  ubicacion_actual: Ubicacion;
  updated_at: string;
}

export interface TareaRutina {
  id: number;
  dia_semana: number;
  hora: string;
  titulo: string;
  detalle: string | null;
  tipo: TipoTarea;
  nino: Nino | null;
  responsables: Persona[];
  carrito: "beige" | "verde" | null;
  destino: Ubicacion | null;
}

export interface Excepcion {
  id: number;
  fecha: string;
  nino: Nino;
  responsables: Persona[];
  nota: string | null;
}

export interface DiaEspecial {
  id: number;
  fecha: string;
  titulo: string;
  nota: string | null;
}

export interface Evento {
  id: number;
  fecha: string;
  hora: string;
  titulo: string;
  detalle: string | null;
  responsables: Persona[];
}

/** Tarea ya resuelta para una fecha concreta (rutina + excepción aplicada). */
export interface TareaDia extends TareaRutina {
  modificada: boolean;
  nota: string | null;
  /** Si viene de la tabla `eventos` (plan suelto), su id. */
  eventoId?: number;
}
