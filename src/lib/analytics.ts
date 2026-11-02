import {
  AlbumStat,
  ArtistStat,
  DashboardMetrics,
  NormalizedStreamRecord,
  TrackStat,
} from "@/types/spotify";

export interface FilterOptions {
  year?: number | "all";
  minSecondsPlayed?: number; // default 30s for counting a "play", though minutes always sum or filter
  searchQuery?: string;
}

export function calculateMetrics(
  records: NormalizedStreamRecord[],
  options: FilterOptions = {}
): DashboardMetrics {
  const { year = "all", minSecondsPlayed = 30, searchQuery = "" } = options;
  const minMs = minSecondsPlayed * 1000;
  const query = searchQuery.trim().toLowerCase();

  // Extract all available years from full dataset
  const yearsSet = new Set<number>();
  for (let i = 0; i < records.length; i++) {
    yearsSet.add(records[i].year);
  }
  const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

  // Filter records by year and search query
  const filtered = records.filter((r) => {
    if (year !== "all" && r.year !== year) return false;
    if (
      query &&
      !r.trackName.toLowerCase().includes(query) &&
      !r.artistName.toLowerCase().includes(query) &&
      !r.albumName.toLowerCase().includes(query)
    ) {
      return false;
    }
    return true;
  });

  let totalMs = 0;
  let totalValidStreams = 0;
  let skippedCount = 0;
  let shuffleCount = 0;

  const trackMap = new Map<
    string,
    {
      trackName: string;
      artistName: string;
      albumName: string;
      playCount: number;
      totalMs: number;
      skipCount: number;
      firstListen: string;
      lastListen: string;
    }
  >();

  const artistMap = new Map<
    string,
    {
      artistName: string;
      playCount: number;
      totalMs: number;
      skipCount: number;
      tracks: Map<string, number>;
    }
  >();

  const albumMap = new Map<
    string,
    {
      albumName: string;
      artistName: string;
      playCount: number;
      totalMs: number;
    }
  >();

  const hourlyMs = new Array(24).fill(0);
  const weekdayMs = new Array(7).fill(0);
  const monthlyMap = new Map<string, { ms: number; plays: number }>();
  const dailyMap = new Map<string, number>();

  for (let i = 0; i < filtered.length; i++) {
    const r = filtered[i];
    const isValidPlay = r.msPlayed >= minMs;

    totalMs += r.msPlayed;
    if (isValidPlay) totalValidStreams++;
    if (r.skipped) skippedCount++;
    if (r.shuffle) shuffleCount++;

    hourlyMs[r.hour] += r.msPlayed;
    weekdayMs[r.dayOfWeek] += r.msPlayed;

    // Monthly aggregation
    const mEntry = monthlyMap.get(r.month) || { ms: 0, plays: 0 };
    mEntry.ms += r.msPlayed;
    if (isValidPlay) mEntry.plays += 1;
    monthlyMap.set(r.month, mEntry);

    // Daily heatmap aggregation
    dailyMap.set(r.dateStr, (dailyMap.get(r.dateStr) || 0) + r.msPlayed);

    // Track stats
    const trackKey = `${r.trackName}___${r.artistName}`;
    let tStat = trackMap.get(trackKey);
    if (!tStat) {
      tStat = {
        trackName: r.trackName,
        artistName: r.artistName,
        albumName: r.albumName,
        playCount: 0,
        totalMs: 0,
        skipCount: 0,
        firstListen: r.dateStr,
        lastListen: r.dateStr,
      };
      trackMap.set(trackKey, tStat);
    }
    if (isValidPlay) tStat.playCount += 1;
    tStat.totalMs += r.msPlayed;
    if (r.skipped) tStat.skipCount += 1;
    if (r.dateStr < tStat.firstListen) tStat.firstListen = r.dateStr;
    if (r.dateStr > tStat.lastListen) tStat.lastListen = r.dateStr;

    // Artist stats
    let aStat = artistMap.get(r.artistName);
    if (!aStat) {
      aStat = {
        artistName: r.artistName,
        playCount: 0,
        totalMs: 0,
        skipCount: 0,
        tracks: new Map<string, number>(),
      };
      artistMap.set(r.artistName, aStat);
    }
    if (isValidPlay) aStat.playCount += 1;
    aStat.totalMs += r.msPlayed;
    if (r.skipped) aStat.skipCount += 1;
    aStat.tracks.set(r.trackName, (aStat.tracks.get(r.trackName) || 0) + r.msPlayed);

    // Album stats
    if (r.albumName && r.albumName !== "Historial Básico") {
      const albumKey = `${r.albumName}___${r.artistName}`;
      let alStat = albumMap.get(albumKey);
      if (!alStat) {
        alStat = {
          albumName: r.albumName,
          artistName: r.artistName,
          playCount: 0,
          totalMs: 0,
        };
        albumMap.set(albumKey, alStat);
      }
      if (isValidPlay) alStat.playCount += 1;
      alStat.totalMs += r.msPlayed;
    }
  }

  // Convert Maps to sorted Arrays
  const topTracks: TrackStat[] = Array.from(trackMap.entries())
    .map(([id, t]) => {
      const totalAttempts = t.playCount + t.skipCount;
      return {
        id,
        trackName: t.trackName,
        artistName: t.artistName,
        albumName: t.albumName,
        playCount: t.playCount,
        totalMs: t.totalMs,
        skipCount: t.skipCount,
        skipRate: totalAttempts > 0 ? Math.round((t.skipCount / totalAttempts) * 100) : 0,
        firstListen: t.firstListen,
        lastListen: t.lastListen,
      };
    })
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 100);

  const topArtists: ArtistStat[] = Array.from(artistMap.values())
    .map((a) => {
      let topTrack = "";
      let maxTrackMs = -1;
      a.tracks.forEach((ms, name) => {
        if (ms > maxTrackMs) {
          maxTrackMs = ms;
          topTrack = name;
        }
      });
      return {
        artistName: a.artistName,
        playCount: a.playCount,
        totalMs: a.totalMs,
        uniqueTracks: a.tracks.size,
        skipCount: a.skipCount,
        topTrack,
      };
    })
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 100);

  const topAlbums: AlbumStat[] = Array.from(albumMap.values())
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 50);

  const hourlyDistribution = hourlyMs.map((ms) => Math.round(ms / 60000));
  const weekdayDistribution = weekdayMs.map((ms) => Math.round(ms / 60000));

  const monthlyTimeline = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      minutes: Math.round(data.ms / 60000),
      plays: data.plays,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const dailyHeatmap: Record<string, number> = {};
  let peakDay = { date: "-", minutes: 0 };

  const activeDaysSorted = Array.from(dailyMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [date, ms] of activeDaysSorted) {
    const mins = Math.round(ms / 60000);
    dailyHeatmap[date] = mins;
    if (mins > peakDay.minutes) {
      peakDay = { date, minutes: mins };
    }
  }

  // Calculate longest daily listening streak
  let longestStreak = { days: 0, startDate: "-", endDate: "-" };
  let currentStreak = 0;
  let currentStart = "";
  let prevTime = 0;

  for (const [date, ms] of activeDaysSorted) {
    if (ms < 60000) continue; // Require at least 1 minute played that day
    const currTime = new Date(date + "T00:00:00Z").getTime();
    const diffDays = prevTime ? Math.round((currTime - prevTime) / 86400000) : 0;

    if (diffDays === 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
      currentStart = date;
    }
    prevTime = currTime;

    if (currentStreak > longestStreak.days) {
      longestStreak = {
        days: currentStreak,
        startDate: currentStart,
        endDate: date,
      };
    }
  }

  const totalMinutes = Math.round(totalMs / 60000);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const totalDays = Math.round((totalHours / 24) * 10) / 10;

  const overallSkipRate =
    filtered.length > 0 ? Math.round((skippedCount / filtered.length) * 100) : 0;
  const overallShuffleRate =
    filtered.length > 0 ? Math.round((shuffleCount / filtered.length) * 100) : 0;

  // Determine Listening Personality (Wrapped style)
  const nightMinutes =
    hourlyDistribution.slice(0, 5).reduce((a, b) => a + b, 0) +
    hourlyDistribution.slice(22, 24).reduce((a, b) => a + b, 0);
  const isNightOwl = nightMinutes > totalMinutes * 0.3;
  const isExplorer = artistMap.size > totalValidStreams * 0.22;
  const isLoyal =
    topArtists.length > 0 && topArtists[0].totalMs > totalMs * 0.15;

  let personalityTitle = "El Melómano Equilibrado";
  let personalitySubtitle = "Equilibrio perfecto entre clásicos y descubrimientos";
  let personalityDesc =
    "Disfrutas de tus artistas favoritos sin cerrarte a nuevas canciones, manteniendo un ritmo constante durante toda la semana.";

  if (isNightOwl && isLoyal) {
    personalityTitle = "Vampiro de Fidelidad Nocturna";
    personalitySubtitle = "Noches largas con tus artistas de cabecera";
    personalityDesc =
      "Cuando cae la noche tu Spotify cobra vida, repitiendo en bucle esos temas que te sabes de memoria.";
  } else if (isNightOwl) {
    personalityTitle = "Explorador Noctámbulo";
    personalitySubtitle = "La madrugada es tu escenario musical";
    personalityDesc =
      "Tus picos de escucha brillan entre las 22:00 y las 04:00. Mientras el mundo duerme, tú descubres temazos.";
  } else if (isLoyal) {
    personalityTitle = "Devoto Incondicional";
    personalitySubtitle = "Cuando un artista te atrapa, no lo sueltas";
    personalityDesc = `Tu artista #1 concentra una parte enorme de tu tiempo total. La lealtad musical es tu sello de identidad.`;
  } else if (isExplorer) {
    personalityTitle = "Cazador de Novedades";
    personalitySubtitle = "Siempre buscando el próximo sonido";
    personalityDesc =
      "Rara vez te quedas quieto en un mismo álbum. Tu biblioteca es un mapa gigante lleno de artistas distintos.";
  }

  const traits: string[] = [];
  if (overallShuffleRate > 50) traits.push("Amante del Shuffle 🔀");
  else traits.push("Orden de Álbum 💿");

  if (overallSkipRate < 15) traits.push("Paciencia de Oro (Pocos Skips) 🧘");
  else if (overallSkipRate > 35) traits.push("Dedo Rápido (Muchos Skips) ⚡");

  if (isNightOwl) traits.push("Búho Nocturno 🦉");
  else traits.push("Energía Diurna ☀️");

  return {
    totalRecords: filtered.length,
    totalValidStreams,
    totalMinutes,
    totalHours,
    totalDays,
    uniqueArtists: artistMap.size,
    uniqueTracks: trackMap.size,
    uniqueAlbums: albumMap.size,
    overallSkipRate,
    overallShuffleRate,
    availableYears,
    firstDate: filtered.length > 0 ? filtered[0].dateStr : "-",
    lastDate: filtered.length > 0 ? filtered[filtered.length - 1].dateStr : "-",
    topTracks,
    topArtists,
    topAlbums,
    hourlyDistribution,
    weekdayDistribution,
    monthlyTimeline,
    dailyHeatmap,
    listeningPersonality: {
      title: personalityTitle,
      subtitle: personalitySubtitle,
      description: personalityDesc,
      traits,
    },
    peakDay,
    longestStreak,
  };
}

