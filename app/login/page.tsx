"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { rolDeSesion } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return setError("Falta configurar Supabase (variables de entorno).");
    setEnviando(true);
    setError(null);
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    setEnviando(false);
    if (error) return setError("Usuario o contraseña incorrectos.");
    const rol = rolDeSesion(data.session);
    if (!rol) {
      await sb.auth.signOut();
      return setError("Este usuario no tiene un rol asignado.");
    }
    router.replace(`/${rol}`);
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Calendario &amp; Logística Familiar</h1>
      <form onSubmit={entrar} className="grid gap-3">
        <input
          type="email"
          autoComplete="username"
          placeholder="Usuario (email)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-14 rounded-xl bg-white px-4 text-lg ring-1 ring-stone-300"
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-14 rounded-xl bg-white px-4 text-lg ring-1 ring-stone-300"
        />
        {error && <p className="text-red-700" role="alert">{error}</p>}
        <button
          disabled={enviando}
          className="h-14 rounded-xl bg-stone-900 text-lg font-semibold text-white disabled:opacity-50"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
