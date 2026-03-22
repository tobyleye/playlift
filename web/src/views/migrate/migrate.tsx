import { Box, Flex, Grid, Text, useToast, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { MigrateContext } from "./context";
import { Playlist, PlaylistSelection } from "@/types";
import { streamingServices } from "@/constants/constants";
import api from "@/api/api";
import { toastHelper } from "@/components/utils/toast";
import BackdropLoader from "@/components/backdrop-loader";
import { useSessionContext } from "@/contexts/session";

const SERIF = "'DM Serif Display', serif";

function GemIcon() {
  return (
    <Box
      w="20px"
      h="20px"
      bg="brand.accent"
      borderRadius="5px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <svg width="11" height="11" viewBox="0 0 11 11" fill="#0d0d0d">
        <polygon points="5.5,1 10,5.5 5.5,10 1,5.5" />
      </svg>
    </Box>
  );
}

function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function CheckSmIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="2,6 5,9 10,3" />
    </svg>
  );
}

function SuccessPanel({ totalPlaylists }: { totalPlaylists: number }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      gap={6}
      minH="50vh"
    >
      <Flex
        w="64px"
        h="64px"
        borderRadius="50%"
        bg="brand.spotifyDim"
        border="1px solid"
        borderColor="brand.spotifyBorder"
        align="center"
        justify="center"
        color="brand.spotify"
      >
        <CheckSmIcon />
      </Flex>
      <Box>
        <Box
          as="h2"
          fontFamily={SERIF}
          fontSize="2rem"
          color="text.primary"
          mb={2}
        >
          Migration started!
        </Box>
        <Text color="text.muted" maxW="360px" mx="auto">
          Successfully queued {totalPlaylists} playlist
          {totalPlaylists !== 1 ? "s" : ""} for migration. You can track
          progress in your dashboard.
        </Text>
      </Box>
      <Box
        as={Link}
        to="/home"
        bg="border.subtle"
        border="0.5px solid"
        borderColor="border.medium"
        borderRadius="9px"
        color="text.primary"
        fontFamily="body"
        fontSize="13px"
        fontWeight={500}
        px="20px"
        py="10px"
        cursor="pointer"
        transition="all .15s"
        _hover={{ bg: "border.medium", textDecoration: "none" }}
      >
        Go to dashboard
      </Box>
    </Flex>
  );
}

const STEP_DEFS = [
  {
    path: "connect-youtube",
    label: "Connect YouTube",
    desc: "Authorize read access to your playlists",
  },
  {
    path: "connect-spotify",
    label: "Connect Spotify",
    desc: "Authorize playlist creation access",
  },
  {
    path: "select-playlists",
    label: "Pick playlists",
    desc: "Select what you want to migrate",
  },
];

function stepFromPathname(pathname: string): 1 | 2 | 3 {
  if (pathname.includes("connect-spotify")) return 2;
  if (pathname.includes("select-playlists")) return 3;
  return 1;
}

