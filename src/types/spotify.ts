// Extended Streaming History (endsong_*.json / Streaming_History_Audio_*.json)
export interface SpotifyExtendedRecord {
  ts: string; // e.g., "2026-03-14T18:22:10Z"
  username?: string;
  platform?: string;
  ms_played: number;
  conn_country?: string;
  ip_addr_decrypted?: string;
  user_agent_decrypted?: string;
  master_metadata_track_name: string | null;
  master_metadata_album_artist_name: string | null;
  master_metadata_album_album_name?: string | null;
  spotify_track_uri?: string | null;
  episode_name?: string | null;
  episode_show_name?: string | null;
  spotify_episode_uri?: string | null;
  reason_start?: string;
  reason_end?: string;
  shuffle?: boolean;
  skipped?: boolean | null;
  offline?: boolean;
  offline_timestamp?: number;
  incognito_mode?: boolean;
}

// Basic Account Data (StreamingHistory_music_*.json)
export interface SpotifyBasicRecord {
  endTime: string; // e.g., "2026-03-14 18:22"
  artistName: string;
  trackName: string;
  msPlayed: number;
}

// Normalized internal record for super-fast in-memory filtering & stats
export interface NormalizedStreamRecord {
  ts: number; // Unix timestamp in ms
  dateStr: string; // YYYY-MM-DD
  year: number;
  month: string; // YYYY-MM
  hour: number; // 0-23
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  trackName: string;
  artistName: string;
  albumName: string;
  msPlayed: number;
  skipped: boolean;
  shuffle: boolean;
  reasonEnd: string;
  platform: string;
  trackUri?: string;
}

export interface TrackStat {
  id: string; // trackName + artistName
  trackName: string;
  artistName: string;
  albumName: string;
  playCount: number;
  totalMs: number;
  skipCount: number;
  skipRate: number;
  firstListen: string;
  lastListen: string;
}

export interface ArtistStat {
  artistName: string;
  playCount: number;
  totalMs: number;
  uniqueTracks: number;
  skipCount: number;
  topTrack: string;
}

export interface AlbumStat {
  albumName: string;
  artistName: string;
  playCount: number;
  totalMs: number;
}

export interface DashboardMetrics {
  totalRecords: number;
  totalValidStreams: number; // streams >= 30s
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
  uniqueArtists: number;
  uniqueTracks: number;
  uniqueAlbums: number;
  overallSkipRate: number;
  overallShuffleRate: number;
  availableYears: number[];
  firstDate: string;
  lastDate: string;
  topTracks: TrackStat[];
  topArtists: ArtistStat[];
  topAlbums: AlbumStat[];
  hourlyDistribution: number[]; // 24 hours (minutes played)
  weekdayDistribution: number[]; // 7 days (minutes played)
  monthlyTimeline: { month: string; minutes: number; plays: number }[];
  dailyHeatmap: Record<string, number>; // YYYY-MM-DD -> minutes
  listeningPersonality: {
    title: string;
    subtitle: string;
    description: string;
    traits: string[];
  };
  peakDay: {
    date: string;
    minutes: number;
  };
  longestStreak: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

