import { Platform } from "@/types";

/**
 * Shapes returned by the guest (logged-out) endpoints.
 *
 *   GET  /api/guest/loadplaylist?playlist_url=...  -> GuestLoadPlaylistResponse
 *   POST /api/guest/convert                        -> GuestConvertResponse
 *   GET  /api/guest/conversion-status/:id          -> GuestConversionStatusResponse
 *   GET  /api/guest/conversions                    -> GuestConversionsResponse
 *   POST /api/guest/conversions/:id/retry          -> GuestConvertResponse
 *
 * Track and Playlist mirror the raw Spotify object shape, so the handler can
 * pass `spotify.FullPlaylist` straight through.
 */

// export type Track = {
//   id: string;
//   name: string;
//   artists: { name: string }[];
//   album: {
//     name: string;
//     images: {
//       height: number;
//       width: number;
//       url: string;
//     }[];
//   };
//   preview_url: string;
//   href: string;
// };

export type Track = {
  id: string;
  title: string;
  artists: string[];
  thumbnail: string;
  /** the track on its platform; set on converted matches */
  link?: string;
};

export type Playlist = {
  name: string;
  tracks: Track[];
  total_tracks: number;
  cover: string;
  url: string;
};

export type PlaylistTrack = {
  track: Track;
  added_at: string;
  is_local: boolean;
};

// export type PlaylistPreview = {
//   title: string;
//   tracks: {
//     id: string;
//     title: string;
//     artists: string[];
//     thumbnail: string;
//     link: string;
//     album: string;
//   }[];
//   totalTracks: number;
//   thumbnail: string;
// };

// export type Playlist = {
//   id: string;
//   platform: Platform;
//   title: string;
//   owner: {
//     display_name: string;
//   };
//   images: {
//     url: string;
//     height: number;
//     width: number;
//   }[];
//   url: string;
//   tracks: {
//     limit: number;
//     total: number;
//     items: PlaylistTrack[];
//   };
// };

export type ParsedLink = {
  platform: Platform;
  id: string;
  type: string;
  link: string;
};

export type GuestLoadPlaylistResponse = {
  playlist: Playlist;
  link: ParsedLink;
};

export type GuestMatchStatus = "matched" | "review" | "not_found";

export type GuestConvertPayload = {
  playlist_link: string;
  playlist_title: string;
  destination_platform: Platform;
};

/** one source track's outcome, keyed by the source track id */
export type TrackConversionResult = {
  /** the matched track's id on the destination platform */
  data?: string;
  error?: string;
};

export type TrackConversionResults = Record<string, TrackConversionResult>;

export type GuestConversionStatus = "pending" | "completed" | "failed" | "";

export type GuestConversionRecord = {
  conversion_id: string;
  playlist_id: string;
  playlist_title: string;
  source_platform: Platform;
  destination_platform: Platform;
  status: GuestConversionStatus;
  total_tracks: number;
  /** the preview tracks this guest run converts; null until the worker loads them */
  playlist_tracks: Track[] | null;
  playlist_cover?: string;
  result: TrackConversionResults | null;
  created_playlist_link: string;
};

export type GuestConvertResponse = {
  success: boolean;
  conversion: GuestConversionRecord;
};

/** the conversions started from this guest session, newest first */
export type GuestConversionsResponse = {
  conversions: GuestConversionRecord[];
};

/**
 * GET /api/guest/conversion-status/:id
 *
 * `state` is the worker's live progress from the cache; `conversion` is the
 * db row, which only gets its result once the run finishes.
 */
export type GuestConversionStatusResponse = {
  conversion: GuestConversionRecord;
  state: {
    status: GuestConversionStatus;
    result: TrackConversionResults | null;
    created_playlist_link: string;
  } | null;
};

export type GuestStep = "paste" | "preview";
