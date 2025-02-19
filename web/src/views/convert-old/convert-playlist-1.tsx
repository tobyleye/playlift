import { useState } from "react";
import { ArrowRight, Music, ArrowLeftRight } from "lucide-react";
import {
  Box,
  Flex,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  Image,
  Spinner,
} from "@chakra-ui/react";

export default function ConvertPlaylist() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [platform, setPlatform] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const detectPlatform = (url: string) => {
    if (url.includes("spotify.com")) return "spotify";
    if (url.includes("music.apple.com")) return "apple";
    if (url.includes("music.youtube.com")) return "youtube";
    if (url.includes("deezer.com")) return "deezer";
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPlaylistUrl(url);
    setPlatform(detectPlatform(url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulating API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    // Here you would typically handle the actual conversion process
    console.log("Converting playlist:", playlistUrl);
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
      bgGradient="linear(to-br, indigo.100, purple.100, pink.100)"
      // _dark={{ bgGradient: "linear(to-br, gray.900, purple.900, indigo.900)" }}

      // className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4"
    >
      <Box
        w="full"
        maxW="4xl"
        bg="white"
        _dark={{ bg: "gray.800" }}
        rounded="2xl"
        shadow="2xl"
        overflow="hidden"
      >
        <Flex direction={{ base: "column", md: "row" }}>
          <Box
            w={{ md: "50%" }}
            // bgGradient="linear(to-br, indigo.600, purple.600)"
            bgGradient="linear(to-br, green.200, pink.500)"
            p={8}
            color="black"
            display="flex"
            flexDirection="column"
            justifyContent="center"
          >
            <Music className="w-16 h-16 mb-6" />
            <Heading as="h1" size="xl" mb={4}>
              Playlist Converter
            </Heading>
            <Text mb={6}>
              Transform your music experience. Convert playlists between
              platforms with ease.
            </Text>
            <Flex alignItems="center" mx={2} fontSize="sm">
              <Box bg="whiteAlpha.200" rounded="full" px={3} py={1}>
                Spotify
              </Box>
              <ArrowLeftRight className="w-4 h-4" />
              <Box bg="whiteAlpha.200" rounded="full" px={3} py={1}>
                Apple Music
              </Box>
              <ArrowLeftRight className="w-4 h-4" />
              <Box bg="whiteAlpha.200" rounded="full" px={3} py={1}>
                YouTube
              </Box>
            </Flex>
          </Box>
          <Box w={{ md: "50%" }} p={8}>
            <Heading
              as="h2"
              size="lg"
              mb={6}
              color="gray.800"
              _dark={{ color: "white" }}
            >
              Convert Your Playlist
            </Heading>
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormControl id="playlist-url" isRequired>
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.700"
                  _dark={{ color: "gray.300" }}
                >
                  Playlist URL
                </FormLabel>
                <Input
                  type="url"
                  placeholder="https://open.spotify.com/playlist/..."
                  value={playlistUrl}
                  onChange={handleInputChange}
                  w="full"
                />
              </FormControl>
              {platform && (
                <Flex
                  alignItems="center"
                  mx={2}
                  bg="indigo.50"
                  _dark={{ bg: "indigo.900Alpha.30" }}
                  rounded="lg"
                  p={2}
                >
                  <Image
                    src={`/placeholder.svg?height=24&width=24`}
                    alt={`${platform} logo`}
                    boxSize={6}
                    rounded="full"
                  />
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color="indigo.700"
                    _dark={{ color: "indigo.300" }}
                    textTransform="capitalize"
                  >
                    {platform} Playlist Detected
                  </Text>
                </Flex>
              )}
              <Button
                type="submit"
                w="full"
                bg="indigo.600"
                _hover={{ bg: "indigo.700" }}
                color="white"
                isDisabled={isLoading || !platform}
              >
                {isLoading ? (
                  <>
                    <Spinner mr={2} size="sm" />
                    Converting...
                  </>
                ) : (
                  <>
                    Convert Playlist
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
            <Text
              fontSize="xs"
              textAlign="center"
              color="gray.500"
              _dark={{ color: "gray.400" }}
              mt={6}
            >
              By converting, you agree to our Terms of Service and Privacy
              Policy.
            </Text>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}
