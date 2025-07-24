export type Playlist = {
  title: string;
  total_tracks: number;
  playlist_id: string;
  url: string;
};

export type Platform = "spotify" | "youtube_music";

export type Step = {
  label: number;
  path: string;
  completed: boolean;
};
export type Steps = Step[];

export type PlaylistConversion = {
  conversion_id: string;
  source_platform: Platform;
  playlist_id: string;
  destination_platform: Platform;
  status: string;
  total_tracks: number;
  playlist_title: string;
};

export type Status = "completed" | "pending" | "failed";
