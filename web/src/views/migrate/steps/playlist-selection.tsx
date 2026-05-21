import {
  Box,
  Flex,
  Grid,
  Text,
  useToast,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Tab,
} from "@chakra-ui/react";
import { useMemo, useRef, useState } from "react";
import { ToastId } from "@chakra-ui/react";
import useSWRInfinite from "swr/infinite";
import { Playlist } from "@/types";
import api from "@/api/api";
import { streamingServices } from "@/constants/constants";
import { useMigrateContext } from "../context";
import { serverErrorToast, toastHelper } from "@/components/utils/toast";
import EllipsisLoader from "@/components/ellipsis-loader";

type YoutubePlaylistsResponse = {
  playlists: Playlist[];
  continuation?: string;
};

type SpotifyPlaylistsResponse = {
  playlists: Playlist[];
  next_page: number;
};

const ARTWORK_COLORS = [
  "#1a1a2e",
  "#1a2a1a",
  "#141426",
  "#1a1a1e",
  "#2a1a1a",
  "#1a2a2a",
  "#2a1a2a",
  "#1a1a1a",
  "#201820",
  "#182028",
];

function getPlaylistBg(id: string) {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ARTWORK_COLORS[hash % ARTWORK_COLORS.length];
}

function YouTubeIcon({ size = 9 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF3B30">
      <path d="M23.5 6.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.3-1C17.1 2.7 12 2.7 12 2.7s-5.1 0-8.3.2c-.5.1-1.5.1-2.3 1-.7.7-.9 2.3-.9 2.3S.2 8 .2 9.8v1.7c0 1.8.3 3.5.3 3.5s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.8.2 7.5.2 7.5.2s5.1 0 8.3-.2c.5-.1 1.5-.1 2.3-1 .7-.7.9-2.3.9-2.3s.3-1.8.3-3.5V9.8c0-1.8-.3-3.6-.3-3.6zM9.7 14.7V8.5l6.2 3.1-6.2 3.1z" />
    </svg>
  );
}

function SpotifyIcon({ size = 9 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function PlaylistCard({
  playlist,
  isSelected,
  onToggle,
  sourcePlatform,
}: {
  playlist: Playlist;
  isSelected: boolean;
  onToggle: () => void;
  sourcePlatform: string;
}) {
  const isYT = sourcePlatform === streamingServices.youtubeMusic.value;
  return (
    <Box
      as="button"
      w="100%"
      bg="brand.card"
      border="0.5px solid"
      borderColor={isSelected ? "brand.accentBorder" : "border.subtle"}
      borderRadius="12px"
      p="10px"
      cursor="pointer"
      onClick={onToggle}
      display="flex"
      flexDirection="column"
      gap="7px"
      transition="all .18s"
      textAlign="left"
      _hover={{
        borderColor: isSelected ? "brand.accentBorder" : "border.medium",
      }}
      sx={isSelected ? { background: "rgba(200, 240, 74, 0.06)" } : {}}
    >
      {/* Artwork */}
      <Box
        w="100%"
        sx={{ aspectRatio: "1" }}
        borderRadius="8px"
        bg={getPlaylistBg(playlist.playlist_id)}
        position="relative"
        overflow="hidden"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text
          fontSize="22px"
          fontWeight="bold"
          color="whiteAlpha.600"
          userSelect="none"
        >
          {playlist.title.charAt(0).toUpperCase()}
        </Text>

        {/* Platform badge */}
        <Box
          position="absolute"
          top="5px"
          left="5px"
          w="16px"
          h="16px"
          borderRadius="4px"
          bg={isYT ? "rgba(255,59,48,0.2)" : "rgba(29,185,84,0.2)"}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {isYT ? <YouTubeIcon /> : <SpotifyIcon />}
        </Box>

        {/* Check indicator */}
        <Box
          position="absolute"
          top="5px"
          right="5px"
          w="18px"
          h="18px"
          borderRadius="50%"
          bg="brand.accent"
          display="flex"
          alignItems="center"
          justifyContent="center"
          opacity={isSelected ? 1 : 0}
          transition="opacity .15s"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            stroke="#0d0d0d"
            strokeWidth="2.2"
          >
            <polyline points="2,6 5,9 10,3" />
          </svg>
        </Box>
      </Box>

      <Text fontSize="12px" fontWeight={500} color="text.primary" noOfLines={1}>
        {playlist.title}
      </Text>
      <Text fontSize="10px" color="text.muted">
        {playlist.total_tracks} tracks
      </Text>
    </Box>
  );
}

function YoutubePlaylists({
  search,
  selectedIds,
  onToggle,
}: {
  search: string;
  selectedIds: string[];
  onToggle: (p: Playlist) => void;
}) {
  const toast = useToast();
  const { data, size, setSize, isLoading } =
    useSWRInfinite<YoutubePlaylistsResponse>(
      (pageIndex, previousData) => ({
        pageIndex,
        continuation: previousData?.continuation,
      }),
      (args) => api.getYoutubePlaylists(args.continuation),
      {
        onError() {
          serverErrorToast(toast, { id: "yt-playlist-error" });
        },
        shouldRetryOnError: false,
      },
    );

  const playlists = useMemo(
    () => (data ? data.flatMap((d) => d.playlists) : []),
    [data],
  );

  const filteredPlaylists = useMemo(() => {
    return search
      ? playlists.filter((p) =>
          p.title.toLowerCase().includes(search.toLowerCase()),
        )
      : playlists;
  }, [search, playlists]);

  const lastPage = data ? data[data.length - 1] : null;
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  if (isLoading && !data) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <EllipsisLoader text="Loading playlists" />
      </Box>
    );
  }

  return (
    <Box>
      <Grid templateColumns="repeat(auto-fill, minmax(140px, 1fr))" gap="8px">
        {filteredPlaylists.map((pl) => (
          <PlaylistCard
            key={pl.playlist_id}
            playlist={pl}
            isSelected={selectedIds.includes(pl.playlist_id)}
            onToggle={() => onToggle(pl)}
            sourcePlatform={streamingServices.youtubeMusic.value}
          />
        ))}
      </Grid>
      {lastPage?.continuation && (
        <Flex justify="center" pt={4}>
          <Box
            as="button"
            bg="rgba(255,255,255,0.06)"
            border="0.5px solid"
            borderColor="border.subtle"
            borderRadius="9px"
            color="text.muted"
            fontSize="13px"
            px="18px"
            py="8px"
            cursor="pointer"
            onClick={() => setSize(size + 1)}
            disabled={!!isLoadingMore}
            opacity={isLoadingMore ? 0.6 : 1}
          >
            {isLoadingMore ? <EllipsisLoader text="Loading" /> : "Load more"}
          </Box>
        </Flex>
      )}
    </Box>
  );
}

