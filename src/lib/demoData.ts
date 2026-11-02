import { NormalizedStreamRecord } from "@/types/spotify";
import { normalizeJsonRecords } from "./parser";

const DEMO_CATALOG = [
  {
    artist: "Bad Bunny",
    album: "Un Verano Sin Ti",
    tracks: [
      { name: "Tití Me Preguntó", duration: 243000 },
      { name: "Moscow Mule", duration: 245000 },
      { name: "Ojitos Lindos", duration: 258000 },
      { name: "Efecto", duration: 213000 },
      { name: "Me Porto Bonito", duration: 178000 },
    ],
    weight: 18,
  },
  {
    artist: "The Weeknd",
    album: "After Hours",
    tracks: [
      { name: "Blinding Lights", duration: 200000 },
      { name: "Save Your Tears", duration: 215000 },
      { name: "Starboy", duration: 230000 },
      { name: "After Hours", duration: 361000 },
    ],
    weight: 15,
  },
  {
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    tracks: [
      { name: "Levitating", duration: 203000 },
      { name: "Don't Start Now", duration: 183000 },
      { name: "Physical", duration: 193000 },
      { name: "Houdini", duration: 185000 },
    ],
    weight: 13,
  },
  {
    artist: "Rosalía",
    album: "MOTOMAMI",
    tracks: [
      { name: "DESPECHÁ", duration: 157000 },
      { name: "SAOKO", duration: 137000 },
      { name: "BIZCOCHITO", duration: 109000 },
      { name: "CANDY", duration: 193000 },
    ],
    weight: 12,
  },
  {
    artist: "Daft Punk",
    album: "Random Access Memories",
    tracks: [
      { name: "Instant Crush (feat. Julian Casablancas)", duration: 337000 },
      { name: "Get Lucky", duration: 369000 },
      { name: "One More Time", duration: 320000 },
      { name: "Veridis Quo", duration: 345000 },
    ],
    weight: 11,
  },
  {
    artist: "Arctic Monkeys",
    album: "AM",
    tracks: [
      { name: "Do I Wanna Know?", duration: 272000 },
      { name: "505", duration: 253000 },
      { name: "R U Mine?", duration: 201000 },
      { name: "Why'd You Only Call Me When You're High?", duration: 161000 },
    ],
    weight: 10,
  },
  {
    artist: "Taylor Swift",
    album: "Midnights",
    tracks: [
      { name: "Anti-Hero", duration: 200000 },
      { name: "Cruel Summer", duration: 178000 },
      { name: "Karma", duration: 204000 },
    ],
    weight: 9,
  },
  {
    artist: "Quevedo",
    album: "DONDE QUIERO ESTAR",
    tracks: [
      { name: "Quevedo: Bzrp Music Sessions, Vol. 52", duration: 198000 },
      { name: "Columbia", duration: 186000 },
      { name: "Vista Al Mar", duration: 180000 },
    ],
    weight: 8,
  },
  {
    artist: "Tame Impala",
    album: "Currents",
    tracks: [
      { name: "The Less I Know The Better", duration: 216000 },
      { name: "Let It Happen", duration: 467000 },
      { name: "Borderline", duration: 237000 },
    ],
    weight: 7,
  },
  {
    artist: "Karol G",
    album: "MAÑANA SERÁ BONITO",
    tracks: [
      { name: "TQG", duration: 197000 },
      { name: "PROVENZA", duration: 210000 },
      { name: "QLONA", duration: 172000 },
    ],
    weight: 7,
  },
];

export function generateDemoDataset(): NormalizedStreamRecord[] {
  const rawRecords = [];
  const startTimestamp = new Date("2025-01-01T08:00:00Z").getTime();
  const endTimestamp = new Date("2026-10-30T23:00:00Z").getTime();

  // Weighted pool of artists
  const pool: typeof DEMO_CATALOG = [];
  for (const item of DEMO_CATALOG) {
    for (let i = 0; i < item.weight; i++) {
      pool.push(item);
    }
  }

  // Deterministic pseudo-random helper
  let seed = 421337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  let cursor = startTimestamp;
  while (cursor < endTimestamp) {
    const d = new Date(cursor);
    const hour = d.getUTCHours();

    // Realistic listening probability by hour (more active afternoon/evening)
    let sessionChance = 0.08;
    if (hour >= 17 && hour <= 23) sessionChance = 0.35;
    else if (hour >= 9 && hour <= 16) sessionChance = 0.2;
    else if (hour >= 2 && hour <= 6) sessionChance = 0.02;

    if (rand() < sessionChance) {
      // Listen to 3 - 12 tracks in a session
      const sessionLength = 3 + Math.floor(rand() * 9);
      for (let s = 0; s < sessionLength; s++) {
        const artistObj = pool[Math.floor(rand() * pool.length)];
        const trackObj =
          artistObj.tracks[Math.floor(rand() * artistObj.tracks.length)];

        const isSkip = rand() < 0.14;
        const msPlayed = isSkip
          ? Math.floor(5000 + rand() * 20000)
          : trackObj.duration;

        cursor += msPlayed + 2000;
        rawRecords.push({
          ts: new Date(cursor).toISOString(),
          master_metadata_track_name: trackObj.name,
          master_metadata_album_artist_name: artistObj.artist,
          master_metadata_album_album_name: artistObj.album,
          ms_played: msPlayed,
          reason_end: isSkip ? "fwdbtn" : "trackdone",
          shuffle: rand() < 0.62,
          skipped: isSkip,
          platform: "iOS / Desktop App",
        });
      }
    }

    // Jump 45 - 120 minutes forward
    cursor += Math.floor((45 + rand() * 75) * 60000);
  }

  return normalizeJsonRecords(rawRecords);
}

