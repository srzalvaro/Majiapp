// Todas las fechas se manejan como strings "YYYY-MM-DD" en hora de Madrid.
const TZ = "Europe/Madrid";

export const DIAS_CORTO = ["L", "M", "X", "J", "V", "S", "D"];
export const DIAS_LARGO = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function hoy(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

function aUTC(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function sumarDias(iso: string, n: number): string {
  const d = aUTC(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 1 = lunes … 7 = domingo */
export function diaSemana(iso: string): number {
  const d = aUTC(iso).getUTCDay();
  return d === 0 ? 7 : d;
}

export function lunesDeSemana(iso: string): string {
  return sumarDias(iso, -(diaSemana(iso) - 1));
}

export function semanaDe(iso: string): string[] {
  const lunes = lunesDeSemana(iso);
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

export function numeroDia(iso: string): number {
  return Number(iso.slice(8, 10));
}

export function etiquetaLarga(iso: string): string {
  const mes = new Intl.DateTimeFormat("es-ES", { month: "long", timeZone: "UTC" }).format(aUTC(iso));
  return `${DIAS_LARGO[diaSemana(iso) - 1]} ${numeroDia(iso)} de ${mes}`;
}

/** Día de la semana (1-7) y hora "HH:MM" ahora mismo en Madrid. */
export function ahora(): { dia: number; hora: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  return { dia: diaSemana(hoy()), hora: parts };
}
