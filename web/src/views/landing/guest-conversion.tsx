import { Box, Button, Heading, Spinner, Text, useToast } from "@chakra-ui/react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import useLoggedIn from "@/hooks/useLoggedIn";
import { toastHelper } from "@/components/utils/toast";
import { Platform } from "@/types";
import GuestShell from "./guest-convert/guest-shell";
import ConvertingPanel from "./guest-convert/converting-panel";
import Stepper from "./guest-convert/stepper";
import DevStepNav from "./guest-convert/dev-step-nav";
import useGuestLogin from "./guest-convert/use-guest-login";
import useConversionStatus, {
  SAMPLE_CONVERSION_ID,
} from "./guest-convert/use-conversion-status";
import { GuestConversionRecord, Playlist } from "./guest-convert/types";

/**
 * Handed over by the preview step so the page can draw before the first status
 * response. History state survives a refresh; a fresh visit rebuilds from the
 * server instead.
 */
export type GuestConversionLocationState = {
  playlist: Playlist;
  destination: Platform;
};

const playlistFrom = (conversion: GuestConversionRecord): Playlist | null =>
  conversion.playlist_tracks?.length
    ? {
        name: conversion.playlist_title,
        tracks: conversion.playlist_tracks,
        total_tracks: conversion.total_tracks,
        cover: conversion.playlist_cover ?? "",
        url: "",
      }
    : null;

const CenteredMessage = ({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) => (
  <Box maxW="xl" mx="auto" textAlign="center" color="white" py={10}>
    <Heading fontSize="2xl" fontWeight={700}>
      {title}
    </Heading>
    {children}
  </Box>
);

export default function GuestConversionPage() {
  const { conversionId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const isLoggedIn = useLoggedIn();
  const { login, signingIn } = useGuestLogin();

  const handoff = location.state as GuestConversionLocationState | null;
  const previewTrackIds = handoff?.playlist.tracks.map((track) => track.id);
  const {
    conversion,
    status,
    trackResults,
    isReconnecting,
    isTakingLong,
    notFound,
    isRetrying,
    retry,
  } = useConversionStatus(conversionId, previewTrackIds ?? null);

  const playlist = handoff?.playlist ?? (conversion && playlistFrom(conversion));
  const destination = handoff?.destination ?? conversion?.destination_platform;
  const isFailed = status === "failed";
  const isComplete =
    !!playlist &&
    !isFailed &&
    (status === "completed" ||
      playlist.tracks.every((track) => trackResults[track.id]));

  const startOver = () => navigate("/");

  const onRetry = async () => {
    const ok = await retry();
    if (!ok) {
      toastHelper(toast, {
        title: "Oops!",
        description: "We couldn't restart the conversion. Please try again.",
        status: "error",
      });
    }
  };

  if (isLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  return (
    <GuestShell onLogin={login} signingIn={signingIn}>
      {import.meta.env.DEV && conversionId === SAMPLE_CONVERSION_ID && (
        <DevStepNav
          step="converting"
          onChange={(step) => navigate("/", { state: { devStep: step } })}
        />
      )}

      {notFound ? (
        <CenteredMessage title="We couldn't find this conversion">
          <Text mt={3} color="gray.200">
            It may have expired, or it was started in another browser.
          </Text>
          <Button
            mt={6}
            variant="link"
            color="white"
            textDecoration="underline"
            textUnderlineOffset={3}
            onClick={startOver}
          >
            Convert a playlist
          </Button>
        </CenteredMessage>
      ) : playlist && destination ? (
        <>
          <Stepper current={1} />
          <ConvertingPanel
            playlist={playlist}
            destination={destination}
            conversionId={conversionId}
            trackResults={trackResults}
            isComplete={isComplete}
            isFailed={isFailed}
            isReconnecting={isReconnecting}
            isTakingLong={isTakingLong}
            isRetrying={isRetrying}
            onRetry={onRetry}
            onLogin={login}
            onBack={startOver}
          />
        </>
      ) : (
        <CenteredMessage
          title={isReconnecting ? "Reconnecting…" : "Loading your conversion"}
        >
          <Spinner mt={6} color="pink.300" />
          {isReconnecting && (
            <Text mt={4} color="gray.200">
              Your conversion is still running. We'll keep trying.
            </Text>
          )}
        </CenteredMessage>
      )}
    </GuestShell>
  );
}
