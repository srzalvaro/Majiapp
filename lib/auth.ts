import type { Session } from "@supabase/supabase-js";
import { ROLES } from "./roles";

/** Rol guardado en app_metadata (solo editable desde el servidor). */
export function rolDeSesion(s: Session | null): string | null {
  const rol = s?.user.app_metadata?.rol;
  return typeof rol === "string" && rol in ROLES ? rol : null;
}