function SpotifyPlaylists({
  search,
  selectedIds,
  onToggle,
}: {
  search: string;
  selectedIds: string[];
  onToggle: (p: Playlist) => void;
}) {
  const toast = useToast();
  const { data, size, setSize, isLoading } =
    useSWRInfinite<SpotifyPlaylistsResponse>(
      (_, previousData) => {
        if (!previousData) return ["spotify-playlists", 1];
        return ["spotify-playlists", previousData.next_page];
      },
      (key: [string, number]) => api.getSpotifyPlaylists(key[1]),
      {
        onError() {
          serverErrorToast(toast, { id: "sp-playlist-error" });
        },
        shouldRetryOnError: false,
      },
    );

  const playlists = useMemo(
    () => (data ? data.flatMap((d) => d.playlists) : []),
    [data],
  );

  const filteredPlaylists = useMemo(() => {
    return search
      ? playlists.filter((p) =>
          p.title.toLowerCase().includes(search.toLowerCase()),
        )
      : playlists;
  }, [search, playlists]);

  const lastPage = data ? data[data.length - 1] : null;
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  if (isLoading && !data) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <EllipsisLoader text="Loading playlists" />
      </Box>
    );
  }

  return (
    <Box>
      <Grid templateColumns="repeat(auto-fill, minmax(140px, 1fr))" gap="8px">
        {filteredPlaylists.map((pl) => (
          <PlaylistCard
            key={pl.playlist_id}
            playlist={pl}
            isSelected={selectedIds.includes(pl.playlist_id)}
            onToggle={() => onToggle(pl)}
            sourcePlatform={streamingServices.spotify.value}
          />
        ))}
      </Grid>
      {lastPage && lastPage.next_page > 0 && (
        <Flex justify="center" pt={4}>
          <Box
            as="button"
            bg="rgba(255,255,255,0.06)"
            border="0.5px solid"
            borderColor="border.subtle"
            borderRadius="9px"
            color="text.muted"
            fontSize="13px"
            px="18px"
            py="8px"
            cursor="pointer"
            onClick={() => setSize(size + 1)}
            disabled={!!isLoadingMore}
            opacity={isLoadingMore ? 0.6 : 1}
          >
            {isLoadingMore ? <EllipsisLoader text="Loading" /> : "Load more"}
          </Box>
        </Flex>
      )}
    </Box>
  );
}

