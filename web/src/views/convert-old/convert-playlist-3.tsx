import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
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
      minH="screen"
      bgGradient="linear(to-b, purple.50, blue.100)"
      _dark={{ bgGradient: "linear(to-b, gray.900, gray.800)" }}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        w="full"
        maxW="md"
        bg="white"
        _dark={{ bg: "gray.800" }}
        rounded="lg"
        shadow="xl"
        p={6}
        spaceY={6}
      >
        <Heading
          as="h1"
          fontSize="2xl"
          fontWeight="bold"
          textAlign="center"
          color="purple.800"
          _dark={{ color: "purple.200" }}
        >
          Convert Your Playlist
        </Heading>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Flex alignItems="center" spaceX={2}>
              <Image
                src={`/placeholder.svg?height=24&width=24`}
                alt={`${platform} logo`}
                boxSize={6}
                rounded="full"
              />
              <Text
                fontSize="sm"
                fontWeight="medium"
                color="gray.600"
                _dark={{ color: "gray.400" }}
                textTransform="capitalize"
              >
                {platform} Playlist Detected
              </Text>
            </Flex>
          )}
          <Button
            type="submit"
            w="full"
            bg="purple.600"
            _hover={{ bg: "purple.700" }}
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
        >
          By converting, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </Box>
    </Box>
  );
}
