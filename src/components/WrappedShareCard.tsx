"use client";

import React, { useRef, useState } from "react";
import { DashboardMetrics } from "@/types/spotify";
import { Download, Sparkles, Palette } from "lucide-react";
import ArtworkThumb from "@/components/ArtworkThumb";
import { fetchArtworkLive } from "@/lib/artwork";

interface WrappedShareCardProps {
  metrics: DashboardMetrics;
  selectedYear: number | "all";
}

type ThemePreset = {
  id: string;
  name: string;
  bgGradient: [string, string, string];
  accent: string;
  textPrimary: string;
  textSecondary: string;
};

const THEMES: ThemePreset[] = [
  {
    id: "spotify-neon",
    name: "Spotify Neon",
    bgGradient: ["#0d1f14", "#121212", "#1db954"],
    accent: "#1ED760",
    textPrimary: "#FFFFFF",
    textSecondary: "#B3B3B3",
  },
  {
    id: "cyber-magenta",
    name: "Wrapped Magenta",
    bgGradient: ["#2A0845", "#120924", "#FF2A85"],
    accent: "#FF2A85",
    textPrimary: "#FFFFFF",
    textSecondary: "#E2C6FF",
  },
  {
    id: "sunset-gold",
    name: "Sunset Vibes",
    bgGradient: ["#3B0D11", "#1A090D", "#FF7B00"],
    accent: "#FFB703",
    textPrimary: "#FFFFFF",
    textSecondary: "#FFD6A5",
  },
  {
    id: "ocean-electric",
    name: "Electric Blue",
    bgGradient: ["#051937", "#0B132B", "#00F5D4"],
    accent: "#00F5D4",
    textPrimary: "#FFFFFF",
    textSecondary: "#A9DEF9",
  },
];

async function loadCanvasImage(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  radius: number
) {
  ctx.save();
  roundRect(ctx, x, y, size, size, radius);
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}

