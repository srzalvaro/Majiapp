import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calendario & Logística Familiar",
  description: "Rutina semanal, recogidas y carritos de la familia",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fafaf9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="mx-auto min-h-dvh max-w-lg">{children}</body>
    </html>
  );
}