export default function MigrateWizard() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const step = stepFromPathname(pathname);

  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [selectedPlaylists, setSelectedPlaylists] = useState<
    PlaylistSelection[]
  >([]);
  const [sourcePlatform, setSourcePlatform] = useState(
    streamingServices.youtubeMusic,
  );
  const [destinationPlatform, setDestinationPlatform] = useState(
    streamingServices.spotify,
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const { session } = useSessionContext();
  const toast = useToast();

  useEffect(() => {
    if (session) {
      api
        .getConnectionStatus()
        .then((data) => {
          setYoutubeConnected(data.youtube_connected);
          setSpotifyConnected(data.spotify_connected);
        })
        .catch(() => {})
        .finally(() => setLoadingStatus(false));
    } else {
      setLoadingStatus(false);
    }
  }, [session]);

  const togglePlaylist = (p: Playlist) => {
    const ids = selectedPlaylists.map((pl) => pl.playlist.playlist_id);
    if (ids.includes(p.playlist_id)) {
      setSelectedPlaylists(
        selectedPlaylists.filter(
          (pl) => pl.playlist.playlist_id !== p.playlist_id,
        ),
      );
    } else {
      setSelectedPlaylists([
        ...selectedPlaylists,
        { playlist: p, watch: false },
      ]);
    }
  };

  const startMigration = async () => {
    try {
      setMigrating(true);
      await api.convert(
        selectedPlaylists.map((pl) => ({
          id: pl.playlist.playlist_id,
          title: pl.playlist.title,
          watch: pl.watch,
        })),
        destinationPlatform.value,
        sourcePlatform.value,
      );
      setShowSuccess(true);
    } catch {
      toastHelper(toast, {
        title: "Migration failed",
        description: "Something went wrong. Please try again.",
        status: "error",
      });
    } finally {
      setMigrating(false);
    }
  };

  const canProceed =
    step === 1
      ? youtubeConnected
      : step === 2
        ? spotifyConnected
        : selectedPlaylists.length > 0;

  const goNext = () => {
    if (step === 1) navigate("/convert/connect-spotify");
    else if (step === 2) navigate("/convert/select-playlists");
    else startMigration();
  };

  const goBack = () => {
    if (step === 2) navigate("/convert/connect-youtube");
    else if (step === 3) navigate("/convert/connect-spotify");
  };

  const totalTracks = selectedPlaylists.reduce(
    (acc, pl) => acc + pl.playlist.total_tracks,
    0,
  );

  const footerInfo =
    step === 1 ? (
      youtubeConnected ? (
        <>
          <strong>YouTube</strong> connected
        </>
      ) : (
        "Connect YouTube to continue"
      )
    ) : step === 2 ? (
      spotifyConnected ? (
        <>
          <strong>Spotify</strong> connected
        </>
      ) : (
        "Connect Spotify to continue"
      )
    ) : selectedPlaylists.length > 0 ? (
      <>
        <strong>{selectedPlaylists.length}</strong> playlist
        {selectedPlaylists.length !== 1 ? "s" : ""} · {totalTracks} tracks
      </>
    ) : (
      "Select at least one playlist"
    );

  return (
    <MigrateContext.Provider
      value={{
        youtubeConnected,
        setYoutubeConnected,
        spotifyConnected,
        setSpotifyConnected,
        selectedPlaylists,
        setSelectedPlaylists,
        togglePlaylist,
        sourcePlatform,
        setSourcePlatform,
        destinationPlatform,
        setDestinationPlatform,
      }}
    >
      {migrating && <BackdropLoader loadingText="Starting migration" />}

      <Box bg="brand.bg" minH="100vh" fontFamily="body" color="text.primary">
        {/* Nav */}
        <Flex
          as="nav"
          align="center"
          justify="space-between"
          px={6}
          h="54px"
          borderBottom="0.5px solid"
          borderColor="border.subtle"
          bg="brand.surface"
        >
          <Flex
            as={Link}
            to="/"
            align="center"
            gap={2}
            fontFamily={SERIF}
            fontSize="1.1rem"
            color="text.primary"
          >
            <GemIcon />
            Playlift
          </Flex>
          <Text fontSize="12px" color="text.muted2">
            Step {step} of 3
          </Text>
        </Flex>

        {/* Shell */}
        <Grid
          templateColumns={{ base: "1fr", md: "280px 1fr" }}
          minH="calc(100vh - 54px)"
        >
          {/* Sidebar */}
          <Flex
            display={{ base: "none", md: "flex" }}
            direction="column"
            gap={8}
            bg="brand.surface"
            borderRight="0.5px solid"
            borderColor="border.subtle"
            px={6}
            py={8}
          >
            <Box>
              <Box
                as="h2"
                fontFamily={SERIF}
                fontSize="1.4rem"
                lineHeight={1.2}
                color="text.primary"
              >
                Let's get
                <br />
                <Box as="em" fontStyle="italic" color="text.muted">
                  your music
                </Box>
                <br />
                moving.
              </Box>
              <Text
                fontSize="13px"
                color="text.muted2"
                lineHeight={1.6}
                fontWeight={300}
                mt="0.4rem"
              >
                Connect your accounts and pick playlists to migrate. Takes
                about a minute.
              </Text>
            </Box>

            {/* Step list */}
            <Box display="flex" flexDirection="column">
              {STEP_DEFS.map((s, i) => {
                const num = i + 1;
                const isActive = step === num && !showSuccess;
                const isDone = num < step || showSuccess;
                return (
                  <Box
                    key={s.path}
                    position="relative"
                    display="flex"
                    gap="14px"
                    alignItems="flex-start"
                    py="12px"
                    sx={{
                      "&:not(:last-child)::after": {
                        content: '""',
                        position: "absolute",
                        left: "14px",
                        top: "44px",
                        width: "1px",
                        height: "calc(100% - 10px)",
                        background: "rgba(255,255,255,0.07)",
                      },
                    }}
                  >
                    <Flex
                      w="28px"
                      h="28px"
                      borderRadius="50%"
                      align="center"
                      justify="center"
                      fontSize="12px"
                      fontWeight={isActive ? 700 : 500}
                      flexShrink={0}
                      position="relative"
                      zIndex={1}
                      border="1px solid"
                      transition="all .3s"
                      borderColor={
                        isActive
                          ? "brand.accent"
                          : isDone
                            ? "brand.spotifyBorder"
                            : "rgba(255,255,255,0.12)"
                      }
                      bg={
                        isActive
                          ? "brand.accent"
                          : isDone
                            ? "brand.spotifyDim"
                            : "transparent"
                      }
                      color={
                        isActive
                          ? "brand.bg"
                          : isDone
                            ? "brand.spotify"
                            : "text.muted2"
                      }
                    >
                      {isDone ? <CheckSmIcon /> : num}
                    </Flex>
                    <Box pt="3px">
                      <Text
                        fontSize="13px"
                        fontWeight={500}
                        transition="color .3s"
                        color={
                          isActive
                            ? "text.primary"
                            : isDone
                              ? "brand.spotify"
                              : "text.muted2"
                        }
                      >
                        {s.label}
                      </Text>
                      <Text
                        fontSize="11px"
                        color="text.muted2"
                        mt="2px"
                        lineHeight={1.5}
                      >
                        {s.desc}
                      </Text>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Flex>

          {/* Main content */}
          <Flex direction="column">
            <Box
              flex={1}
              p={{ base: "1.5rem 1.25rem", md: "2.5rem 2.5rem 1.5rem" }}
              display="flex"
              flexDirection="column"
              gap={6}
            >
              {/* Mobile step bar */}
              <Flex
                display={{ base: "flex", md: "none" }}
                gap="6px"
                align="center"
              >
                {[1, 2, 3].map((i) => (
                  <Box
                    key={i}
                    flex={1}
                    h="3px"
                    borderRadius="999px"
                    transition="background .3s"
                    bg={
                      i < step || showSuccess
                        ? "brand.spotify"
                        : i === step
                          ? "brand.accent"
                          : "rgba(255,255,255,0.08)"
                    }
                  />
                ))}
                <Text fontSize="12px" color="text.muted2" whiteSpace="nowrap">
                  Step {step} of 3
                </Text>
              </Flex>

              {/* Panels */}
              {loadingStatus ? (
                <Flex flex={1} align="center" justify="center" minH="40vh">
                  <Spinner
                    thickness="3px"
                    speed="0.65s"
                    color="brand.accent"
                    size="md"
                  />
                </Flex>
              ) : showSuccess ? (
                <SuccessPanel totalPlaylists={selectedPlaylists.length} />
              ) : (
                <Outlet />
              )}
            </Box>

            {/* Footer bar */}
            {!showSuccess && (
              <Box
                borderTop="0.5px solid"
                borderColor="border.subtle"
                px={{ base: "1.25rem", md: "2rem" }}
                py="0.9rem"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap="12px"
                bg="brand.surface"
                mt="auto"
              >
                <Text fontSize="13px" color="text.muted">
                  {footerInfo}
                </Text>
                <Flex gap={2}>
                  {step > 1 && (
                    <Box
                      as="button"
                      bg="rgba(255,255,255,0.06)"
                      border="0.5px solid"
                      borderColor="border.subtle"
                      borderRadius="9px"
                      color="text.muted"
                      fontFamily="body"
                      fontSize="13px"
                      fontWeight={500}
                      px="18px"
                      py="9px"
                      cursor="pointer"
                      transition="all .15s"
                      _hover={{
                        bg: "rgba(255,255,255,0.1)",
                        color: "text.primary",
                      }}
                      onClick={goBack}
                    >
                      ← Back
                    </Box>
                  )}
                  <Box
                    as="button"
                    bg="brand.accent"
                    borderRadius="9px"
                    color="brand.bg"
                    fontFamily="body"
                    fontWeight={700}
                    fontSize="13px"
                    px="22px"
                    py="9px"
                    cursor={canProceed ? "pointer" : "not-allowed"}
                    opacity={canProceed ? 1 : 0.3}
                    transition="all .15s"
                    _hover={canProceed ? { transform: "scale(1.02)" } : {}}
                    onClick={canProceed ? goNext : undefined}
                    display="flex"
                    alignItems="center"
                    gap="6px"
                  >
                    {step === 3 ? "Start migration" : "Continue"}
                    <ArrowIcon />
                  </Box>
                </Flex>
              </Box>
            )}
          </Flex>
        </Grid>
      </Box>
    </MigrateContext.Provider>
  );
}
