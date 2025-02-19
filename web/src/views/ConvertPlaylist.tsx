/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Button,
  Card,
  CardBody,
  Text,
  Heading,
  FormLabel,
  Select,
  useToast,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Spinner,
} from "@chakra-ui/react";
import { FormEvent, ReactNode, useState } from "react";
import api from "../api/api";
import SpotifyIcon from "../icons/spotify";
import YoutubeMusicIcon from "../icons/youtubemusic";
import useSWR from "swr";
import config from "../config";
import { Link, useNavigate } from "react-router-dom";

function PlaylistCard({
  playlist,
  onClick,
}: {
  playlist: {
    url: string;
    title: string;
    description: string;
    total_tracks: number;
    thumbnails: string[];
  };
  onClick: () => void;
}) {
  return (
    <Box
      pb={4}
      bg="gray.100"
      borderRadius={6}
      onClick={onClick}
      cursor="pointer"
    >
      <Box h={20} mb={4} bg="gray.600" display="flex" justifyContent="center">
        {playlist.thumbnails.length > 0 && (
          <Image
            width="auto"
            height="full"
            src={playlist.thumbnails[0]}
            alt="image"
          />
        )}
      </Box>
      <Box px={2}>
        <Text fontWeight={700}>{playlist.title}</Text>
        <Text>{playlist.description}</Text>
        <Text size="sm" color="gray.600">
          {playlist.total_tracks}{" "}
          {playlist.total_tracks > 1 ? `tracks` : `track`}
        </Text>
      </Box>
    </Box>
  );
}

