import { useEffect, useRef } from "react";
import { Box, Button, Heading, Icon, SlideFade, Text } from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import { RotateCw, WifiOff } from "lucide-react";
import { GradientButton } from "@/components/buttons";
import { getServiceLabel } from "@/constants/constants";
import { formatNumber } from "@/utils/utils";
import { Platform } from "@/types";
import { FlowCard, TrackList, TrackRow } from "./track-list";
import {
  GuestMatchStatus,
  Playlist,
  TrackConversionResult,
  TrackConversionResults,
} from "./types";

/**
 * Picked up after the Google round trip so the finished conversion can be
 * claimed for the new account instead of being re-run.
 */
export const PENDING_GUEST_CONVERSION_KEY = "playlift:pending_guest_conversion";

const trackUrl = (platform: Platform, trackId: string) =>
  platform === "spotify"
    ? `https://open.spotify.com/track/${trackId}`
    : `https://music.youtube.com/watch?v=${trackId}`;

const statusOf = (result: TrackConversionResult): GuestMatchStatus =>
  result.data ? "matched" : "not_found";

const StatPill = ({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) => (
  <Box
    display="flex"
    alignItems="center"
    gap={2}
    px={3}
    py={1.5}
    rounded="full"
    fontSize="sm"
    fontWeight={600}
    bg="whiteAlpha.100"
    border="1px solid"
    borderColor="whiteAlpha.200"
  >
    <Box w={2} h={2} rounded="full" bg={color} />
    {children}
  </Box>
);

export default function ConvertingPanel({
  playlist,
  destination,
  conversionId,
  trackResults,
  isComplete,
  isFailed = false,
  isReconnecting = false,
  isTakingLong = false,
  isRetrying = false,
  onRetry,
  onLogin,
  onBack,
}: {
  playlist: Playlist;
  destination: Platform;
  /** null until the convert request returns */
  conversionId: string | null;
  /** keyed by source track id; a track without an entry is still converting */
  trackResults: TrackConversionResults;
  isComplete: boolean;
  /** the worker gave up; already-converted rows stay, the rest show bare */
  isFailed?: boolean;
  /** status requests are failing; the conversion itself may be fine */
  isReconnecting?: boolean;
  isTakingLong?: boolean;
  isRetrying?: boolean;
  onRetry?: () => void;
  onLogin: () => void;
  onBack: () => void;
}) {
  const destinationLabel = getServiceLabel(destination);
  const tracks = playlist.tracks;
  const total = tracks.length;
  const remaining = Math.max(playlist.total_tracks - total, 0);
  const results = tracks.map((track) => trackResults[track.id]);
  const done = results.filter(Boolean).length;
  const matched = results.filter((result) => result?.data).length;
  const notFound = done - matched;
  const progress = total > 0 ? (done / total) * 100 : 0;
  const hasProgress = done > 0;
  const currentIndex = results.findIndex((result) => !result);

  // bring the sign-in card into view once it slides in, if it landed off-screen
  const ctaRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!isComplete) return;
    const timer = setTimeout(() => {
      ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 250);
    return () => clearTimeout(timer);
  }, [isComplete]);

  const saveAndLogin = () => {
    if (conversionId) {
      try {
        sessionStorage.setItem(
          PENDING_GUEST_CONVERSION_KEY,
          JSON.stringify({ conversion_id: conversionId, destination }),
        );
      } catch (error) {
        console.error("unable to stash guest conversion", error);
      }
    }
    onLogin();
  };

  return (
    <Box maxW="3xl" mx="auto">
      <Heading fontSize="3xl" fontWeight={700} textAlign="center" color="white">
        {isFailed
          ? "We couldn't finish this one"
          : isComplete
            ? remaining > 0
              ? `Your first ${formatNumber(total)} tracks are ready 🎉`
              : "Your playlist is ready 🎉"
            : `Converting to ${destinationLabel}`}
      </Heading>
      <Text mt={2} textAlign="center" color="gray.200">
        {isFailed
          ? "Your conversion is saved. Try again and we'll pick up where it stopped."
          : isComplete
            ? `Tap any track to hear it on ${destinationLabel}.`
            : isTakingLong
              ? "Taking longer than usual. You can leave, it'll be here when you're back."
              : "Matching by track, artist and duration…"}
      </Text>

      <Box mt={7}>
        <FlowCard>
          {isReconnecting && !isComplete && !isFailed && (
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              px={5}
              py={2.5}
              fontSize="sm"
              color="yellow.200"
              bg="rgba(234, 179, 8, .1)"
              borderBottom="1px solid"
              borderColor="rgba(234, 179, 8, .2)"
            >
              <Icon as={WifiOff} w={4} h={4} flexShrink={0} />
              Reconnecting… your conversion is still running.
            </Box>
          )}
          <Box display="flex" alignItems="center" gap={4} px={5} pt={5}>
            <Box
              flex={1}
              h={2}
              rounded="full"
              bg="whiteAlpha.200"
              overflow="hidden"
            >
              <Box
                h="full"
                rounded="full"
                w={`${progress}%`}
                minW={hasProgress ? undefined : "18%"}
                className={hasProgress ? undefined : "loading-pulse"}
                bg="linear-gradient(to right, rgb(236, 72, 153), rgb(139, 92, 246))"
                transition="width .28s ease"
              />
            </Box>
            <Text fontSize="sm" fontWeight={600} flexShrink={0}>
              {formatNumber(done)}
              <Box as="span" color="whiteAlpha.600">
                {" "}
                / {formatNumber(total)}
              </Box>
            </Text>
          </Box>

          <Box mt={5}>
            <TrackList
              maxH="360px"
              followIndex={
                isComplete || currentIndex < 0 ? undefined : currentIndex
              }
              moreCount={remaining}
              moreHint="converted after you sign in"
            >
              {tracks.map((track, index) => {
                const result = results[index];
                return (
                  <TrackRow
                    key={`${track.id}-${index}`}
                    position={index + 1}
                    track={track}
                    // once the run is over, a track with no result just shows bare
                    isPending={!result && !isComplete && !isFailed}
                    status={result && statusOf(result)}
                    link={
                      result?.data && trackUrl(destination, result.data)
                    }
                    linkLabel={`Open on ${destinationLabel}`}
                  />
                );
              })}
            </TrackList>
          </Box>
        </FlowCard>
      </Box>

      {isFailed && onRetry && (
        <Box display="flex" justifyContent="center" mt={6}>
          <GradientButton
            fontWeight={600}
            gap={2}
            disabled={isRetrying}
            onClick={onRetry}
          >
            <Icon as={RotateCw} w={4} h={4} />
            {isRetrying ? "Retrying…" : "Try again"}
          </GradientButton>
        </Box>
      )}

      <SlideFade in={isComplete && !isFailed} offsetY="32px" unmountOnExit>
        <Box
          ref={ctaRef}
          mt={6}
          px={7}
          py={8}
          rounded="lg"
          textAlign="center"
          border="1px solid"
          borderColor="rgba(236, 72, 153, .35)"
          bg="linear-gradient(160deg, rgba(236, 72, 153, .1), rgba(139, 92, 246, .1))"
          backdropFilter="blur(16px)"
        >
          {done > 0 && (
            <Box
              display="flex"
              flexWrap="wrap"
              justifyContent="center"
              gap={2}
              mb={5}
            >
              <StatPill color="green.400">
                {formatNumber(matched)} matched
              </StatPill>
              {notFound > 0 && (
                <StatPill color="red.400">
                  {formatNumber(notFound)} not found
                </StatPill>
              )}
            </Box>
          )}

          <Heading fontSize="xl" fontWeight={700}>
            {remaining > 0
              ? `Convert the other ${formatNumber(remaining)} tracks`
              : `Save it to your ${destinationLabel}`}
          </Heading>
          <Text maxW="md" mx="auto" mt={3} color="gray.200">
            {remaining > 0
              ? `Sign in to finish “${playlist.name}” and save all ${formatNumber(
                  playlist.total_tracks,
                )} tracks to your ${destinationLabel} library.`
              : `Sign in and “${playlist.name}” lands in your ${destinationLabel} library.`}
          </Text>

          <Box display="flex" justifyContent="center" mt={5}>
            <GradientButton fontWeight={600} gap={2} onClick={saveAndLogin}>
              <Icon as={FcGoogle} w={5} h={5} />
              Continue with Google
            </GradientButton>
          </Box>

          <Text mt={4} fontSize="sm" color="whiteAlpha.600">
            New here? This creates your account. Your progress is saved.
          </Text>
        </Box>
      </SlideFade>

      <Box textAlign="center" mt={5}>
        <Button
          variant="link"
          fontSize="sm"
          fontWeight={500}
          color="whiteAlpha.600"
          textDecoration="underline"
          textUnderlineOffset={3}
          _hover={{ color: "white" }}
          onClick={onBack}
        >
          Convert another playlist
        </Button>
      </Box>
    </Box>
  );
}
