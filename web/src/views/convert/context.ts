import { Playlist, PlaylistSelection, Steps } from "@/types";
import { createContext, useContext } from "react";

export const ConvertWizardContext = createContext<{
  steps: Steps;
  youtubeConnected: boolean;
  spotifyConnected: boolean;
  setYoutubeConnected: (connected: boolean) => void;
  setSpotifyConnected: (connected: boolean) => void;
  togglePlaylist: (playlists: Playlist) => void;
  selectedPlaylists: PlaylistSelection[];
  setSelectedPlaylists: (playlists: PlaylistSelection[]) => void;
  sourcePlatform: { label: string; value: string };
  setSourcePlatform: (platform: { label: string; value: string }) => void;
  destinationPlatform: { label: string; value: string };
  setDestinationPlatform: (platform: { label: string; value: string }) => void;
} | null>(null);

export const useConvertWizardContext = () => {
  const value = useContext(ConvertWizardContext);
  if (!value) {
    throw new Error(
      "useConvertWizardContext must be used within a ConvertWizardProvider"
    );
  }
  return value;
};
