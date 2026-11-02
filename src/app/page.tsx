"use client";

import React, { useState, useEffect, useMemo } from "react";
import { NormalizedStreamRecord } from "@/types/spotify";
import { parseUploadedFiles } from "@/lib/parser";
import { calculateMetrics } from "@/lib/analytics";
import {
  saveRecordsToStorage,
  loadRecordsFromStorage,
  clearRecordsFromStorage,
} from "@/lib/storage";
import { generateDemoDataset } from "@/lib/demoData";
import FileUploader from "@/components/FileUploader";
import ActivityCharts from "@/components/ActivityCharts";
import WrappedShareCard from "@/components/WrappedShareCard";
import WrappedStoryModal from "@/components/WrappedStoryModal";
import ArtworkThumb, { stopGlobalAudioPreview } from "@/components/ArtworkThumb";
import {
  Disc3,
  Clock,
  Music2,
  Users,
  Sparkles,
  Play,
  Trash2,
  Search,
  Shuffle,
  SkipForward,
  Upload,
  Award,
  BarChart3,
  Share2,
  Flame,
  Album,
} from "lucide-react";

type ActiveTab =
  | "overview"
  | "tracks"
  | "artists"
  | "albums"
  | "activity"
  | "share";

export default function HomePage() {
  const [records, setRecords] = useState<NormalizedStreamRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progressText, setProgressText] = useState<string>(
    "Cargando datos guardados..."
  );

  // Filters
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [showStoryModal, setShowStoryModal] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Load saved records from IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await loadRecordsFromStorage();
        if (mounted && stored && stored.length > 0) {
          setRecords(stored);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
      stopGlobalAudioPreview();
    };
  }, []);

  const handleFilesSelected = async (files: FileList) => {
    setIsLoading(true);
    setProgressText("Iniciando lectura de archivos...");
    try {
      const parsed = await parseUploadedFiles(files, (msg) =>
        setProgressText(msg)
      );
      if (parsed.length === 0) {
        alert(
          "No se encontraron registros válidos de Spotify en los archivos seleccionados. Asegúrate de subir StreamingHistory_music_*.json, endsong_*.json o el archivo ZIP de Spotify."
        );
        return;
      }
      setProgressText("Guardando en memoria local del navegador (IndexedDB)...");
      await saveRecordsToStorage(parsed);
      setRecords(parsed);
      setIsDemoMode(false);
      setSelectedYear("all");
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al procesar los archivos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    setIsLoading(true);
    setProgressText("Generando historial de demostración...");
    setTimeout(() => {
      const demo = generateDemoDataset();
      setRecords(demo);
      setIsDemoMode(true);
      setSelectedYear("all");
      setIsLoading(false);
    }, 250);
  };

  const handleClearData = async () => {
    if (
      !confirm(
        "¿Quieres borrar los datos cargados actualmente de tu navegador?"
      )
    )
      return;
    stopGlobalAudioPreview();
    await clearRecordsFromStorage();
    setRecords([]);
    setIsDemoMode(false);
  };

  const metrics = useMemo(() => {
    return calculateMetrics(records, {
      year: selectedYear,
      minSecondsPlayed: 30,
      searchQuery,
    });
  }, [records, selectedYear, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
              <Disc3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">
                  MusicStats
                </span>
                <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Wrapped RGPD
                </span>
                {isDemoMode && (
                  <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Modo Demo
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Analítica exacta de Spotify con portadas y previews en vivo
              </p>
            </div>
          </div>

          {records.length > 0 && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowStoryModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Ver Presentación Wrapped</span>
              </button>

              <label
                className="cursor-pointer p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
                title="Subir más archivos"
              >
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  multiple
                  accept=".json,.zip"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files &&
                    e.target.files.length > 0 &&
                    handleFilesSelected(e.target.files)
                  }
                />
              </label>

              <button
                onClick={handleClearData}
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border border-zinc-800 transition"
                title="Borrar datos guardados"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {records.length === 0 ? (
          <div className="py-6 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Tu <span className="text-emerald-400">Spotify Wrapped</span> en
                cualquier momento del año.
              </h1>
              <p className="text-zinc-400 text-sm sm:text-base">
                Calcula exactamente tus minutos escuchados, tus canciones y
                artistas más reproducidos, con búsqueda de portadas de álbumes y
                previews de audio en vivo.
              </p>
            </div>

            <FileUploader
              onFilesSelected={handleFilesSelected}
              onLoadDemo={handleLoadDemo}
              isLoading={isLoading}
              progressText={progressText}
            />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Year Filter Pills & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/70 border border-zinc-800/80 p-4 rounded-2xl">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mr-1 shrink-0">
                  Periodo:
                </span>
                <button
                  onClick={() => setSelectedYear("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    selectedYear === "all"
                      ? "bg-emerald-500 text-black shadow"
                      : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  Histórico Completo
                </button>
                {metrics.availableYears.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      selectedYear === yr
                        ? "bg-emerald-500 text-black shadow"
                        : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar artista, canción o álbum..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Primary KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Tiempo Escuchado
                  </span>
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {metrics.totalMinutes.toLocaleString()}{" "}
                  <span className="text-sm font-semibold text-emerald-400">
                    min
                  </span>
                </p>
                <p className="text-xs text-zinc-400">
                  {metrics.totalHours.toLocaleString()} horas ·{" "}
                  {metrics.totalDays} días continuos
                </p>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Reproducciones
                  </span>
                  <Music2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {metrics.totalValidStreams.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-400">
                  {metrics.uniqueTracks.toLocaleString()} canciones diferentes
                </p>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Artistas & Álbumes
                  </span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {metrics.uniqueArtists.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-400">
                  {metrics.uniqueAlbums.toLocaleString()} álbumes explorados
                </p>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Hábitos & Racha
                  </span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {metrics.longestStreak.days}{" "}
                  <span className="text-sm font-semibold text-amber-400">
                    días seguidos
                  </span>
                </p>
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <SkipForward className="w-3.5 h-3.5 text-zinc-500" />
                    {metrics.overallSkipRate}% skips
                  </span>
                  <span className="flex items-center gap-1">
                    <Shuffle className="w-3.5 h-3.5 text-zinc-500" />
                    {metrics.overallShuffleRate}% shuffle
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
              {[
                { id: "overview", label: "Resumen Wrapped", icon: Sparkles },
                { id: "artists", label: "Top Artistas", icon: Award },
                { id: "tracks", label: "Top Canciones", icon: Music2 },
                { id: "albums", label: "Top Álbumes", icon: Album },
                { id: "activity", label: "Horarios y Gráficos", icon: BarChart3 },
                {
                  id: "share",
                  label: "Tarjeta Compartible (PNG)",
                  icon: Share2,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 shrink-0 ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Views */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-fadeIn">
                {/* Listening Personality Banner */}
                <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-950/90 via-zinc-900 to-teal-950/80 border border-emerald-500/25 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                      ● Tu Arquetipo de Spotify Wrapped
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      {metrics.listeningPersonality.title}
                    </h2>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {metrics.listeningPersonality.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {metrics.listeningPersonality.traits.map((t) => (
                      <span
                        key={t}
                        className="px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-emerald-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Top 10 Artists & Top 10 Songs Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top 10 Artists */}
                  <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                          <Award className="w-5 h-5 text-emerald-400" />
                          Top 10 Artistas
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Pasa el ratón por la portada para escuchar un preview
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("artists")}
                        className="text-xs font-semibold text-emerald-400 hover:underline"
                      >
                        Ver Top 100 →
                      </button>
                    </div>
                    <div className="space-y-3.5">
                      {metrics.topArtists.slice(0, 10).map((artist, idx) => {
                        const maxArtistMs =
                          metrics.topArtists[0]?.totalMs || 1;
                        const barWidth = Math.max(
                          (artist.totalMs / maxArtistMs) * 100,
                          4
                        );
                        return (
                          <div
                            key={artist.artistName}
                            className="flex items-center gap-3.5"
                          >
                            <span className="w-6 text-xs font-black text-emerald-400 shrink-0">
                              #{idx + 1}
                            </span>
                            <ArtworkThumb
                              artistName={artist.artistName}
                              trackName={artist.topTrack}
                              size="md"
                              rounded="xl"
                            />
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center justify-between text-sm gap-2">
                                <span className="font-bold text-white truncate">
                                  {artist.artistName}
                                </span>
                                <span className="text-xs text-zinc-400 shrink-0">
                                  <strong className="text-zinc-200">
                                    {Math.round(
                                      artist.totalMs / 60000
                                    ).toLocaleString()}{" "}
                                    min
                                  </strong>{" "}
                                  ({artist.playCount} plays)
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top 10 Songs */}
                  <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                          <Music2 className="w-5 h-5 text-emerald-400" />
                          Top 10 Canciones
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Portadas en vivo + preview de 30s al pulsar Play
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("tracks")}
                        className="text-xs font-semibold text-emerald-400 hover:underline"
                      >
                        Ver Top 100 →
                      </button>
                    </div>
                    <div className="space-y-3.5">
                      {metrics.topTracks.slice(0, 10).map((track, idx) => {
                        const maxTrackMs = metrics.topTracks[0]?.totalMs || 1;
                        const barWidth = Math.max(
                          (track.totalMs / maxTrackMs) * 100,
                          4
                        );
                        return (
                          <div
                            key={track.id}
                            className="flex items-center gap-3.5"
                          >
                            <span className="w-6 text-xs font-black text-emerald-400 shrink-0">
                              #{idx + 1}
                            </span>
                            <ArtworkThumb
                              artistName={track.artistName}
                              trackName={track.trackName}
                              size="md"
                              rounded="xl"
                            />
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center justify-between text-sm gap-2">
                                <div className="truncate">
                                  <span className="font-bold text-white">
                                    {track.trackName}
                                  </span>
                                  <span className="text-xs text-zinc-400 ml-1.5">
                                    · {track.artistName}
                                  </span>
                                </div>
                                <span className="text-xs text-zinc-400 shrink-0">
                                  <strong className="text-zinc-200">
                                    {track.playCount} plays
                                  </strong>{" "}
                                  ({Math.round(track.totalMs / 60000)}m)
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-teal-400 rounded-full"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Activity Charts directly visible in overview too */}
                <ActivityCharts metrics={metrics} />
              </div>
            )}

            {activeTab === "artists" && (
              <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl overflow-hidden animate-fadeIn">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-white">
                      Ranking Completo de Artistas (Top 100)
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Ordenado por minutos exactos reproducidos · Haz clic en la
                      portada para escuchar su canción #1
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-400 bg-zinc-950/50">
                        <th className="py-3.5 px-4 w-16">#</th>
                        <th className="py-3.5 px-4">Artista</th>
                        <th className="py-3.5 px-4">Minutos</th>
                        <th className="py-3.5 px-4">Plays (&ge;30s)</th>
                        <th className="py-3.5 px-4">Canciones Únicas</th>
                        <th className="py-3.5 px-4">Canción #1</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {metrics.topArtists.map((artist, idx) => (
                        <tr
                          key={artist.artistName}
                          className="hover:bg-zinc-800/40 transition"
                        >
                          <td className="py-3 px-4 font-black text-emerald-400">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <ArtworkThumb
                                artistName={artist.artistName}
                                trackName={artist.topTrack}
                                size="sm"
                                rounded="md"
                              />
                              <span className="font-bold text-white">
                                {artist.artistName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-zinc-200">
                            {Math.round(artist.totalMs / 60000).toLocaleString()}{" "}
                            min
                          </td>
                          <td className="py-3 px-4 text-zinc-300">
                            {artist.playCount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-zinc-400">
                            {artist.uniqueTracks} temas
                          </td>
                          <td className="py-3 px-4 text-zinc-300 truncate max-w-[240px]">
                            {artist.topTrack}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "tracks" && (
              <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl overflow-hidden animate-fadeIn">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-white">
                      Ranking Completo de Canciones (Top 100)
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Portadas de álbum en vivo, conteo exacto de reproducciones
                      y preview de audio al pulsar la carátula
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-400 bg-zinc-950/50">
                        <th className="py-3.5 px-4 w-16">#</th>
                        <th className="py-3.5 px-4">Canción</th>
                        <th className="py-3.5 px-4">Artista</th>
                        <th className="py-3.5 px-4">Álbum</th>
                        <th className="py-3.5 px-4">Plays</th>
                        <th className="py-3.5 px-4">Minutos</th>
                        <th className="py-3.5 px-4">% Skip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {metrics.topTracks.map((track, idx) => (
                        <tr
                          key={track.id}
                          className="hover:bg-zinc-800/40 transition"
                        >
                          <td className="py-3 px-4 font-black text-emerald-400">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <ArtworkThumb
                                artistName={track.artistName}
                                trackName={track.trackName}
                                size="sm"
                                rounded="md"
                              />
                              <span className="font-bold text-white">
                                {track.trackName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-zinc-300">
                            {track.artistName}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 truncate max-w-[200px]">
                            {track.albumName}
                          </td>
                          <td className="py-3 px-4 font-semibold text-emerald-400">
                            {track.playCount.toLocaleString()}x
                          </td>
                          <td className="py-3 px-4 text-zinc-200">
                            {Math.round(track.totalMs / 60000).toLocaleString()}{" "}
                            min
                          </td>
                          <td className="py-3 px-4 text-zinc-400">
                            {track.skipRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "albums" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-white">
                      Galería de Álbumes Más Escuchados
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Portadas obtenidas en tiempo real y almacenadas en caché
                      local
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {metrics.topAlbums.map((album, idx) => (
                    <div
                      key={`${album.albumName}-${album.artistName}`}
                      className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 flex flex-col gap-3 hover:border-zinc-700 transition"
                    >
                      <div className="relative mx-auto">
                        <ArtworkThumb
                          artistName={album.artistName}
                          trackName={album.albumName}
                          size="xl"
                          rounded="xl"
                          className="w-36 h-36 shadow-lg"
                        />
                        <span className="absolute -top-2 -left-2 px-2 py-0.5 rounded-lg bg-emerald-500 text-black font-black text-xs shadow">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="space-y-1 text-center">
                        <p className="font-bold text-sm text-white truncate">
                          {album.albumName}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">
                          {album.artistName}
                        </p>
                        <p className="text-xs font-semibold text-emerald-400 pt-1">
                          {Math.round(album.totalMs / 60000).toLocaleString()}{" "}
                          min · {album.playCount} plays
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="animate-fadeIn">
                <ActivityCharts metrics={metrics} />
              </div>
            )}

            {activeTab === "share" && (
              <div className="animate-fadeIn">
                <WrappedShareCard
                  metrics={metrics}
                  selectedYear={selectedYear}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Wrapped Interactive Story Modal */}
      {showStoryModal && (
        <WrappedStoryModal
          metrics={metrics}
          selectedYear={selectedYear}
          onClose={() => setShowStoryModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
        MusicStats Wrapped · Procesamiento local en navegador (100% Privado
        RGPD) · Portadas y Previews en vivo
      </footer>
    </div>
  );
}
