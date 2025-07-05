import {
  Box,
  Text,
  Heading,
  Icon,
  SimpleGrid,
  chakra,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Tab,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Spinner,
} from "@chakra-ui/react";
import { ArrowRight, CheckIcon, MusicIcon } from "lucide-react";
import { useState } from "react";
import { Playlist } from "@/types";
import useSWR from "swr";
import api from "@/api/api";
import { Link } from "react-router-dom";
import { streamingServices } from "@/constants/constants";

const formatPlatform = (platform: string) => {
  return platform.replace(/_/g, " ");
};

function SpotifyPlaylists({
  selectedPlaylistsIds,
  onToggle,
}: {
  selectedPlaylistsIds: string[];
  onToggle: (playlist: Playlist) => void;
}) {
  // this is seperated from the component so it's not fetched immedialtely
  // and only fetched when the user selects the spotify tab
  const {
    data: spotifyPlaylists,
    isLoading: isLoadingSpotify,
    error: _spotifyError,
  } = useSWR("spotify-playlists", () => api.getSpotifyPlaylists());

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
      <PlaylistList
        playlists={spotifyPlaylists?.playlists ?? []}
        selected={selectedPlaylistsIds}
        onToggle={onToggle}
        isLoading={isLoadingSpotify}
      />
    </Box>
  );
}

export default function PlaylistsSelection() {
  // a map of selected playlist id to the playlist object
  const [selectedPlaylistsMap, setSelectedPlaylistsMap] = useState<
    Record<string, Playlist>
  >({});

  //  get the selected playlists as an array
  const selectedPlaylists = Object.values(selectedPlaylistsMap);
  //  ids of the selected playlists
  const selectedPlaylistsIds = Object.keys(selectedPlaylistsMap);

  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const sourcePlatform = [
    streamingServices.youtubeMusic,
    streamingServices.spotify,
  ][activeTabIndex];

  const destinationPlatform =
    sourcePlatform.value === streamingServices.youtubeMusic.value
      ? streamingServices.spotify
      : streamingServices.youtubeMusic;

  // console.log("source --", sourcePlatform);

  const {
    data: youtubePlaylists,
    isLoading: loadingYoutubePlaylists,
    error,
  } = useSWR("youtube-playlists", () => api.getYoutubePlaylists());

  // console.log("spotify playlists:", spotifyPlaylists);

  const togglePlaylist = (p: Playlist) => {
    const newPlaylistsMap = { ...selectedPlaylistsMap };

    if (selectedPlaylistsMap[p.playlist_id]) {
      delete newPlaylistsMap[p.playlist_id];
    } else {
      newPlaylistsMap[p.playlist_id] = p;
    }

    setSelectedPlaylistsMap(newPlaylistsMap);
  };

  const startMigration = async () => {
    // Todo: replace with a confirmation modal
    const confirm = window.confirm(
      `Are you sure you want to migrate ${
        selectedPlaylists.length
      } playlists from ${formatPlatform(sourcePlatform.label)} to ${
        destinationPlatform.label
      }`
    );

    if (!confirm) return;

    const body = {
      destination: destinationPlatform.value,
      source: sourcePlatform.value,
      playlists: selectedPlaylists.map((pl) => pl.playlist_id),
    };

    console.log("body..", body);
    try {
      await api.convert(
        body.playlists,
        destinationPlatform.value,
        sourcePlatform.value
      );
      console.log("migration started successfully!");
      setShowSuccess(true);
    } catch (err) {
      console.error("Error starting migration:", err);
      alert(
        "An error occurred while starting the migration. Please try again."
      );
      return;
    }
  };

  return (
    <Box color="white" pt={10}>
      <SuccessModal show={showSuccess} />
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
          Select Playlists to Migrate
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
            console.log("index..", index);
            setActiveTabIndex(index);
            setSelectedPlaylistsMap({});
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
              <Box
                css={{
                  "&": {
                    "--btn-border-selected": "rgb(248, 113, 113)",
                    "--btn-bg-selected": "rgba(239, 68, 68, 0.3)",
                    "--checkbox-bg-selected": "rgb(239, 68, 68)",
                  },
                }}
              >
                <PlaylistList
                  playlists={youtubePlaylists ?? []}
                  selected={selectedPlaylistsIds}
                  isLoading={loadingYoutubePlaylists}
                  onToggle={togglePlaylist}
                />
              </Box>
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

        <Box my={4} textAlign="center" color="whiteAlpha.800">
          {selectedPlaylists.length} playlists selected from{" "}
          {sourcePlatform.label}
        </Box>

        <Box
          position="fixed"
          bottom={0}
          left={0}
          width="full"
          px={4}
          pb={6}
          display="flex"
          justifyContent="center"
          zIndex={5}
        >
          <Button
            disabled={selectedPlaylists.length === 0}
            onClick={startMigration}
          >
            Start migration
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function SuccessModal({ show }: { show: boolean }) {
  return (
    <Modal isCentered isOpen={show} onClose={() => {}}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader></ModalHeader>

        <ModalBody textAlign="center">
          <Heading mb={1}>Successful</Heading>
          <Link to="/home">Go home</Link>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function PlaylistList({
  isLoading,
  playlists,
  onToggle,
  selected,
}: {
  playlists: Playlist[];
  onToggle: (playlist: Playlist) => void;
  selected: string[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="lg"
        />
      </Box>
    );
  }

  return (
    <Box display="grid" gap={4}>
      {playlists.map((pl) => {
        const isSelected = selected.includes(pl.playlist_id);
        return (
          <Box
            key={pl.playlist_id}
            as="button"
            display="flex"
            alignItems="center"
            gap={4}
            py={4}
            px={4}
            rounded="lg"
            border="1px solid"
            borderColor={"whiteAlpha.200"}
            w="full"
            bg="whiteAlpha.100"
            _hover={{ bg: "whiteAlpha.300" }}
            transition="ease .25s"
            aria-selected={isSelected}
            _selected={{
              bg: "var(--btn-bg-selected)",
              borderColor: "var(--btn-border-selected)",
            }}
            onClick={() => {
              onToggle(pl);
            }}
          >
            <Box
              w={4}
              h={4}
              display="flex"
              alignItems="center"
              justifyContent="center"
              rounded={"4px"}
              border="2px solid"
              borderColor={
                isSelected ? "var(--checkbox-bg-selected)" : "whiteAlpha.700"
              }
              bg={isSelected ? "var(--checkbox-bg-selected)" : "transparent"}
            >
              {isSelected && <CheckIcon />}
            </Box>

            <Box textAlign="left">
              <Text
                fontWeight="medium"
                style={{
                  color: "var(--color)",
                }}
              >
                {pl.title}
              </Text>
              <Text fontSize="sm" color="whiteAlpha.700">
                {pl.total_tracks} tracks
              </Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
