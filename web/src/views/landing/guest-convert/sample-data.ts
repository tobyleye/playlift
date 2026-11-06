import {
  GuestConversionRecord,
  GuestMatchStatus,
  ParsedLink,
  Playlist,
  Track,
  TrackConversionResults,
} from "./types";

/** dev-only fixtures for clicking through the guest wizard without the API */

/** the dev bar routes here; the page plays a fake run instead of polling */
export const SAMPLE_CONVERSION_ID = "sample";

const tracks: Track[] = [
  ["Blinding Lights", ["The Weeknd"]],
  ["Levitating", ["Dua Lipa", "DaBaby"]],
  ["Essence", ["Wizkid", "Tems"]],
  ["As It Was", ["Harry Styles"]],
  ["Calm Down", ["Rema", "Selena Gomez"]],
  ["Heat Waves", ["Glass Animals"]],
  ["Last Last", ["Burna Boy"]],
  ["Anti-Hero", ["Taylor Swift"]],
  ["Peaches", ["Justin Bieber", "Daniel Caesar", "Giveon"]],
  ["Kill Bill", ["SZA"]],
  ["Unavailable", ["Davido", "Musa Keys"]],
  ["Midnight City (Live at Some Tiny Venue, 2012 Remaster)", ["M83"]],
  ["Water", ["Tyla"]],
  ["Flowers", ["Miley Cyrus"]],
  ["Sungba (Remix)", ["Asake", "Burna Boy"]],
].map(([title, artists], index) => ({
  id: `sample-${index}`,
  title: title as string,
  artists: artists as string[],
  thumbnail: "",
}));

const statuses: GuestMatchStatus[] = [
  "matched",
  "matched",
  "matched",
  "matched",
  "matched",
  "matched",
  "matched",
  "not_found",
  "matched",
  "matched",
  "matched",
  "matched",
  "matched",
  "matched",
  "not_found",
];

export const samplePlaylist: Playlist = {
  name: "Afternoon Drive",
  tracks,
  total_tracks: 32,
  cover: "",
  url: "https://open.spotify.com/playlist/sample",
};

export const sampleLink: ParsedLink = {
  platform: "spotify",
  id: "sample",
  type: "playlist",
  link: samplePlaylist.url,
};

export const sampleDestination = "youtube_music" as const;

/** what the worker would have written once every preview track is done */
export const sampleTrackResults: TrackConversionResults = Object.fromEntries(
  tracks.map((track, index) => [
    track.id,
    statuses[index] === "not_found"
      ? { error: "Not found" }
      : { data: `sample${index}` },
  ]),
);

const sampleRecord = (
  title: string,
  status: GuestConversionRecord["status"],
  totalTracks: number,
): GuestConversionRecord => ({
  // every sample opens the same fake run
  conversion_id: SAMPLE_CONVERSION_ID,
  playlist_id: "sample",
  playlist_title: title,
  source_platform: "spotify",
  destination_platform: sampleDestination,
  status,
  total_tracks: totalTracks,
  playlist_tracks: samplePlaylist.tracks,
  result: null,
  created_playlist_link: "",
});

/** dev-only stand-in for GET /guest/conversions until the endpoint exists */
export const sampleConversions: GuestConversionRecord[] = [
  sampleRecord(samplePlaylist.name, "pending", samplePlaylist.total_tracks),
  sampleRecord("Gym Rotation", "completed", 48),
  sampleRecord("Sunday Morning", "failed", 21),
];
