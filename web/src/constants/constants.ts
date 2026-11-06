import SpotifyIcon from "@/icons/spotify";
import YoutubeMusicIcon from "@/icons/youtubemusic";

export const streamingServices = {
  youtubeMusic: {
    label: "YouTube Music",
    value: "youtube_music",
  },
  spotify: {
    label: "Spotify",
    value: "spotify",
  },
};

const streamingServicesMap = {
  [streamingServices.youtubeMusic.value]: streamingServices.youtubeMusic.label,
  [streamingServices.spotify.value]: streamingServices.spotify.label,
};

export const getServiceLabel = (value: string) => {
  return streamingServicesMap[value as keyof typeof streamingServicesMap];
};

export const getServiceColor = (value: string) => {
  if (value === "youtube_music") {
    return "youtube-red";
  } else if (value === "spotify") {
    return "spotify-green";
  }
  return;
};

export const getServiceIcon = (value: string) => {
  if (value === streamingServices.youtubeMusic.value) {
    return YoutubeMusicIcon;
  } else if (value === streamingServices.spotify.value) {
    return SpotifyIcon;
  }
  return;
};
