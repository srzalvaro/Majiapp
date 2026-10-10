"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { rolDeSesion } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export default function Inicio() {
  const router = useRouter();
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return router.replace("/login");
    sb.auth.getSession().then(({ data }) => {
      const rol = rolDeSesion(data.session);
      router.replace(rol ? `/${rol}` : "/login");
    });
  }, [router]);
  return <p className="p-6 text-stone-500">Cargando…</p>;
}
