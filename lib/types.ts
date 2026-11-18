export type Persona = "alvaro" | "gloria" | "goyo" | "abuela" | "lucia";
export type Nino = "jimena" | "mateo";
export type TipoTarea = "recogida" | "llevar" | "horario" | "carrito" | "otro";
export type CarroId = "beige" | "verde";

export type Ubicacion = "Casa Familia" | "Casa Abuelos";

export interface TareaRutina {
  id: number;
  dia_semana: number;
  hora: string;
  titulo: string;
  detalle: string | null;
  tipo: TipoTarea;
  nino: Nino | null;
  responsables: Persona[];
  carrito: CarroId | null;
  /** Segundo carro de la misma tarea (p. ej. "dejar los dos carros en Fundición"). */
  carrito_extra?: CarroId | null;
  /** Dónde queda el carro al terminar (solo informativo). */
  destino: Ubicacion | null;
}

/** Cambio puntual de quién lleva/recoge a un niño, o de su hora, un día concreto. */
export interface Excepcion {
  fecha: string;
  nino: Nino;
  tipo: "recogida" | "llevar";
  /** Sin esto, quién lo hace no cambia (solo la hora). */
  responsables?: Persona[];
  /** Hora distinta de la de la rutina ese día (p. ej. salida a las 14:00). */
  hora?: string;
  nota?: string;
}

/** Festivo o día sin cole: no se aplica la rutina semanal. */
export interface DiaEspecial {
  fecha: string;
  titulo: string;
  nota?: string;
}

/** Plan suelto (fin de semana con los abuelos, etc.). */
export interface Evento {
  fecha: string;
  hora: string;
  titulo: string;
  detalle?: string;
  responsables: Persona[];
}

/** Un niño que no va ese día: se tachan sus tareas de llevar y recoger. */
export interface Ausencia {
  fecha: string;
  nino: Nino;
  nota?: string;
}

/** Tarea de la rutina que no aplica un día concreto (se busca por hora y/o texto del título). */
export interface Omitida {
  fecha: string;
  hora?: string;
  texto?: string;
}

/** Tarea ya resuelta para una fecha concreta (rutina + cambios aplicados). */
export interface TareaDia extends TareaRutina {
  /** Hora original de la rutina, si ese día se ha cambiado. */
  horaRutina?: string;
  key: string;
  /** No aplica este día (omitida o niño ausente). */
  omitida?: boolean;
  ausente?: boolean;
  modificada: boolean;
  nota: string | null;
  /** Es un plan suelto (no viene de la rutina). */
  esPlan?: boolean;
}

/** Carros que afecta una tarea (uno o dos). */
export function carrosDe(t: { carrito: CarroId | null; carrito_extra?: CarroId | null }): CarroId[] {
  return [t.carrito, t.carrito_extra].filter((c): c is CarroId => !!c);
}
