"use client";

import React, { useState } from "react";
import { Upload, FileArchive, Sparkles, ShieldCheck, HelpCircle } from "lucide-react";

interface FileUploaderProps {
  onFilesSelected: (files: FileList) => void;
  onLoadDemo: () => void;
  isLoading: boolean;
  progressText: string;
}

export default function FileUploader({
  onFilesSelected,
  onLoadDemo,
  isLoading,
  progressText,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Dropzone Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-3xl border-2 border-dashed p-10 text-center transition-all ${
          isDragging
            ? "border-emerald-400 bg-emerald-500/10 scale-[1.01]"
            : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
        }`}
      >
        <div className="max-w-md mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            {isLoading ? (
              <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">
              {isLoading
                ? "Procesando tu historial musical..."
                : "Sube tus archivos de Spotify (RGPD)"}
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {isLoading ? (
                <span className="text-emerald-400 font-medium">
                  {progressText}
                </span>
              ) : (
                <>
                  Arrastra aquí tu archivo{" "}
                  <code className="text-emerald-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                    my_spotify_data.zip
                  </code>{" "}
                  o selecciona varios archivos{" "}
                  <code className="text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded">
                    Streaming_History_Audio_*.json
                  </code>{" "}
                  /{" "}
                  <code className="text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded">
                    StreamingHistory_music_*.json
                  </code>
                </>
              )}
            </p>
          </div>

          {!isLoading && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <label className="w-full sm:w-auto cursor-pointer px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                <FileArchive className="w-4 h-4" />
                Seleccionar ZIP o JSONs
                <input
                  type="file"
                  multiple
                  accept=".json,.zip"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files &&
                    e.target.files.length > 0 &&
                    onFilesSelected(e.target.files)
                  }
                />
              </label>

              <button
                onClick={onLoadDemo}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 border border-zinc-700"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Probar con Datos Demo
              </button>
            </div>
          )}

          <div className="pt-3 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              100% Privado: Tus datos se procesan localmente en tu navegador y
              nunca se suben a ningún servidor externo.
            </span>
          </div>
        </div>
      </div>

      {/* How to get your Spotify Data Guide */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          ¿Cómo descargar tu historial completo de Spotify?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400">
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1.5">
            <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">
              Paso 1
            </span>
            <p className="font-semibold text-white text-sm">
              Privacidad de Spotify
            </p>
            <p>
              Entra en{" "}
              <a
                href="https://www.spotify.com/account/privacy/"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 underline hover:text-emerald-300"
              >
                spotify.com/account/privacy
              </a>{" "}
              y baja hasta la sección{" "}
              <strong>“Descargar tus datos”</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1.5">
            <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">
              Paso 2
            </span>
            <p className="font-semibold text-white text-sm">
              Elige Datos de Cuenta o Historial Extendido
            </p>
            <p>
              Puedes pedir <strong>Datos de la cuenta</strong> (último año,
              tarda ~2 días) o el{" "}
              <strong>Historial de reproducción ampliado</strong> (toda tu vida
              en Spotify).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1.5">
            <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">
              Paso 3
            </span>
            <p className="font-semibold text-white text-sm">
              Sube el ZIP directamente
            </p>
            <p>
              Cuando recibas el correo de Spotify con tu{" "}
              <code>my_spotify_data.zip</code>, arrástralo aquí mismo sin
              necesidad de descomprimirlo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