function TransferModal({
  open,
  onClose,
  selectedPlatform,
  selectedPlaylist,
}: {
  open: boolean;
  onClose: () => void;
  selectedPlatform: string;
  selectedPlaylist: any;
}) {
  console.log({
    selectedPlatform,
    selectedPlaylist,
  });

  const toast = useToast();
  const navigate = useNavigate();

  const [transferring, setTransferring] = useState(false);
  const [transferDestination, setTransferDestination] = useState("");

  const startTransfer = async (e: FormEvent) => {
    e.preventDefault();
    console.log("selected playlist: ", selectedPlaylist);
    try {
      setTransferring(true);
      await api.convert(selectedPlaylist.url, transferDestination);

      toast({
        title: "conversion started",
        description: "Your playlist is being converted",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      navigate(`/home`);
    } catch (error) {
      console.log(error);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Complete your transfer</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={startTransfer}>
            <Box mb={4}>
              <FormLabel htmlFor="destinationPlatform">
                Specify destination platform
                <Box as="span" color="red.500" ml={1}>
                  *
                </Box>
              </FormLabel>

              <Select
                id="destinationPlatform"
                onChange={(e) => setTransferDestination(e.target.value)}
                value={transferDestination}
                required
              >
                <option value="" disabled>
                  Choose an option
                </option>
                {[
                  {
                    value: "spotify",
                    label: "Spotify",
                  },
                  {
                    value: "youtube_music",
                    label: "Youtube Music",
                  },
                ]
                  .filter((option) => option.value !== selectedPlatform)
                  .map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
              </Select>
            </Box>

            <Button
              isLoading={transferring}
              type="submit"
              width="full"
              colorScheme="purple"
            >
              Start transferring
            </Button>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function Loading({
  isLoading,
  children,
}: {
  isLoading: boolean;
  children: ReactNode;
}) {
  return isLoading ? (
    <Box py={10} display="flex" justifyContent="center" alignItems="center">
      <Spinner />
    </Box>
  ) : (
    <>{children}</>
  );
}

const ConvertPlaylist = () => {
  const [spotifyConnected, setSpotifyConnected] = useState(true);
  const [youtubeMusicConnected, setYoutubeMusicConnected] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [openTransferModal, setOpenTransferModal] = useState(false);

  const {
    data: spotifyPlaylists,
    error: spotifyPlaylistFetchError,
    isLoading: spotifyPlaylistsLoading,
  } = useSWR("spotify/playlists", () => api.getSpotifyPlaylists(), {
    onErrorRetry() {
      return false;
    },
  });

  const {
    data: youtubePlaylists,
    error: youtubePlaylistsFetchError,
    isLoading: youtubePlaylistsLoading,
  } = useSWR("youtube/playlists", () => api.getYoutubePlaylists(), {
    onErrorRetry() {
      return false;
    },
  });

  console.log("spotify playlists:", spotifyPlaylists);
  console.log("youtube playlists:", youtubePlaylists);

  const isAnyPlatformConnected = [spotifyConnected, youtubeMusicConnected].some(
    (val) => val === true
  );

  const handlePlaylistClick = (playlist: any, platform: string) => {
    setSelectedPlatform(platform);
    setSelectedPlaylist(playlist);
    setOpenTransferModal(true);
  };

  return (
    <Box>
      {isAnyPlatformConnected ? (
        <Box>
          <Card>
            <TransferModal
              selectedPlatform={selectedPlatform}
              open={openTransferModal}
              selectedPlaylist={selectedPlaylist}
              onClose={() => {
                setOpenTransferModal(false);
              }}
            />
            <CardBody pb={0}>
              <Heading size="md" mb={2}>
                Select a Playlist
              </Heading>
              <Text mb={4}>Choose from your connected accounts</Text>

              <Tabs
                onChange={(e) => {
                  console.log("ee:", e);
                }}
              >
                <TabList>
                  <Tab>Spotify</Tab>
                  <Tab>Youtube</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    <Loading isLoading={spotifyPlaylistsLoading}>
                      {spotifyPlaylistFetchError ? (
                        <Box display="flex" justifyContent="center" py={4}>
                          <Button
                            onClick={() =>
                              window.open(
                                config.SERVER_BASE_URL + "/connect/spotify",
                                "_blank"
                              )
                            }
                          >
                            Connect Spotify
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          {spotifyPlaylists && spotifyPlaylists.playlists && (
                            <SimpleGrid columns={3} gap={2}>
                              {spotifyPlaylists.playlists.map((p: any) => (
                                <PlaylistCard
                                  playlist={p}
                                  onClick={() =>
                                    handlePlaylistClick(p, "spotify")
                                  }
                                />
                              ))}
                            </SimpleGrid>
                          )}
                        </Box>
                      )}
                    </Loading>
                  </TabPanel>
                  <TabPanel>
                    <Loading isLoading={youtubePlaylistsLoading}>
                      {youtubePlaylistsFetchError ? (
                        <Box display="flex" justifyContent="center" py={4}>
                          <Button
                            onClick={() =>
                              window.open(
                                config.SERVER_BASE_URL + "/connect/youtube",
                                "_blank"
                              )
                            }
                          >
                            Connect Youtube
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          {youtubePlaylists && (
                            <SimpleGrid columns={3} gap={2}>
                              {youtubePlaylists.map((p: any) => (
                                <PlaylistCard
                                  playlist={p}
                                  onClick={() =>
                                    handlePlaylistClick(p, "youtube_music")
                                  }
                                />
                              ))}
                            </SimpleGrid>
                          )}
                        </Box>
                      )}
                    </Loading>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </Box>
      ) : (
        <Card>
          <CardBody>
            <Heading size="md" mb={6}>
              Connect Your Accounts
            </Heading>

            <HStack>
              <Button
                onClick={() =>
                  window.open(
                    config.SERVER_BASE_URL + "/connect/spotify",
                    "_blank"
                  )
                }
              >
                Connect Spotify
              </Button>
              <Button
                onClick={() =>
                  window.open(
                    config.SERVER_BASE_URL + "/connect/youtube",
                    "_blank"
                  )
                }
              >
                Connect Youtube
              </Button>
            </HStack>
          </CardBody>
        </Card>
      )}
    </Box>
  );
};

export default ConvertPlaylist;

export function OR() {
  return (
    <>
      <Box mt={4}></Box>

      <Box display="flex" alignItems="center" my={6}>
        <Box h="1px" bg="gray.200" flex={1} />
        <Box mx={2} color="gray.600">
          or
        </Box>
        <Box h="1px" bg="gray.200" flex={1} />
      </Box>
    </>
  );
}
