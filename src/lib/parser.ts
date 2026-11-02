import JSZip from "jszip";
import {
  NormalizedStreamRecord,
  SpotifyBasicRecord,
  SpotifyExtendedRecord,
} from "@/types/spotify";

function isExtendedRecord(item: any): item is SpotifyExtendedRecord {
  return (
    typeof item === "object" &&
    item !== null &&
    "ts" in item &&
    "ms_played" in item
  );
}

function isBasicRecord(item: any): item is SpotifyBasicRecord {
  return (
    typeof item === "object" &&
    item !== null &&
    "endTime" in item &&
    "msPlayed" in item
  );
}

export function normalizeJsonRecords(rawArray: any[]): NormalizedStreamRecord[] {
  const normalized: NormalizedStreamRecord[] = [];

  for (let i = 0; i < rawArray.length; i++) {
    const item = rawArray[i];

    if (isExtendedRecord(item)) {
      // Ignore podcasts/episodes without track names if we want music stats
      const trackName = item.master_metadata_track_name;
      const artistName = item.master_metadata_album_artist_name;
      if (!trackName || !artistName) continue;

      const date = new Date(item.ts);
      if (isNaN(date.getTime())) continue;

      const year = date.getFullYear();
      const monthNum = String(date.getMonth() + 1).padStart(2, "0");
      const dayNum = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${monthNum}-${dayNum}`;
      const month = `${year}-${monthNum}`;

      const skipped =
        item.skipped === true ||
        item.reason_end === "fwdbtn" ||
        (item.ms_played < 30000 && item.reason_end !== "trackdone");

      normalized.push({
        ts: date.getTime(),
        dateStr,
        year,
        month,
        hour: date.getHours(),
        dayOfWeek: date.getDay(),
        trackName,
        artistName,
        albumName: item.master_metadata_album_album_name || "Álbum desconocido",
        msPlayed: item.ms_played || 0,
        skipped,
        shuffle: Boolean(item.shuffle),
        reasonEnd: item.reason_end || "unknown",
        platform: item.platform || "unknown",
        trackUri: item.spotify_track_uri || undefined,
      });
    } else if (isBasicRecord(item)) {
      if (!item.trackName || !item.artistName) continue;
      // Basic record endTime is usually "YYYY-MM-DD HH:mm" in UTC
      const isoStr = item.endTime.includes("T")
        ? item.endTime
        : item.endTime.replace(" ", "T") + ":00Z";
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) continue;

      const year = date.getFullYear();
      const monthNum = String(date.getMonth() + 1).padStart(2, "0");
      const dayNum = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${monthNum}-${dayNum}`;
      const month = `${year}-${monthNum}`;

      normalized.push({
        ts: date.getTime(),
        dateStr,
        year,
        month,
        hour: date.getHours(),
        dayOfWeek: date.getDay(),
        trackName: item.trackName,
        artistName: item.artistName,
        albumName: "Historial Básico",
        msPlayed: item.msPlayed || 0,
        skipped: item.msPlayed < 30000,
        shuffle: false,
        reasonEnd: item.msPlayed >= 30000 ? "trackdone" : "fwdbtn",
        platform: "Spotify App",
      });
    }
  }

  return normalized;
}

export async function parseUploadedFiles(
  files: FileList | File[],
  onProgress?: (msg: string) => void
): Promise<NormalizedStreamRecord[]> {
  const allRecords: NormalizedStreamRecord[] = [];
  const fileArray = Array.from(files);

  for (const file of fileArray) {
    if (file.name.endsWith(".zip")) {
      onProgress?.(`Descomprimiendo archivo ZIP: ${file.name}...`);
      const zip = await JSZip.loadAsync(file);
      const entries = Object.keys(zip.files).filter((name) => {
        const lower = name.toLowerCase();
        return (
          lower.endsWith(".json") &&
          (lower.includes("streaminghistory") ||
            lower.includes("streaming_history_audio") ||
            lower.includes("endsong"))
        );
      });

      // Fallback: if no standard name matched, take all .json files inside the zip
      const targetFiles =
        entries.length > 0
          ? entries
          : Object.keys(zip.files).filter((n) => n.toLowerCase().endsWith(".json"));

      for (const entryName of targetFiles) {
        const zipEntry = zip.files[entryName];
        if (zipEntry.dir) continue;
        onProgress?.(`Procesando ${entryName.split("/").pop()}...`);
        try {
          const text = await zipEntry.async("string");
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            const norm = normalizeJsonRecords(parsed);
            for (let i = 0; i < norm.length; i++) {
              allRecords.push(norm[i]);
            }
          }
        } catch (err) {
          console.warn(`No se pudo parsear ${entryName}:`, err);
        }
      }
    } else if (file.name.endsWith(".json")) {
      onProgress?.(`Leyendo ${file.name}...`);
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          const norm = normalizeJsonRecords(parsed);
          for (let i = 0; i < norm.length; i++) {
            allRecords.push(norm[i]);
          }
        }
      } catch (err) {
        console.warn(`Error leyendo ${file.name}:`, err);
      }
    }
  }

  // Deduplicate exact same timestamp + trackName + msPlayed just in case user uploads overlapping files
  onProgress?.(`Ordenando y limpiando ${allRecords.length.toLocaleString()} registros...`);
  allRecords.sort((a, b) => a.ts - b.ts);

  const deduped: NormalizedStreamRecord[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < allRecords.length; i++) {
    const r = allRecords[i];
    const key = `${r.ts}|${r.trackName}|${r.msPlayed}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }

  return deduped;
}

