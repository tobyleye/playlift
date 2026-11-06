import { Box, Button, Heading, Icon, Image, Text } from "@chakra-ui/react";
import { ArrowRight, CheckIcon, Music } from "lucide-react";
import { ComponentType } from "react";
import { GradientButton } from "@/components/buttons";
import SpotifyIcon from "@/icons/spotify";
import YoutubeMusicIcon from "@/icons/youtubemusic";
import { formatNumber } from "@/utils/utils";
import { Platform } from "@/types";
import { FlowCard, TrackList, TrackRow } from "./track-list";
import { Playlist } from "./types";

type Destination = {
  label: string;
  icon: ComponentType;
  iconBg: string;
} & (
  | { value: Platform; comingSoon?: false }
  | { value: string; comingSoon: true }
);

const services: Destination[] = [
  {
    label: "YouTube Music",
    value: "youtube_music",
    icon: YoutubeMusicIcon,
    iconBg: "youtube-red",
  },
  {
    label: "Spotify",
    value: "spotify",
    icon: SpotifyIcon,
    iconBg: "spotify-green",
  },
  {
    label: "Deezer",
    value: "deezer",
    icon: Music,
    iconBg: "rgb(162, 56, 255)",
    comingSoon: true,
  },
  {
    label: "Apple Music",
    value: "apple_music",
    icon: Music,
    iconBg: "rgb(250, 36, 60)",
    comingSoon: true,
  },
];

const DestinationOption = ({
  label,
  icon,
  iconBg,
  hint,
  isSelected,
  isDisabled,
  onSelect,
}: {
  label: string;
  icon: ComponentType;
  iconBg: string;
  hint: string;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
}) => (
  <Box
    as="button"
    type="button"
    aria-pressed={isSelected}
    display="flex"
    alignItems="center"
    gap={3}
    textAlign="left"
    px={4}
    py={4}
    rounded="lg"
    border="1px solid"
    borderColor={isSelected ? "pink.400" : "whiteAlpha.200"}
    bg={isSelected ? "rgba(139, 92, 246, .18)" : "whiteAlpha.100"}
    boxShadow={isSelected ? "0 0 0 3px rgba(236, 72, 153, .15)" : "none"}
    transition=".2s ease-in-out"
    _hover={isDisabled || isSelected ? {} : { bg: "whiteAlpha.200" }}
    _focusVisible={{ outline: "2px solid", outlineColor: "pink.400" }}
    _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
    disabled={isDisabled}
    onClick={onSelect}
  >
    <Box
      w={9}
      h={9}
      rounded="md"
      flexShrink={0}
      display="grid"
      placeItems="center"
      bg={iconBg}
      color="white"
    >
      <Icon as={icon} w={5} h={5} />
    </Box>

    <Box flex={1} minW={0}>
      <Text fontWeight={600} noOfLines={1}>
        {label}
      </Text>
      <Text fontSize="xs" color="gray.300" noOfLines={1}>
        {hint}
      </Text>
    </Box>

    {/* a shape cue so the selection doesn't rely on border colour alone */}
    {isSelected && (
      <Box
        w={5}
        h={5}
        rounded="full"
        flexShrink={0}
        display="grid"
        placeItems="center"
        bg="linear-gradient(to right bottom, rgb(236, 72, 153), rgb(139, 92, 246))"
      >
        <Icon as={CheckIcon} w={3} h={3} strokeWidth={3} />
      </Box>
    )}
  </Box>
);

