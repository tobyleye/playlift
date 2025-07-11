import { client } from "@/api/api";
import { Box, Icon, Heading, Text, chakra } from "@chakra-ui/react";
import { CheckIcon, MusicIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useConvertWizardContext } from "./context";
import withSession from "@/hocs/withSession";

// eslint-disable-next-line react-refresh/only-export-components
export default withSession(function ConnectSpotify() {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const navigate = useNavigate();

  const { spotifyConnected, setSpotifyConnected } = useConvertWizardContext();

  useEffect(() => {
    if (error) {
      console.log("error...", error);
    }
  }, [error]);

  useEffect(() => {
    const loginCallback = async () => {
      try {
        setLoading(true);
        await client.post("/connect/spotify/callback", {
          code,
        });
        setSpotifyConnected(true);
      } catch (err) {
        navigate("/convert/connect-spotify", { replace: true });
        console.error("Error connecting to Spotify:", err);
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      loginCallback();
    }
  }, [code, navigate, setSpotifyConnected]);

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
        : window.location.origin + "/spotify/callback",
    };

    console.log("params..", params);

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
          <Icon w="12" h="12">
            <MusicIcon />
          </Icon>
        </Box>
        <Heading fontSize="3xl" mb={4} fontWeight={"bold"}>
          Connect Your Spotify Account
        </Heading>
        <Text mb={8} fontSize="md" maxW="md" mx="auto" color="gray.200">
          We'll access your playlists to prepare them for migration. Your login
          details are never stored.
        </Text>
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
          {spotifyConnected ? (
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
});
