import { get, set } from "idb-keyval";

export interface ArtworkMetadata {
  artworkUrl: string | null;
  previewUrl?: string | null;
  storeUrl?: string | null;
  genre?: string | null;
}

const ARTWORK_CACHE_KEY = "spotify_wrapped_artwork_cache_v1";

// In-memory cache synchronized with IndexedDB
const memoryCache = new Map<string, ArtworkMetadata>();
const inFlightRequests = new Map<string, Promise<ArtworkMetadata>>();
let cacheInitialized = false;

async function ensureCacheLoaded() {
  if (cacheInitialized) return;
  cacheInitialized = true;
  try {
    const saved = await get<Record<string, ArtworkMetadata>>(ARTWORK_CACHE_KEY);
    if (saved && typeof saved === "object") {
      Object.entries(saved).forEach(([k, v]) => memoryCache.set(k, v));
    }
  } catch (err) {
    console.warn("No se pudo cargar la caché de portadas:", err);
  }
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
function schedulePersistCache() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      const obj: Record<string, ArtworkMetadata> = {};
      memoryCache.forEach((v, k) => {
        obj[k] = v;
      });
      await set(ARTWORK_CACHE_KEY, obj);
    } catch (err) {
      console.warn("Error guardando caché de portadas:", err);
    }
  }, 1000);
}

// Concurrency queue to avoid hitting public API rate limits
const MAX_CONCURRENT = 4;
let activeCount = 0;
const queue: (() => void)[] = [];

function enqueueTask<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = async () => {
      activeCount++;
      try {
        const res = await task();
        resolve(res);
      } catch (e) {
        reject(e);
      } finally {
        activeCount--;
        const next = queue.shift();
        if (next) next();
      }
    };

    if (activeCount < MAX_CONCURRENT) {
      run();
    } else {
      queue.push(run);
    }
  });
}

export function getCachedArtworkSync(
  artistName: string,
  trackName?: string
): ArtworkMetadata | undefined {
  const key = buildKey(artistName, trackName);
  return memoryCache.get(key);
}

function buildKey(artistName: string, trackName?: string): string {
  return `${artistName.trim().toLowerCase()}___${(trackName || "")
    .trim()
    .toLowerCase()}`;
}

export async function fetchArtworkLive(
  artistName: string,
  trackName?: string
): Promise<ArtworkMetadata> {
  await ensureCacheLoaded();
  const key = buildKey(artistName, trackName);

  const cached = memoryCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const existingPromise = inFlightRequests.get(key);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = enqueueTask(async (): Promise<ArtworkMetadata> => {
    try {
      const searchTerm = trackName
        ? `${artistName} ${trackName}`
        : artistName;
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
        searchTerm
      )}&media=music&entity=song&limit=5`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        // Pick best match where artistName matches closely
        const normArtist = artistName.toLowerCase();
        const bestMatch =
          data.results.find((r: any) =>
            String(r.artistName || "")
              .toLowerCase()
              .includes(normArtist)
          ) || data.results[0];

        const rawArt: string | undefined =
          bestMatch.artworkUrl100 || bestMatch.artworkUrl60;
        const hiResArt = rawArt
          ? rawArt.replace("100x100bb", "600x600bb")
          : null;

        const meta: ArtworkMetadata = {
          artworkUrl: hiResArt,
          previewUrl: bestMatch.previewUrl || null,
          storeUrl: bestMatch.trackViewUrl || bestMatch.artistViewUrl || null,
          genre: bestMatch.primaryGenreName || null,
        };

        memoryCache.set(key, meta);
        schedulePersistCache();
        return meta;
      }

      const emptyMeta: ArtworkMetadata = { artworkUrl: null };
      memoryCache.set(key, emptyMeta);
      schedulePersistCache();
      return emptyMeta;
    } catch {
      return { artworkUrl: null };
    } finally {
      inFlightRequests.delete(key);
    }
  });

  inFlightRequests.set(key, promise);
  return promise;
}

