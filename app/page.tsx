import Link from "next/link";

export default function Inicio() {
  return (
    <main className="grid min-h-dvh content-center gap-4 px-6">
      <h1 className="font-titulo text-3xl font-extrabold text-ciruela">Calendario familiar</h1>
      <p className="text-stone-600">¿Quién eres?</p>
      <Link
        href="/abuelos"
        className="flex h-16 items-center justify-center rounded-2xl bg-calabaza text-xl font-extrabold text-white"
      >
        👵 Abuelos
      </Link>
      <Link
        href="/padres"
        className="flex h-16 items-center justify-center rounded-2xl bg-mostaza text-xl font-extrabold text-mostaza-oscuro"
      >
        🏠 Padres
      </Link>
    </main>
  );
}
