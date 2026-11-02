"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  ArtworkMetadata,
  fetchArtworkLive,
  getCachedArtworkSync,
} from "@/lib/artwork";
import { Disc3, Play, Square } from "lucide-react";

// Global audio singleton so only one preview plays at a time
let currentAudio: HTMLAudioElement | null = null;
let currentStopCallback: (() => void) | null = null;

export function stopGlobalAudioPreview() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentStopCallback) {
    currentStopCallback();
    currentStopCallback = null;
  }
}

interface ArtworkThumbProps {
  artistName: string;
  trackName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  rounded?: "md" | "xl" | "full";
  enablePreview?: boolean;
  className?: string;
}

export default function ArtworkThumb({
  artistName,
  trackName,
  size = "md",
  rounded = "xl",
  enablePreview = true,
  className = "",
}: ArtworkThumbProps) {
  const [meta, setMeta] = useState<ArtworkMetadata | null>(() =>
    getCachedArtworkSync(artistName, trackName) || null
  );
  const [loading, setLoading] = useState<boolean>(!meta);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    const sync = getCachedArtworkSync(artistName, trackName);
    if (sync !== undefined) {
      setMeta(sync);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchArtworkLive(artistName, trackName).then((res) => {
      if (active) {
        setMeta(res);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [artistName, trackName]);

  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopGlobalAudioPreview();
      }
    };
  }, [isPlaying]);

  const togglePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!meta?.previewUrl) return;

    if (isPlaying) {
      stopGlobalAudioPreview();
      setIsPlaying(false);
      return;
    }

    stopGlobalAudioPreview();
    const audio = new Audio(meta.previewUrl);
    audio.volume = 0.5;
    currentAudio = audio;
    currentStopCallback = () => setIsPlaying(false);

    audio.onended = () => {
      setIsPlaying(false);
      currentAudio = null;
      currentStopCallback = null;
    };

    audio.play().catch(() => {
      setIsPlaying(false);
    });
    setIsPlaying(true);
  };

  const sizeClasses = {
    sm: "w-9 h-9",
    md: "w-11 h-11",
    lg: "w-16 h-16",
    xl: "w-28 h-28",
  }[size];

  const roundedClasses = {
    md: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      ref={containerRef}
      className={`relative shrink-0 overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center group ${sizeClasses} ${roundedClasses} ${className}`}
    >
      {loading ? (
        <div className="w-full h-full bg-zinc-800 animate-pulse flex items-center justify-center">
          <Disc3 className="w-1/2 h-1/2 text-zinc-600 animate-spin" />
        </div>
      ) : meta?.artworkUrl ? (
        <img
          src={meta.artworkUrl}
          alt={trackName || artistName}
          crossOrigin="anonymous"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <Disc3 className="w-1/2 h-1/2 text-zinc-600" />
      )}

      {/* Audio Preview Overlay */}
      {enablePreview && meta?.previewUrl && (
        <button
          type="button"
          onClick={togglePreview}
          title={
            isPlaying
              ? "Detener vista previa"
              : `Escuchar preview de ${trackName || artistName}`
          }
          className={`absolute inset-0 flex items-center justify-center transition-opacity ${
            isPlaying
              ? "bg-black/60 opacity-100"
              : "bg-black/50 opacity-0 group-hover:opacity-100"
          }`}
        >
          {isPlaying ? (
            <Square className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          ) : (
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          )}
        </button>
      )}
    </div>
  );
}

