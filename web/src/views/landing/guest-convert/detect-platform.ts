import { Platform } from "@/types";

const SPOTIFY_HOST = "open.spotify.com";
const YOUTUBE_HOST = "music.youtube.com";

/**
 * Mirrors ParseConversionLink in handlers/utils.go so the CTA can enable itself
 * before the request goes out. The server stays the source of truth.
 */
export const detectPlatform = (link: string): Platform | null => {
  const value = link.trim();
  if (!value) return null;

  let host: string;
  try {
    host = new URL(value).host;
  } catch {
    return null;
  }

  if (host === SPOTIFY_HOST) return "spotify";
  if (host === YOUTUBE_HOST) return "youtube_music";
  return null;
};

export const otherPlatform = (platform: Platform): Platform =>
  platform === "spotify" ? "youtube_music" : "spotify";
