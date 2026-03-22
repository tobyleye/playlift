import { Box, Flex, Text, useToast } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { client } from "@/api/api";
import { useMigrateContext } from "../context";
import { toastHelper } from "@/components/utils/toast";
import EllipsisLoader from "@/components/ellipsis-loader";

const SERIF = "'DM Serif Display', serif";

function SpotifyIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="3,8 6.5,11.5 13,4.5" />
    </svg>
  );
}

const PERMS = [
  {
    label: "Create playlists",
    desc: (
      <>
        New playlists are added
        <br />
        to your library
      </>
    ),
    icon: (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="#1DB954"
        strokeWidth="1.5"
        width="14"
        height="14"
      >
        <path strokeLinecap="round" d="M8 2v12M4 6l4-4 4 4" />
      </svg>
    ),
  },
  {
    label: "Add tracks",
    desc: (
      <>
        Songs are matched and
        <br />
        added to new playlists only
      </>
    ),
    icon: (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="#1DB954"
        strokeWidth="1.5"
        width="14"
        height="14"
      >
        <circle cx="8" cy="8" r="5.5" />
        <path strokeLinecap="round" d="M8 5.5v3l2 1.5" />
      </svg>
    ),
  },
  {
    label: "Never modifies existing",
    desc: (
      <>
        Your current playlists
        <br />
        are completely untouched
      </>
    ),
    icon: (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="#1DB954"
        strokeWidth="1.5"
        width="14"
        height="14"
      >
        <path strokeLinecap="round" d="M3 8h10M9 5l3 3-3 3" />
        <path strokeLinecap="round" d="M3 4v8" strokeDasharray="1.5 2" />
      </svg>
    ),
  },
];

export default function ConnectSpotifyStep() {
  const { spotifyConnected, setSpotifyConnected } = useMigrateContext();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      navigate("/convert/connect-spotify", { replace: true });
      setLoading(true);
      client
        .post("/connect/spotify/callback", { code })
        .then(() => {
          setSpotifyConnected(true);
          toastHelper(toast, {
            title: "Spotify connected!",
            description: "Successfully connected to your Spotify account.",
          });
        })
        .catch(() => {
          toastHelper(toast, {
            title: "Connection failed",
            description: "Unable to connect to Spotify. Please try again.",
            status: "error",
          });
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    url = `${url}?${new URLSearchParams(params).toString()}`;
    window.location.assign(url);
  };

  return (
    <Box display="flex" flexDirection="column" gap="2rem">
      {/* Hero */}
      <Flex align="center" gap="1.25rem">
        <Flex
          w="56px"
          h="56px"
          borderRadius="14px"
          bg="brand.spotifyDim"
          align="center"
          justify="center"
          flexShrink={0}
        >
          <SpotifyIcon />
        </Flex>
        <Box
          as="h1"
          fontFamily={SERIF}
          fontSize={{ base: "1.6rem", md: "2.2rem" }}
          color="text.primary"
          lineHeight={1.1}
        >
          Connect
          <br />
          <Box as="em" fontStyle="italic" color="text.muted2">
            Spotify
          </Box>
        </Box>
      </Flex>

      {/* Subtitle */}
      <Text
        fontSize="14px"
        color="text.muted"
        lineHeight={1.7}
        fontWeight={300}
        maxW="480px"
      >
        We'll create the migrated playlists directly in your Spotify library.
        Your existing playlists are never touched — we only ever add new ones.
      </Text>

      <Box h="0.5px" bg="border.subtle" />

      {/* Permissions */}
      <Flex gap="2rem" flexWrap="wrap">
        {PERMS.map((p) => (
          <Flex key={p.label} align="flex-start" gap="10px">
            <Flex
              w="30px"
              h="30px"
              borderRadius="8px"
              bg="brand.spotifyDim"
              align="center"
              justify="center"
              flexShrink={0}
              mt="1px"
            >
              {p.icon}
            </Flex>
            <Box>
              <Text
                fontSize="13px"
                fontWeight={500}
                color="text.primary"
                mb="2px"
              >
                {p.label}
              </Text>
              <Text
                fontSize="12px"
                color="text.muted"
                lineHeight={1.5}
              >
                {p.desc}
              </Text>
            </Box>
          </Flex>
        ))}
      </Flex>

      <Box h="0.5px" bg="border.subtle" />

      {/* Action */}
      {spotifyConnected ? (
        <Flex align="center" gap="12px" alignSelf="flex-start">
          <Flex
            align="center"
            gap="8px"
            bg="brand.spotifyDim"
            border="0.5px solid"
            borderColor="brand.spotifyBorder"
            borderRadius="999px"
            px="18px"
            py="8px"
            fontSize="14px"
            fontWeight={500}
            color="brand.spotify"
          >
            <CheckIcon />
            Connected
          </Flex>
          <Box
            as="button"
            fontSize="12px"
            color="text.muted2"
            cursor="pointer"
            bg="none"
            border="none"
            fontFamily="body"
            p={0}
            transition="color .15s"
            _hover={{ color: "text.muted" }}
            onClick={() => setSpotifyConnected(false)}
          >
            Switch account
          </Box>
        </Flex>
      ) : (
        <Box
          as="button"
          bg="brand.spotify"
          borderRadius="9px"
          color="white"
          fontFamily="body"
          fontWeight={700}
          fontSize="14px"
          py="13px"
          px="28px"
          cursor="pointer"
          transition="transform .15s"
          _hover={{ transform: "scale(1.02)" }}
          onClick={connectSpotify}
          display="flex"
          alignItems="center"
          alignSelf="flex-start"
          gap="8px"
          disabled={loading}
          opacity={loading ? 0.7 : 1}
        >
          {loading ? (
            <EllipsisLoader text="Connecting" />
          ) : (
            <>
              <SpotifyIcon size={18} />
              Continue with Spotify
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
