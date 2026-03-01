import { client } from "@/api/api";
import { Box, Icon, Heading, Text, chakra, useToast } from "@chakra-ui/react";
import { CheckIcon, MusicIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useConvertWizardContext } from "./context";
import { toastHelper } from "@/components/utils/toast";
import EllipsisLoader from "@/components/ellipsis-loader";

// eslint-disable-next-line react-refresh/only-export-components
export default function ConnectSpotify() {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const { spotifyConnected, setSpotifyConnected } = useConvertWizardContext();

  const [showDescription] = useState(() => !spotifyConnected);

  const toast = useToast();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setCode(code);
      navigate("/convert/connect-spotify", { replace: true });
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    if (code) {
      setLoading(true);
      client
        .post("/connect/spotify/callback", {
          code,
        })
        .then(() => {
          setSpotifyConnected(true);
          toastHelper(toast, {
            title: "Spotify connected!",
            description: "successfully connected to your Spotify account.",
          });
        })
        .catch((err) => {
          console.error("Error connecting to Spotify:", err);
          toastHelper(toast, {
            title: "Connection failed",
            description: `Unable to connect to Spotify. Please try again.`,
            status: "error",
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [code, setSpotifyConnected, toast]);

  const connectSpotify = () => {
    let url = "https://accounts.spotify.com/authorize";

    const isDev = import.meta.env.DEV;

    const params = {
      response_type: "code",
      client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
      scope: [
        "user-read-email",
        "user-library-read",
        "user-library-modify",
        "playlist-read-private",
        "playlist-modify-private",
        "playlist-modify-public",
      ].join(" "),

      redirect_uri: isDev
        ? import.meta.env.VITE_SPOTIFY_REDIRECT_URI
        : window.location.href,
    };

    const queryString = new URLSearchParams(params).toString();
    url = `${url}?${queryString}`;
    window.location.assign(url);
  };
  return (
    <Box minH="80vh" display="flex" justifyContent="center" alignItems="center">
      <Box color="white" textAlign="center">
        <Box
          w={24}
          h={24}
          mx="auto"
          mb={6}
          rounded="full"
          display="flex"
          alignItems="center"
          color="white"
          bg="spotify-green"
          justifyContent="center"
        >
          <Icon w="14" h="14">
            <MusicIcon />
          </Icon>
        </Box>
        <Heading fontSize="3xl" mb={4} fontWeight={"bold"}>
          Connect Your Spotify Account
        </Heading>

        {showDescription && (
          <Text mb={8} fontSize="md" maxW="md" mx="auto" color="gray.200">
            Now let's connect your Spotify account to access your playlists and
            music library.
          </Text>
        )}
        <chakra.button
          bg="spotify-green"
          color="white"
          rounded="full"
          py={2}
          px={8}
          fontWeight="bold"
          disabled={spotifyConnected || loading}
          transition=".25s ease"
          _hover={{
            opacity: 0.9,
          }}
          _disabled={{
            opacity: 0.6,
          }}
          onClick={() => {
            if (!spotifyConnected) {
              connectSpotify();
            }
          }}
        >
          {loading ? (
            <EllipsisLoader text="Connecting" />
          ) : spotifyConnected ? (
            <Box display="flex" alignItems="center" gap={2}>
              <CheckIcon />
              Connected to Spotify
            </Box>
          ) : loading ? (
            `loading..`
          ) : (
            `Connect spotify`
          )}
        </chakra.button>
      </Box>
    </Box>
  );
}