export default function PlaylistSelectionStep() {
  const {
    selectedPlaylists,
    togglePlaylist,
    setSelectedPlaylists,
    sourcePlatform,
    setSourcePlatform,
    destinationPlatform,
    setDestinationPlatform,
  } = useMigrateContext();

  const [search, setSearch] = useState("");
  const toast = useToast();
  const toastRef = useRef<ToastId>();

  const selectedIds = useMemo(
    () => selectedPlaylists.map((pl) => pl.playlist.playlist_id),
    [selectedPlaylists],
  );

  const isYTSource =
    sourcePlatform.value === streamingServices.youtubeMusic.value;

  const swapDirection = () => {
    const newSource = isYTSource
      ? streamingServices.spotify
      : streamingServices.youtubeMusic;
    const newDest = isYTSource
      ? streamingServices.youtubeMusic
      : streamingServices.spotify;

    toast.close(toastRef.current!);
    toastRef.current = toastHelper(toast, {
      title: "Direction switched",
      description: `Now migrating from ${newSource.label} to ${newDest.label}`,
    });

    setSourcePlatform(newSource);
    setDestinationPlatform(newDest);
    setSelectedPlaylists([]);
  };

  const renderOld = () => {
    return (
      <Flex align="center" gap="10px" flexWrap="wrap">
        <Flex
          align="center"
          gap="10px"
          bg="brand.card"
          border="0.5px solid"
          borderColor="border.subtle"
          borderRadius="999px"
          px="16px"
          py="6px"
        >
          {/* Source label */}
          <Flex align="center" gap="6px">
            {isYTSource ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF3B30">
                <path d="M23.5 6.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.3-1C17.1 2.7 12 2.7 12 2.7s-5.1 0-8.3.2c-.5.1-1.5.1-2.3 1-.7.7-.9 2.3-.9 2.3S.2 8 .2 9.8v1.7c0 1.8.3 3.5.3 3.5s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.8.2 7.5.2 7.5.2s5.1 0 8.3-.2c.5-.1 1.5-.1 2.3-1 .7-.7.9-2.3.9-2.3s.3-1.8.3-3.5V9.8c0-1.8-.3-3.6-.3-3.6zM9.7 14.7V8.5l6.2 3.1-6.2 3.1z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            )}
            <Text fontSize="13px" fontWeight={500} color="text.primary">
              {sourcePlatform.label.replace(" Music", "")}
            </Text>
          </Flex>

          {/* Arrow */}
          <Flex align="center" gap="4px" color="text.muted2">
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path strokeLinecap="round" d="M3 8h10M9 5l3 3-3 3" />
            </svg>
          </Flex>

          {/* Destination label */}
          <Flex align="center" gap="6px">
            {!isYTSource ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF3B30">
                <path d="M23.5 6.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.3-1C17.1 2.7 12 2.7 12 2.7s-5.1 0-8.3.2c-.5.1-1.5.1-2.3 1-.7.7-.9 2.3-.9 2.3S.2 8 .2 9.8v1.7c0 1.8.3 3.5.3 3.5s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.8.2 7.5.2 7.5.2s5.1 0 8.3-.2c.5-.1 1.5-.1 2.3-1 .7-.7.9-2.3.9-2.3s.3-1.8.3-3.5V9.8c0-1.8-.3-3.6-.3-3.6zM9.7 14.7V8.5l6.2 3.1-6.2 3.1z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            )}
            <Text fontSize="13px" fontWeight={500} color="text.primary">
              {destinationPlatform.label.replace(" Music", "")}
            </Text>
          </Flex>

          {/* Swap button */}
          <Box
            as="button"
            bg="brand.accentDim"
            border="0.5px solid"
            borderColor="brand.accentBorder"
            borderRadius="50%"
            w="24px"
            h="24px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            transition="all .2s"
            color="brand.accent"
            _hover={{ bg: "rgba(200,240,74,0.2)", transform: "rotate(180deg)" }}
            onClick={swapDirection}
            title="Swap direction"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                d="M3 4h8M3 10h8M9 1.5l2.5 2.5L9 6.5M5 7.5L2.5 10 5 12.5"
              />
            </svg>
          </Box>
        </Flex>

        {selectedPlaylists.length > 0 && (
          <Box
            fontSize="12px"
            bg="brand.accentDim"
            border="0.5px solid"
            borderColor="brand.accentBorder"
            color="brand.accent"
            borderRadius="999px"
            px="10px"
            py="2px"
            fontWeight={500}
          >
            {selectedPlaylists.length} selected
          </Box>
        )}
      </Flex>
    );
  };

  return (
    <Box display="flex" flexDirection="column" gap={5}>
      {/* Header */}
      <Flex
        align="flex-start"
        justify="space-between"
        flexWrap="wrap"
        gap="10px"
      >
        <Box>
          <Box
            as="h1"
            fontSize={{ base: "1.5rem", md: "2rem" }}
            color="text.primary"
            lineHeight={1.15}
          >
            Pick your{` `}
            <Box as="em" fontStyle="italic" color="text.muted">
              playlists
            </Box>
          </Box>
          <Text
            fontSize="sm"
            color="text.muted"
            mt="0.5rem"
            lineHeight={1.65}
            fontWeight={300}
            maxW="420px"
          >
            Select the playlists you want to migrate.
            {/* You can change direction anytime. */}
          </Text>
        </Box>
      </Flex>

      {/* Direction toggle + selection count */}

      <Tabs
        isLazy
        variant="unstyled"
        // index={activeTabIndex}
        onChange={(index) => {
          // setActiveTabIndex(index);
          // some crazy logic to switch platforms.

          const sourcePlatform = [
            streamingServices.youtubeMusic,
            streamingServices.spotify,
          ][index];

          const destinationPlatform =
            sourcePlatform.value === streamingServices.youtubeMusic.value
              ? streamingServices.spotify
              : streamingServices.youtubeMusic;

          toast.close(toastRef.current!);

          toastRef.current = toastHelper(toast, {
            title: "Platforms Switched",
            description: `Now transferring from ${sourcePlatform.label}  to ${destinationPlatform.label} `,
          });

          setSourcePlatform(sourcePlatform);
          setDestinationPlatform(destinationPlatform);
          setSelectedPlaylists([]);
        }}
      >
        <Flex align="center" mb={6} gap={4}>
          <TabList
            display="grid"
            gridTemplateColumns="1fr 1fr"
            alignItems="center"
            gap="20px"
            bg="brand.card"
            border="0.5px solid"
            borderColor="border.subtle"
            borderRadius="999px"
            px="16px"
            maxWidth="xs"
          >
            {/* Source label */}
            <Tab
              value="youtube_music"
              p="8px 4px"
              display="flex"
              alignItems="center"
              gap="6px"
              position="relative"
              _selected={{
                borderBottom: 0,
                "&::after": {
                  content: '""',
                  position: "absolute",
                  height: "2px",
                  bottom: 0,
                  bg: "brand.accent",
                  // left: "0%",
                  left: "50%",
                  width: "40%",
                  transform: "translateX(-50%)",
                  rounded: "sm",
                },
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF3B30">
                <path d="M23.5 6.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.3-1C17.1 2.7 12 2.7 12 2.7s-5.1 0-8.3.2c-.5.1-1.5.1-2.3 1-.7.7-.9 2.3-.9 2.3S.2 8 .2 9.8v1.7c0 1.8.3 3.5.3 3.5s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.8.2 7.5.2 7.5.2s5.1 0 8.3-.2c.5-.1 1.5-.1 2.3-1 .7-.7.9-2.3.9-2.3s.3-1.8.3-3.5V9.8c0-1.8-.3-3.6-.3-3.6zM9.7 14.7V8.5l6.2 3.1-6.2 3.1z" />
              </svg>

              <Text fontSize="13px" fontWeight={500} color="text.primary">
                Youtube music
              </Text>
            </Tab>

            {/* Destination label */}
            <Tab
              value="spotify"
              p="8px 4px"
              display="flex"
              alignItems="center"
              gap="6px"
              position="relative"
              _selected={{
                borderBottom: 0,
                "&::after": {
                  content: '""',
                  position: "absolute",
                  height: "2px",
                  // width: "full",
                  // width: "40%",
                  // left: 0,
                  bottom: 0,
                  bg: "brand.accent",
                  left: "50%",
                  width: "40%",
                  transform: "translateX(-50%)",
                  rounded: "sm",
                },
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              <Text fontSize="13px" fontWeight={500} color="text.primary">
                Spotify
              </Text>
            </Tab>
          </TabList>

          {selectedPlaylists.length > 0 && (
            <Box
              fontSize="12px"
              bg="brand.accentDim"
              border="0.5px solid"
              borderColor="brand.accentBorder"
              color="brand.accent"
              borderRadius="999px"
              px="10px"
              py="2px"
              fontWeight={500}
            >
              {selectedPlaylists.length} selected
            </Box>
          )}
        </Flex>

        {/* Search */}
        <Box mb={8}>
          <Box
            as="input"
            bg="brand.card"
            border="0.5px solid"
            borderColor="border.subtle"
            borderRadius="8px"
            color="text.primary"
            fontFamily="body"
            fontSize="13px"
            px="12px"
            py="6px"
            w={{ base: "100%", sm: "200px" }}
            outline="none"
            transition="border-color .15s"
            _focus={{ borderColor: "brand.accentBorder" }}
            placeholder="Search playlists…"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            sx={{
              "::placeholder": { color: "text.muted2" },
            }}
          />
        </Box>

        <TabPanels>
          <TabPanel p={0}>
            <YoutubePlaylists
              search={search}
              selectedIds={selectedIds}
              onToggle={togglePlaylist}
            />
          </TabPanel>

          {/* initially not mounted */}
          <TabPanel p={0}>
            <SpotifyPlaylists
              search={search}
              selectedIds={selectedIds}
              onToggle={togglePlaylist}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
