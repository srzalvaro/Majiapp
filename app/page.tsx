import Link from "next/link";
import { ROLES } from "@/lib/roles";

export default function Inicio() {
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Calendario &amp; Logística Familiar</h1>
      <p className="text-stone-600">¿Quién eres?</p>
      {Object.values(ROLES).map((r) => (
        <Link
          key={r.slug}
          href={`/${r.slug}`}
          className="flex items-center gap-4 rounded-2xl bg-white p-5 text-xl font-semibold shadow-sm ring-1 ring-stone-200 active:scale-[0.98]"
        >
          <span className="text-4xl">{r.emoji}</span>
          {r.titulo}
        </Link>
      ))}
    </main>
  );
}
