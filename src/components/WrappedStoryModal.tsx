"use client";

import React, { useState, useEffect } from "react";
import { DashboardMetrics } from "@/types/spotify";
import ArtworkThumb, { stopGlobalAudioPreview } from "@/components/ArtworkThumb";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Volume2,
  Clock,
  Award,
  Music,
  Flame,
} from "lucide-react";

interface WrappedStoryModalProps {
  metrics: DashboardMetrics;
  selectedYear: number | "all";
  onClose: () => void;
}

export default function WrappedStoryModal({
  metrics,
  selectedYear,
  onClose,
}: WrappedStoryModalProps) {
  const [slide, setSlide] = useState(0);
  const totalSlides = 5;
  const yearLabel =
    selectedYear === "all" ? "Toda tu Historia" : `Tu ${selectedYear}`;

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
    }, 7000);
    return () => clearInterval(timer);
  }, [slide]);

  useEffect(() => {
    return () => {
      stopGlobalAudioPreview();
    };
  }, []);

  const nextSlide = () => {
    if (slide < totalSlides - 1) setSlide(slide + 1);
    else onClose();
  };

  const prevSlide = () => {
    if (slide > 0) setSlide(slide - 1);
  };

  const topArtist = metrics.topArtists[0];
  const topTrack = metrics.topTracks[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-[420px] h-[min(740px,92vh)] rounded-[36px] overflow-hidden shadow-2xl border border-white/15 flex flex-col justify-between select-none">
        {/* Progress Bars */}
        <div className=" shrink-0 pt-4 px-5 z-20 flex gap-1.5">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div
              key={idx}
              className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden"
            >
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  idx < slide
                    ? "w-full"
                    : idx === slide
                    ? "w-full animate-pulse"
                    : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Top Bar */}
        <div className="relative z-20 shrink-0 pt-3 px-6 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-white/80 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            Spotify Wrapped · {yearLabel}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/40 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Content */}
        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto flex flex-col justify-center px-6 sm:px-7 py-2 text-white">
          {slide === 0 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Clock className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">
                La banda sonora de tu vida
              </p>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight">
                Has escuchado{" "}
                <span className="text-emerald-400">
                  {metrics.totalMinutes.toLocaleString()}
                </span>{" "}
                minutos de música.
              </h2>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                Eso equivale a{" "}
                <strong className="text-white">
                  {metrics.totalHours.toLocaleString()} horas
                </strong>{" "}
                o{" "}
                <strong className="text-white">
                  {metrics.totalDays} días completos
                </strong>{" "}
                sin apagar los auriculares.
              </p>
              {metrics.peakDay.minutes > 0 && (
                <div className="p-4 rounded-2xl bg-white/10 border border-white/10 text-xs space-y-1">
                  <p className="text-white/60 uppercase font-semibold">
                    Tu día más intenso
                  </p>
                  <p className="text-base font-bold text-white">
                    {metrics.peakDay.date} — {metrics.peakDay.minutes} minutos
                  </p>
                </div>
              )}
            </div>
          )}

          {slide === 1 && topArtist && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-4">
                <ArtworkThumb
                  artistName={topArtist.artistName}
                  trackName={topArtist.topTrack}
                  size="xl"
                  rounded="xl"
                  className="shadow-2xl border-2 border-fuchsia-400/40"
                />
                <div className="p-2.5 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-300">
                  <Award className="w-7 h-7" />
                </div>
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-fuchsia-300">
                Tu Artista #1
              </p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-white">
                {topArtist.artistName}
              </h2>
              <p className="text-sm text-white/80">
                Compartisteis{" "}
                <strong className="text-fuchsia-300">
                  {Math.round(topArtist.totalMs / 60000).toLocaleString()}{" "}
                  minutos
                </strong>{" "}
                juntos ({topArtist.playCount.toLocaleString()} reproducciones y{" "}
                {topArtist.uniqueTracks} canciones distintas).
              </p>
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                <p className="text-xs text-white/60 uppercase font-semibold">
                  Tu tema favorito suyo (Pulsa la portada para oír)
                </p>
                <p className="text-base font-bold text-white mt-0.5 truncate">
                  “{topArtist.topTrack}”
                </p>
              </div>
            </div>
          )}

          {slide === 2 && topTrack && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-4">
                <ArtworkThumb
                  artistName={topTrack.artistName}
                  trackName={topTrack.trackName}
                  size="xl"
                  rounded="xl"
                  className="shadow-2xl border-2 border-amber-400/40"
                />
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300">
                  <Music className="w-7 h-7" />
                </div>
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-amber-300">
                En bucle infinito
              </p>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight line-clamp-2">
                “{topTrack.trackName}”
              </h2>
              <p className="text-sm sm:text-base font-semibold text-white/80 truncate">
                de {topTrack.artistName} ·{" "}
                <span className="text-white/60">{topTrack.albumName}</span>
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                  <p className="text-xs text-white/60 uppercase">Veces</p>
                  <p className="text-2xl font-black text-amber-300">
                    {topTrack.playCount}x
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                  <p className="text-xs text-white/60 uppercase">Minutos</p>
                  <p className="text-2xl font-black text-amber-300">
                    {Math.round(topTrack.totalMs / 60000)}m
                  </p>
                </div>
              </div>
            </div>
          )}

          {slide === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                <Flame className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
                Tu Personalidad Musical
              </p>
              <h2 className="text-3xl font-black leading-tight text-white">
                {metrics.listeningPersonality.title}
              </h2>
              <p className="text-sm text-white/80 leading-relaxed">
                {metrics.listeningPersonality.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {metrics.listeningPersonality.traits.map((trait) => (
                  <span
                    key={trait}
                    className="px-3 py-1.5 rounded-full bg-white/15 text-xs font-bold text-white"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}

          {slide === 4 && (
            <div className="space-y-2.5 animate-fadeIn">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  Resumen Final · {yearLabel}
                </p>
                <h2 className="text-2xl font-black text-white leading-tight">
                  Tu Pódium Musical
                </h2>
              </div>

              <div className="space-y-1.5 bg-white/10 p-3 rounded-2xl border border-white/10">
                <p className="text-[11px] font-bold uppercase text-emerald-400 mb-1">
                  Top 5 Artistas
                </p>
                {metrics.topArtists.slice(0, 5).map((a, i) => (
                  <div
                    key={a.artistName}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <ArtworkThumb
                        artistName={a.artistName}
                        trackName={a.topTrack}
                        size="xs"
                        rounded="md"
                        enablePreview={false}
                      />
                      <span className="font-bold truncate">
                        {i + 1}. {a.artistName}
                      </span>
                    </div>
                    <span className="text-white/70 shrink-0">
                      {Math.round(a.totalMs / 60000)}m
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 bg-white/10 p-3 rounded-2xl border border-white/10">
                <p className="text-[11px] font-bold uppercase text-emerald-400 mb-1">
                  Top 5 Canciones
                </p>
                {metrics.topTracks.slice(0, 5).map((t, i) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <ArtworkThumb
                        artistName={t.artistName}
                        trackName={t.trackName}
                        size="xs"
                        rounded="md"
                        enablePreview={false}
                      />
                      <span className="font-bold truncate">
                        {i + 1}. {t.trackName}
                      </span>
                    </div>
                    <span className="text-white/70 shrink-0">
                      {t.playCount}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Background per slide */}
        <div
          className="absolute inset-0 -z-0 transition-colors duration-700"
          style={{
            background:
              slide === 0
                ? "linear-gradient(155deg, #062c19 0%, #0d131a 65%, #1db954 100%)"
                : slide === 1
                ? "linear-gradient(155deg, #3b0764 0%, #11071f 65%, #d946ef 100%)"
                : slide === 2
                ? "linear-gradient(155deg, #451a03 0%, #170d06 65%, #f59e0b 100%)"
                : slide === 3
                ? "linear-gradient(155deg, #083344 0%, #091526 65%, #06b6d4 100%)"
                : "linear-gradient(155deg, #0f291e 0%, #121212 60%, #10b981 100%)",
          }}
        />

        {/* Navigation Controls */}
        <div className="relative z-20 shrink-0 px-6 py-4 flex items-center justify-between">
          <button
            onClick={prevSlide}
            disabled={slide === 0}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-white/60">
            {slide + 1} / {totalSlides}
          </span>
          <button
            onClick={nextSlide}
            className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition flex items-center gap-1 shadow-lg"
          >
            {slide === totalSlides - 1 ? "Finalizar" : "Siguiente"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
