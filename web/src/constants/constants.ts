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
