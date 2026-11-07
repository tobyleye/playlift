import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";
import { Platform } from "@/types";
import { otherPlatform } from "./detect-platform";
import { sampleDestination, sampleLink, samplePlaylist } from "./sample-data";
import { SAMPLE_CONVERSION_ID } from "./use-conversion-status";
import type { GuestConversionLocationState } from "../guest-conversion";
import { GuestStep, ParsedLink, Playlist } from "./types";
import type { DevStep } from "./dev-step-nav";

export type GuestConversion = ReturnType<typeof useGuestConversion>;

export const guestConversionPath = (conversionId: string) =>
  `/guest/conversions/${conversionId}`;

/**
 * Paste and preview live on the landing page. Once the conversion exists it
 * gets its own page, so a refresh or a closed tab doesn't lose it.
 */
export default function useGuestConversion({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<GuestStep>("paste");
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [link, setLink] = useState<ParsedLink | null>(null);
  const [destination, setDestination] = useState<Platform | null>(null);
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [starting, setStarting] = useState(false);

  const reset = useCallback(() => {
    setStep("paste");
    setPlaylist(null);
    setLink(null);
    setDestination(null);
  }, []);

  const loadPlaylist = useCallback(
    async (playlistUrl: string) => {
      setLoadingPlaylist(true);
      try {
        const { playlist, link } = await api.guestLoadPlaylist(playlistUrl);
        setPlaylist(playlist);
        setLink(link);
        setDestination(otherPlatform(link.platform));
        setStep("preview");
      } catch (error) {
        console.error("error loading guest playlist", error);
        onError(
          "We couldn't load that playlist. Make sure the link is public and try again.",
        );
      } finally {
        setLoadingPlaylist(false);
      }
    },
    [onError],
  );

  const openConversion = useCallback(
    (conversionId: string, state: GuestConversionLocationState) => {
      navigate(guestConversionPath(conversionId), { state });
    },
    [navigate],
  );

  const startMatching = async () => {
    if (!playlist || !destination || !link || starting) return;

    setStarting(true);
    try {
      const { conversion } = await api.guestConvert({
        playlist_link: link.link,
        playlist_title: playlist.name,
        destination_platform: destination,
      });
      openConversion(conversion.conversion_id, { playlist, destination });
    } catch (error) {
      // nothing was created, so staying on the preview is the right place
      console.error("error converting guest playlist", error);
      onError("Something went wrong while starting the conversion.");
    } finally {
      setStarting(false);
    }
  };

  /** dev-only: jump straight to a step, filled with sample data */
  const showSample = useCallback(
    (target: DevStep) => {
      if (target === "converting") {
        openConversion(SAMPLE_CONVERSION_ID, {
          playlist: samplePlaylist,
          destination: sampleDestination,
        });
        return;
      }
      setStep(target);
      setPlaylist(target === "paste" ? null : samplePlaylist);
      setLink(target === "paste" ? null : sampleLink);
      setDestination(target === "paste" ? null : sampleDestination);
    },
    [openConversion],
  );

  return {
    step,
    playlist,
    link,
    destination,
    setDestination,
    loadingPlaylist,
    starting,
    loadPlaylist,
    startMatching,
    reset,
    showSample,
  };
}
