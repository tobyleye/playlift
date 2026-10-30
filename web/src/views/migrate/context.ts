import { Playlist, PlaylistSelection } from "@/types";
import { createContext, useContext } from "react";
import { streamingServices } from "@/constants/constants";

type Platform =
  | typeof streamingServices.youtubeMusic
  | typeof streamingServices.spotify;

export type MigrateContextType = {
  youtubeConnected: boolean;
  spotifyConnected: boolean;
  setYoutubeConnected: (v: boolean) => void;
  setSpotifyConnected: (v: boolean) => void;
  selectedPlaylists: PlaylistSelection[];
  setSelectedPlaylists: (playlists: PlaylistSelection[]) => void;
  togglePlaylist: (playlist: Playlist) => void;
  sourcePlatform: Platform;
  setSourcePlatform: (p: Platform) => void;
  destinationPlatform: Platform;
  setDestinationPlatform: (p: Platform) => void;
};

export const MigrateContext = createContext<MigrateContextType | null>(null);

export const useMigrateContext = () => {
  const value = useContext(MigrateContext);
  if (!value)
    throw new Error("useMigrateContext must be used within MigrateProvider");
  return value;
};