export default function WrappedShareCard({
  metrics,
  selectedYear,
}: WrappedShareCardProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>(THEMES[0]);
  const [customTitle, setCustomTitle] = useState<string>("MI SPOTIFY WRAPPED");
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const yearLabel = selectedYear === "all" ? "HISTÓRICO TOTAL" : `${selectedYear}`;
  const topArtists = metrics.topArtists.slice(0, 5);
  const topTracks = metrics.topTracks.slice(0, 5);

  const handleDownloadPNG = async () => {
    setIsExporting(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Preload live artworks for Top 5 Artists and Top 5 Tracks
      const [artistImages, trackImages] = await Promise.all([
        Promise.all(
          topArtists.map(async (a) => {
            const meta = await fetchArtworkLive(a.artistName, a.topTrack);
            return loadCanvasImage(meta.artworkUrl);
          })
        ),
        Promise.all(
          topTracks.map(async (t) => {
            const meta = await fetchArtworkLive(t.artistName, t.trackName);
            return loadCanvasImage(meta.artworkUrl);
          })
        ),
      ]);

      // 1. Background gradient
      const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
      grad.addColorStop(0, selectedTheme.bgGradient[0]);
      grad.addColorStop(0.65, selectedTheme.bgGradient[1]);
      grad.addColorStop(1, selectedTheme.bgGradient[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Decorative glowing circles
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = selectedTheme.accent;
      ctx.beginPath();
      ctx.arc(950, 220, 340, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(120, 1650, 420, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Header Badge
      ctx.fillStyle = selectedTheme.accent;
      ctx.font = "bold 34px Inter, system-ui, sans-serif";
      ctx.fillText(`● ${customTitle.toUpperCase()}`, 80, 120);

      ctx.fillStyle = selectedTheme.textPrimary;
      ctx.font = "900 86px Inter, system-ui, sans-serif";
      ctx.fillText(yearLabel, 80, 220);

      // Main Hero Box (Total Minutes)
      ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
      roundRect(ctx, 80, 280, 920, 250, 32);
      ctx.fill();

      ctx.fillStyle = selectedTheme.textSecondary;
      ctx.font = "600 32px Inter, system-ui, sans-serif";
      ctx.fillText("TIEMPO DE ESCUCHA", 130, 355);

      ctx.fillStyle = selectedTheme.accent;
      ctx.font = "900 96px Inter, system-ui, sans-serif";
      ctx.fillText(`${metrics.totalMinutes.toLocaleString()} min`, 130, 460);

      ctx.fillStyle = selectedTheme.textPrimary;
      ctx.font = "500 30px Inter, system-ui, sans-serif";
      ctx.fillText(
        `Equivalente a ${metrics.totalHours.toLocaleString()} horas (${metrics.totalDays} días sin parar)`,
        130,
        508
      );

      // Top Artists Box
      ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      roundRect(ctx, 80, 560, 920, 505, 32);
      ctx.fill();

      ctx.fillStyle = selectedTheme.accent;
      ctx.font = "bold 34px Inter, system-ui, sans-serif";
      ctx.fillText("TOP ARTISTAS", 130, 625);

      topArtists.forEach((artist, idx) => {
        const y = 700 + idx * 76;
        ctx.fillStyle = selectedTheme.accent;
        ctx.font = "900 36px Inter, system-ui, sans-serif";
        ctx.fillText(`#${idx + 1}`, 125, y);

        const img = artistImages[idx];
        if (img) {
          drawRoundedImage(ctx, img, 195, y - 46, 60, 14);
        }

        ctx.fillStyle = selectedTheme.textPrimary;
        ctx.font = "bold 36px Inter, system-ui, sans-serif";
        ctx.fillText(truncateText(artist.artistName, 22), 275, y);

        ctx.fillStyle = selectedTheme.textSecondary;
        ctx.font = "500 28px Inter, system-ui, sans-serif";
        const mins = Math.round(artist.totalMs / 60000).toLocaleString();
        ctx.fillText(`${mins} min`, 810, y);
      });

      // Top Tracks Box
      ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      roundRect(ctx, 80, 1095, 920, 505, 32);
      ctx.fill();

      ctx.fillStyle = selectedTheme.accent;
      ctx.font = "bold 34px Inter, system-ui, sans-serif";
      ctx.fillText("TOP CANCIONES", 130, 1160);

      topTracks.forEach((track, idx) => {
        const y = 1235 + idx * 76;
        ctx.fillStyle = selectedTheme.accent;
        ctx.font = "900 36px Inter, system-ui, sans-serif";
        ctx.fillText(`#${idx + 1}`, 125, y);

        const img = trackImages[idx];
        if (img) {
          drawRoundedImage(ctx, img, 195, y - 46, 60, 14);
        }

        ctx.fillStyle = selectedTheme.textPrimary;
        ctx.font = "bold 33px Inter, system-ui, sans-serif";
        ctx.fillText(truncateText(track.trackName, 22), 275, y);

        ctx.fillStyle = selectedTheme.textSecondary;
        ctx.font = "500 28px Inter, system-ui, sans-serif";
        ctx.fillText(`${track.playCount} plays`, 810, y);
      });

      // Listening Personality Footer Card
      ctx.fillStyle = "rgba(255, 255, 255, 0.09)";
      roundRect(ctx, 80, 1630, 920, 175, 28);
      ctx.fill();

      ctx.fillStyle = selectedTheme.textSecondary;
      ctx.font = "600 26px Inter, system-ui, sans-serif";
      ctx.fillText("PERSONALIDAD MUSICAL", 130, 1685);

      ctx.fillStyle = selectedTheme.textPrimary;
      ctx.font = "bold 42px Inter, system-ui, sans-serif";
      ctx.fillText(metrics.listeningPersonality.title, 130, 1740);

      ctx.fillStyle = selectedTheme.accent;
      ctx.font = "500 28px Inter, system-ui, sans-serif";
      ctx.fillText(
        `${metrics.uniqueArtists} artistas · ${metrics.uniqueTracks} canciones únicas · Racha máx: ${metrics.longestStreak.days} días`,
        130,
        1782
      );

      // Footer Branding
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "500 26px Inter, system-ui, sans-serif";
      ctx.fillText("Generado con MusicStats Wrapped (RGPD Privacy Data)", 80, 1865);

      // Trigger download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Spotify-Wrapped-${yearLabel.replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Controls Column */}
      <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Generador de Tarjeta Wrapped
            </h3>
            <p className="text-sm text-zinc-400">
              Personaliza y descarga tu resumen con portadas reales en alta
              resolución (1080×1920) para Instagram Stories, TikTok o WhatsApp.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Palette className="w-4 h-4" /> Tema Visual
          </label>
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                  selectedTheme.id === theme.id
                    ? "border-emerald-500 bg-zinc-800/90 text-white"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full shrink-0 border border-white/20"
                  style={{
                    background: `linear-gradient(135deg, ${theme.bgGradient[0]}, ${theme.accent})`,
                  }}
                />
                <span className="text-sm font-medium truncate">
                  {theme.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Título superior de la tarjeta
          </label>
          <input
            type="text"
            maxLength={28}
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
            placeholder="MI SPOTIFY WRAPPED"
          />
        </div>

        <button
          onClick={handleDownloadPNG}
          disabled={isExporting}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-black bg-emerald-500 hover:bg-emerald-400 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Download className="w-5 h-5" />
          {isExporting
            ? "Renderizando portadas HD..."
            : "Descargar Tarjeta PNG (Stories HD)"}
        </button>

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Live Preview Column */}
      <div className="lg:col-span-7 flex justify-center">
        <div
          className="w-full max-w-[390px] rounded-[32px] p-6 shadow-2xl border border-white/10 relative overflow-hidden transition-all duration-300"
          style={{
            background: `linear-gradient(160deg, ${selectedTheme.bgGradient[0]} 0%, ${selectedTheme.bgGradient[1]} 65%, ${selectedTheme.bgGradient[2]} 100%)`,
          }}
        >
          {/* Header */}
          <div className="space-y-1 mb-5">
            <p
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: selectedTheme.accent }}
            >
              ● {customTitle || "MI SPOTIFY WRAPPED"}
            </p>
            <h2 className="text-3xl font-black text-white tracking-tight">
              {yearLabel}
            </h2>
          </div>

          {/* Total Minutes Hero */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
              Tiempo Total Escuchado
            </p>
            <p
              className="text-3xl font-black mt-0.5"
              style={{ color: selectedTheme.accent }}
            >
              {metrics.totalMinutes.toLocaleString()} min
            </p>
            <p className="text-xs text-white/80 mt-1">
              {metrics.totalHours.toLocaleString()} horas ({metrics.totalDays}{" "}
              días seguidos)
            </p>
          </div>

          {/* Top Artists */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-white/5">
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2.5"
              style={{ color: selectedTheme.accent }}
            >
              Top Artistas
            </p>
            <div className="space-y-2.5">
              {topArtists.map((artist, idx) => (
                <div
                  key={artist.artistName}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span
                      className="font-black text-xs w-5"
                      style={{ color: selectedTheme.accent }}
                    >
                      #{idx + 1}
                    </span>
                    <ArtworkThumb
                      artistName={artist.artistName}
                      trackName={artist.topTrack}
                      size="sm"
                      rounded="md"
                      enablePreview={false}
                    />
                    <span className="font-bold text-white truncate">
                      {artist.artistName}
                    </span>
                  </div>
                  <span className="text-xs text-white/70 shrink-0">
                    {Math.round(artist.totalMs / 60000).toLocaleString()}m
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Songs */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-white/5">
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2.5"
              style={{ color: selectedTheme.accent }}
            >
              Top Canciones
            </p>
            <div className="space-y-2.5">
              {topTracks.map((track, idx) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span
                      className="font-black text-xs w-5"
                      style={{ color: selectedTheme.accent }}
                    >
                      #{idx + 1}
                    </span>
                    <ArtworkThumb
                      artistName={track.artistName}
                      trackName={track.trackName}
                      size="sm"
                      rounded="md"
                      enablePreview={false}
                    />
                    <span className="font-semibold text-white truncate">
                      {track.trackName}
                    </span>
                  </div>
                  <span className="text-xs text-white/70 shrink-0">
                    {track.playCount} plays
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Personality Badge */}
          <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
              Personalidad Musical
            </p>
            <p className="text-sm font-extrabold text-white mt-0.5">
              {metrics.listeningPersonality.title}
            </p>
            <p
              className="text-[11px] font-medium mt-1"
              style={{ color: selectedTheme.accent }}
            >
              {metrics.uniqueArtists} artistas · {metrics.uniqueTracks} temas ·
              Racha: {metrics.longestStreak.days}d
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncateText(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}
