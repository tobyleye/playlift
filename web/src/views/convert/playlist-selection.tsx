import {
  Box,
  Text,
  Heading,
  Icon,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Tab,
  useToast,
  ToastId,
} from "@chakra-ui/react";
import { ArrowRight, MusicIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Playlist } from "@/types";
import useSWRInfinite from "swr/infinite";
import api from "@/api/api";
import { streamingServices } from "@/constants/constants";
import { useConvertWizardContext } from "./context";
import { serverErrorToast, toastHelper } from "@/components/utils/toast";
import { SecondaryButton } from "@/components/buttons";
import { PlaylistSelect } from "@/components/playlist-select";
import EllipsisLoader from "@/components/ellipsis-loader";

type YoutubePlaylistsResponse = {
  playlists: Playlist[];
  continuation?: string;
};

type SpotifyPlaylistsResponse = {
  playlists: Playlist[];
  next_page: number;
};

function SpotifyPlaylists({
  selectedPlaylistsIds,
  onToggle,
}: {
  selectedPlaylistsIds: string[];
  onToggle: (playlist: Playlist) => void;
}) {
  const toast = useToast();

  const { data, size, setSize, isLoading } =
    useSWRInfinite<SpotifyPlaylistsResponse>(
      (_, previousData) => {
        if (!previousData) return ["spotify-playlists", 1];

        return ["spotify-playlists", previousData.next_page];
      },
      (key: [string, number]) => {
        const [, page] = key;
        return api.getSpotifyPlaylists(page);
      },
      {
        onError() {
          serverErrorToast(toast, {
            id: "youtube-error",
          });
        },
        shouldRetryOnError: false,
      }
    );

  console.log("playlistsResponse..", data);

  const lastPageData = data ? data[data.length - 1] : null;

  const playlists = data ? data.map((d) => d.playlists).flat() : [];
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  return (
    <Box
      css={{
        "&": {
          "--btn-border-selected": "rgb(74, 222, 128)",
          "--btn-bg-selected": "rgba(34, 197, 94, 0.3)",
          "--checkbox-bg-selected": "rgb(34, 197, 94)",
        },
      }}
    >
      <PlaylistSelect
        playlists={playlists}
        selected={selectedPlaylistsIds}
        onToggle={onToggle}
        isLoading={isLoading}
      />

      {lastPageData && lastPageData.next_page > 0 && (
        <Box display="flex" justifyContent="center" pt={6}>
          <SecondaryButton
            minW={120}
            onClick={() => setSize(size + 1)}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? <EllipsisLoader text="Loading" /> : `Next`}
          </SecondaryButton>
        </Box>
      )}

      {lastPageData && lastPageData.next_page < 0 && (
        <Box textAlign="center" mt={4}>
          <Text color="whiteAlpha.600" fontSize={"sm"}>
            You've come to the end of your playlists
          </Text>
        </Box>
      )}
    </Box>
  );
}

const YoutubePlaylists = ({
  selectedPlaylistsIds,
  onToggle,
}: {
  selectedPlaylistsIds: string[];
  onToggle: (playlist: Playlist) => void;
}) => {
  const toast = useToast();

  const { data, size, setSize, isLoading } =
    useSWRInfinite<YoutubePlaylistsResponse>(
      (pageIndex, previousData) => {
        return { pageIndex, continuation: previousData?.continuation };
      },
      (args) => {
        const { continuation } = args;
        return api.getYoutubePlaylists(continuation);
      },
      {
        onError() {
          serverErrorToast(toast, {
            id: "spotify-error",
          });
        },
        shouldRetryOnError: false,
      }
    );

  const lastPageData = data ? data[data.length - 1] : null;

  const playlists = data ? data.map((d) => d.playlists).flat() : [];

  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  return (
    <Box
      css={{
        "&": {
          "--btn-border-selected": "rgb(248, 113, 113)",
          "--btn-bg-selected": "rgba(239, 68, 68, 0.3)",
          "--checkbox-bg-selected": "rgb(239, 68, 68)",
        },
      }}
    >
      <PlaylistSelect
        playlists={playlists}
        selected={selectedPlaylistsIds}
        onToggle={onToggle}
        isLoading={isLoading}
      />

      {lastPageData && lastPageData.continuation && (
        <Box display="flex" justifyContent="center" pt={6}>
          <SecondaryButton
            minW={120}
            onClick={() => setSize(size + 1)}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? <EllipsisLoader text="Loading" /> : `Next`}
          </SecondaryButton>
        </Box>
      )}

      {lastPageData && !lastPageData.continuation && (
        <Box textAlign="center" mt={4}>
          <Text color="whiteAlpha.600" fontSize={"sm"}>
            You've come to the end of your playlists
          </Text>
        </Box>
      )}
    </Box>
  );
};

function PlaylistsSelection() {
  const {
    selectedPlaylists,
    togglePlaylist,
    setSelectedPlaylists,
    destinationPlatform,
    setDestinationPlatform,
    setSourcePlatform,
  } = useConvertWizardContext();

  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  //  ids of the selected playlists
  const selectedPlaylistsIds = selectedPlaylists.map((p) => p.playlist_id);

  const toast = useToast();
  const toastRef = useRef<ToastId>();

  return (
    <Box color="white" pt={10}>
      <Box display="flex" alignItems="center" justifyContent="center" mb={4}>
        <Box w={3} h={3} bg="whiteAlpha.600" rounded="full" mr={2} />
        <Text>From</Text>
        <Icon mx={4}>
          <ArrowRight />
        </Icon>
        <Icon mr={2}>
          <MusicIcon />
        </Icon>
        <Text>{destinationPlatform.label}</Text>
      </Box>
      <Box textAlign="center" mb={8}>
        <Heading mb={2} fontWeight={"bold"} fontSize="3xl">
          Select Playlists to Transfer
        </Heading>
        <Text color="whiteAlpha.800">
          Choose which playlists you'd like to move to{" "}
          {destinationPlatform.label}
        </Text>
      </Box>

      <Box maxW="2xl" mx="auto">
        <Tabs
          isLazy
          index={activeTabIndex}
          onChange={(index) => {
            setActiveTabIndex(index);
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
          <TabList
            borderBottom="none"
            display="grid"
            gridTemplateColumns="1fr 1fr"
            gap={2}
            mx="auto"
            mb={4}
            rounded="md"
            bg="rgba(255, 255, 255, 0.1)"
            py={1}
            px={1}
          >
            <Tab
              value="youtube_music"
              color="white"
              py={1}
              px={3}
              bg="rgba(0, 0, 0, 0)"
              fontWeight={500}
              fontSize="sm"
              rounded="md"
              _selected={{
                bg: "youtube-red",
              }}
            >
              Youtube Music
            </Tab>
            <Tab
              value="spotify"
              py={1}
              px={3}
              bg="rgba(0, 0, 0, 0)"
              fontWeight={500}
              color="white"
              fontSize="sm"
              rounded="md"
              _selected={{
                bg: "spotify-green",
              }}
            >
              Spotify
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0}>
              <YoutubePlaylists
                selectedPlaylistsIds={selectedPlaylistsIds}
                onToggle={togglePlaylist}
              />
            </TabPanel>
            {/* initially not mounted */}
            <TabPanel p={0}>
              <SpotifyPlaylists
                selectedPlaylistsIds={selectedPlaylistsIds}
                onToggle={togglePlaylist}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
}

export default PlaylistsSelection;
