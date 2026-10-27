"use client";

import { useState } from "react";
import Sheet from "./Sheet";

export default function CompartirSheet({
  destinatarios,
  construir,
  onCerrar,
}: {
  destinatarios: { slug: string; titulo: string }[];
  construir: (slug: string) => string;
  onCerrar: () => void;
}) {
  const [slug, setSlug] = useState(destinatarios[0].slug);
  const [texto, setTexto] = useState(() => construir(destinatarios[0].slug));
  const [copiado, setCopiado] = useState(false);

  function elegir(s: string) {
    setSlug(s);
    setTexto(construir(s));
    setCopiado(false);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <Sheet titulo="Compartir agenda" subtitulo="Revisa el mensaje y envíalo por WhatsApp" onCerrar={onCerrar}>
      <div className="grid gap-3">
        {destinatarios.length > 1 && (
          <div className="flex gap-2">
            {destinatarios.map((d) => (
              <button
                key={d.slug}
                onClick={() => elegir(d.slug)}
                aria-pressed={slug === d.slug}
                className={`h-11 flex-1 rounded-xl font-semibold ${slug === d.slug ? "bg-stone-900 text-white" : "bg-stone-100"}`}
              >
                {d.titulo}
              </button>
            ))}
          </div>
        )}
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={14}
          aria-label="Mensaje"
          className="w-full rounded-xl bg-stone-100 p-3 text-sm leading-relaxed"
        />
        <a
          href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center rounded-xl bg-[#25D366] font-semibold text-stone-900 active:scale-95"
        >
          Enviar por WhatsApp
        </a>
        <button onClick={copiar} className="h-12 rounded-xl bg-stone-100 font-medium">
          {copiado ? "Copiado ✓" : "Copiar texto"}
        </button>
      </div>
    </Sheet>
  );
}
