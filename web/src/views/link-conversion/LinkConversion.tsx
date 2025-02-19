/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Button,
  Card,
  CardBody,
  Text,
  Heading,
  FormLabel,
  Input,
  Select,
  Flex,
  Icon,
  useToast,
} from "@chakra-ui/react";
import { FormEvent, useEffect, useState } from "react";
import { Music, ArrowLeftRight } from "lucide-react";
import api from "../../api/api";
import SpotifyIcon from "../../icons/spotify";
import YoutubeMusicIcon from "../../icons/youtubemusic";

const LinkPreview = ({ type, data }: { type: string; data: any }) => {
  const tracks = data.tracks.tracks || [];
  return (
    <Box>
      <Text>{data.name}</Text>
      {tracks.length > 2 ? (
        <Box>
          {tracks
            .slice(0, 2)
            .map((track: any) => track.name)
            .join(",")}
          <Box>...and {tracks.length - 2} more</Box>
        </Box>
      ) : (
        <Box>{tracks.join(" and ")}</Box>
      )}
    </Box>
  );
};

export default function ConversionThroughLink() {
  const [playlistUrl, setPlaylistUrl] = useState(
    "https://open.spotify.com/playlist/4m1ePQEDglGYzlO7PPNBDm"
  );
  const [platform, setPlatform] = useState<string | null>("");
  const [destination, setDestination] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [linkPreview, setLinkPreview] = useState<null | any>(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  const toast = useToast();

  useEffect(() => {
    setPlatform(detectPlatform(playlistUrl));
  }, [playlistUrl]);

  const clearPreview = () => {
    setLinkPreview(null);
    setPreviewLoaded(false);
    setPlaylistUrl("");
  };

  const previewLink = async () => {
    try {
      setLoadingPreview(true);
      const preview = await api.previewLink(playlistUrl);
      setLinkPreview(preview);
      setPreviewLoaded(true);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const convert = async () => {
    try {
      setLoadingPreview(true);
      await api.convert(playlistUrl, destination);
      setLoadingPreview(false);
      toast({
        title: "conversion started",
        description: "Your playlist is being converted",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      clearPreview();
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (linkPreview && previewLoaded) {
      convert();
    } else {
      previewLink();
    }
  };

  const detectPlatform = (url: string) => {
    if (url.includes("spotify.com")) return "spotify";
    if (url.includes("music.youtube.com")) return "youtubemusic";
    // if (url.includes("music.apple.com")) return "apple";
    // if (url.includes("deezer.com")) return "deezer";
    return null;
  };

  return (
    <Box>
      <Box maxW={500} mx="auto" mt={10} mb={10}>
        <Card rounded="lg" overflow="hidden">
          <Box
            w={"full"}
            // bgGradient="linear(to-br, indigo.600, purple.600)"
            bgGradient="linear(to-br, green.200, pink.500)"
            p={8}
            color="black"
            display="flex"
            flexDirection="column"
            justifyContent="center"
          >
            <Icon as={Music} w={12} h={12} mb={4} />

            <Heading as="h1" size="xl" mb={4}>
              Playlist Converter
            </Heading>
            <Text mb={6}>
              Transform your music experience. Convert playlists between
              platforms with ease.
            </Text>
            <Flex alignItems="center" columnGap={1} fontSize="sm">
              <Box bg="whiteAlpha.200" rounded="full" px={3} py={1}>
                Spotify
              </Box>
              <Icon as={ArrowLeftRight} w={4} h={4} />

              <Box bg="whiteAlpha.200" rounded="full" px={3} py={1}>
                Apple Music
              </Box>

              <Icon as={ArrowLeftRight} w={4} h={4} />

              <Box bg="whiteAlpha.200" rounded="full" px={3} py={1}>
                YouTube
              </Box>
            </Flex>
          </Box>
          <CardBody>
            <Heading fontSize={24} mb={6}>
              Start converting now
            </Heading>
            <form onSubmit={handleSubmit}>
              {previewLoaded && linkPreview ? (
                <Box>
                  <LinkPreview
                    type={linkPreview.type}
                    data={linkPreview.object}
                  />
                  <Box mt={4}>
                    <FormLabel htmlFor="destinationPlatform">
                      Specify destination platform
                      <Box as="span" color="red.500" ml={1}>
                        *
                      </Box>
                    </FormLabel>
                    <div className="relative">
                      <Select
                        id="destinationPlatform"
                        onChange={(e) => setDestination(e.target.value)}
                        value={destination}
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
                          .filter((option) => option.value !== platform)
                          .map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                      </Select>
                    </div>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Box mb={4}>
                    <FormLabel htmlFor="playlistUrl">
                      Playlist URL{" "}
                      <Box as="span" color="red.500">
                        *
                      </Box>
                    </FormLabel>
                    <Box mb={2}>
                      <Input
                        id="playlistUrl"
                        value={playlistUrl}
                        onChange={(e) => setPlaylistUrl(e.target.value)}
                        required
                      />
                    </Box>
                    {platform && (
                      <Box
                        display="flex"
                        alignItems={"center"}
                        bg="teal.100"
                        color="teal.900"
                        py={2}
                        px={2}
                        rounded="lg"
                      >
                        <Box mr={2}>
                          {platform === "youtube" && (
                            <div>
                              <YoutubeMusicIcon />
                            </div>
                          )}
                          {platform === "spotify" && (
                            <div>
                              <SpotifyIcon />{" "}
                            </div>
                          )}
                        </Box>
                        <Box>
                          <Text>
                            <Box as="span" textTransform="capitalize">
                              {platform}{" "}
                            </Box>
                            Playlist Detected
                          </Text>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              <Flex mt={8} direction="column" gap={2}>
                <Button
                  isLoading={loadingPreview}
                  loadingText="Loading preview..."
                  type="submit"
                  width="full"
                  colorScheme="teal"
                >
                  {previewLoaded && linkPreview ? "Convert" : "Submit"}
                </Button>
                {previewLoaded && linkPreview && (
                  <Button
                    onClick={clearPreview}
                    type="submit"
                    width="full"
                    variant="ghost"
                    colorScheme="red"
                  >
                    Clear
                  </Button>
                )}
              </Flex>
            </form>
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
}
