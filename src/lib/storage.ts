import { get, set, del } from "idb-keyval";
import { NormalizedStreamRecord } from "@/types/spotify";

const STORAGE_KEY = "spotify_wrapped_records_v1";

export async function saveRecordsToStorage(
  records: NormalizedStreamRecord[]
): Promise<void> {
  try {
    await set(STORAGE_KEY, records);
  } catch (err) {
    console.error("Error guardando historial en IndexedDB:", err);
  }
}

export async function loadRecordsFromStorage(): Promise<
  NormalizedStreamRecord[] | null
> {
  try {
    const data = await get<NormalizedStreamRecord[]>(STORAGE_KEY);
    return data && Array.isArray(data) && data.length > 0 ? data : null;
  } catch (err) {
    console.error("Error leyendo historial desde IndexedDB:", err);
    return null;
  }
}

export async function clearRecordsFromStorage(): Promise<void> {
  try {
    await del(STORAGE_KEY);
  } catch (err) {
    console.error("Error borrando IndexedDB:", err);
  }
}

