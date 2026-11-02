import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MusicStats Wrapped — Tus Estadísticas de Spotify (RGPD)",
  description:
    "Analiza tu historial completo de Spotify (StreamingHistory / endsong.json) con privacidad 100% en tu navegador y genera tarjetas Wrapped compartibles.",
  icons: {
    icon: "/MusicStats.svg",
    shortcut: "/MusicStats.svg",
    apple: "/MusicStats.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