export default function PlaylistPreview({
  playlist,
  source,
  destination,
  onSelectDestination,
  onStart,
  isStarting = false,
  onBack,
}: {
  playlist: Playlist;
  /** where the playlist came from; shown in the header, left out of the picker */
  source?: Platform;
  destination: Platform | null;
  onSelectDestination: (platform: Platform) => void;
  onStart: () => void;
  /** the convert request is in flight */
  isStarting?: boolean;
  onBack: () => void;
}) {
  const playlistCover = playlist.cover;
  const remaining = playlist.total_tracks - playlist.tracks.length;
  const sourceService = services.find((service) => service.value === source);
  const options = services.filter((service) => service.value !== source);

  return (
    <Box maxW="3xl" mx="auto">
      <Heading fontSize="3xl" fontWeight={700} textAlign="center" color="white">
        Here's your playlist
      </Heading>
      <Text mt={2} textAlign="center" color="gray.200">
        Pick where it's going — the tracks are already loaded.
      </Text>

      <Box mt={7}>
        <FlowCard>
          <Box display="flex" alignItems="center" gap={4} p={5}>
            {playlistCover ? (
              <Image
                src={playlistCover}
                alt=""
                w={20}
                h={20}
                rounded="lg"
                objectFit="cover"
                flexShrink={0}
              />
            ) : (
              <Box
                w={20}
                h={20}
                rounded="lg"
                flexShrink={0}
                display="grid"
                placeItems="center"
                bg="linear-gradient(to right bottom, rgb(236, 72, 153), rgb(139, 92, 246))"
              >
                <Icon as={Music} w={7} h={7} />
              </Box>
            )}

            <Box minW={0}>
              <Heading fontSize="xl" fontWeight={700} noOfLines={1}>
                {playlist.name}
              </Heading>
              {/* {playlist.owner?.display_name && (
                <Text fontSize="sm" color="gray.200" mt={1} noOfLines={1}>
                  by {playlist.owner.display_name}
                </Text>
              )} */}
              <Box
                display="flex"
                alignItems="center"
                gap={1.5}
                mt={1}
                fontSize="sm"
                color="whiteAlpha.600"
              >
                {sourceService && (
                  <>
                    <Icon
                      as={sourceService.icon}
                      w={4}
                      h={4}
                      color={sourceService.iconBg}
                    />
                    <Text as="span" color="whiteAlpha.800" fontWeight={500}>
                      {sourceService.label}
                    </Text>
                    <Text as="span">·</Text>
                  </>
                )}
                <Text as="span">
                  {formatNumber(playlist.total_tracks)} tracks
                </Text>
              </Box>
            </Box>
          </Box>

          <TrackList moreCount={remaining}>
            {playlist.tracks.map((item, index) => (
              <TrackRow
                key={`${item.id}-${index}`}
                position={index + 1}
                track={item}
              />
            ))}
          </TrackList>
        </FlowCard>
      </Box>

      <Box mt={6}>
        <Text
          textAlign="center"
          fontSize="sm"
          fontWeight={600}
          letterSpacing="wider"
          textTransform="uppercase"
          color="whiteAlpha.600"
          mb={3}
        >
          Convert to
        </Text>
        <Box
          display="grid"
          gridTemplateColumns={{
            base: "1fr",
            sm: `repeat(${Math.min(options.length, 3)}, 1fr)`,
          }}
          gap={3}
          maxW={options.length > 2 ? "3xl" : "xl"}
          mx="auto"
        >
          {options.map((opt) => (
            <DestinationOption
              key={opt.value}
              label={opt.label}
              icon={opt.icon}
              iconBg={opt.iconBg}
              hint={opt.comingSoon ? "Coming soon" : "Save to your library"}
              isSelected={opt.value === destination}
              isDisabled={!!opt.comingSoon}
              onSelect={() => {
                if (!opt.comingSoon) onSelectDestination(opt.value);
              }}
            />
          ))}
        </Box>
      </Box>

      <Box display="flex" justifyContent="center" mt={7}>
        <GradientButton
          fontWeight={600}
          gap={2}
          disabled={!destination || isStarting}
          onClick={onStart}
        >
          {isStarting
            ? "Starting…"
            : `Convert ${formatNumber(playlist.total_tracks)} tracks`}
          {!isStarting && <Icon as={ArrowRight} w={4} h={4} />}
        </GradientButton>
      </Box>

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
          Start over with a different link
        </Button>
      </Box>
    </Box>
  );
}
