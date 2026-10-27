const COLOR = { beige: "#b08968", verde: "#2e9e4f" } as const;

export default function CarroIcon({
  carro,
  className = "h-7 w-7",
}: {
  carro?: "beige" | "verde" | null;
  className?: string;
}) {
  const c = carro ? COLOR[carro] : "#6b7280";
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <path d="M5 6h3l2 13" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 13h16a9 9 0 0 1-9 9h-5z" fill={c} stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 13a8 8 0 0 1 8-7v7z" fill={c} opacity="0.55" />
      <circle cx="12" cy="26" r="2.5" fill="#374151" />
      <circle cx="23" cy="26" r="2.5" fill="#374151" />
    </svg>
  );
}
