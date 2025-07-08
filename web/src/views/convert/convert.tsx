import { Box, Icon, Spinner, chakra } from "@chakra-ui/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import Nav from "@/components/nav";
import { useTransition, animated } from "@react-spring/web";
import WizardProgress from "./wizard-progress";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ConvertWizardContext } from "./context";
import api from "@/api/api";
import { Playlist } from "@/types";
import { streamingServices } from "@/constants/constants";
import Success from "./success-screen";

const useStep = () => {
  const [step, setStep] = useState(1);
  const prevStep = useRef(-1);

  const setter = (val: number) => {
    if (step !== val) {
      prevStep.current = step;
    }
    setStep(val);
  };

  return [step, prevStep.current, setter] as [
    number,
    number,
    (val: number) => void
  ];
};

const formatPlatform = (platform: string) => {
  return platform.replace(/_/g, " ");
};

export default function ConversionWizard() {
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [loadingConnectionStatus, setLoadingConnectionStatus] = useState(true);

  const [selectedPlaylists, setSelectedPlaylists] = useState<Playlist[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sourcePlatform, setSourcePlatform] = useState(
    streamingServices.youtubeMusic
  );
  const [destinationPlatform, setDestinationPlatform] = useState(
    streamingServices.spotify
  );

  const location = useLocation();

  const paths = location.pathname.split("/");
  const stepPath = paths.length > 2 ? paths[2] : "";

  useEffect(() => {
    api
      .getConnectionStatus()
      .then((data) => {
        setYoutubeConnected(data.youtube_connected);
        setSpotifyConnected(data.spotify_connected);
      })
      .catch(() => {})
      .finally(() => {
        setLoadingConnectionStatus(false);
      });
  }, []);

  const togglePlaylist = (p: Playlist) => {
    const selectedPlaylistIds = selectedPlaylists.map((pl) => pl.playlist_id);
    if (selectedPlaylistIds.includes(p.playlist_id)) {
      setSelectedPlaylists(
        selectedPlaylists.filter((pl) => pl.playlist_id !== p.playlist_id)
      );
    } else {
      setSelectedPlaylists([...selectedPlaylists, p]);
    }
  };

  const steps = [
    {
      label: 1,
      path: "connect-youtube",
      completed: youtubeConnected,
    },
    {
      label: 2,
      path: "connect-spotify",
      completed: spotifyConnected,
    },
    {
      label: 3,
      path: "select-playlists",
      completed: false,
    },
  ];

  const stepIndex = steps.findIndex((step) => step.path === stepPath);
  const curStep = steps[stepIndex];
  const totalSteps = steps.length;
  const nextStep = stepIndex < totalSteps - 1 ? steps[stepIndex + 1] : null;

  const navigate = useNavigate();

  // const transitions = useTransition(step, {
  //   from: { opacity: 0, x: step > prevStep ? 20 : -20 },
  //   enter: { opacity: 1, x: 0 },
  //   leave: { opacity: 0, x: step > prevStep ? -20 : 20 },
  //   exitBeforeEnter: true,
  // });

  const startMigration = async () => {
    if (!sourcePlatform || !destinationPlatform) {
      alert("Please select both source and destination platforms");
      return;
    }

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
    <Box
      minHeight="100vh"
      bg="linear-gradient(to right bottom, rgb(88, 28, 135), rgb(30, 58, 138), rgb(49, 46, 129))"
      pb={20}
    >
      {/* animated shapes */}
      <Box
        pos={"absolute"}
        inset={0}
        pointerEvents="none"
        className="absolute inset-0 pointer-events-none"
      >
        <Box
          pos="absolute"
          top={20}
          left={10}
          w={32}
          h={32}
          rounded="full"
          bg="linear-gradient(to right, rgb(236, 72, 153), rgb(139, 92, 246))"
          opacity={0.2}
          className="animate-pulse"
        ></Box>
        <Box
          pos="absolute"
          bottom={20}
          right={20}
          w={24}
          h={24}
          rounded="full"
          bg="linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246))"
          opacity={0.3}
          className="animate-bounce"
        ></Box>
      </Box>

      <Box position="relative" zIndex={1}>
        <Box position="sticky" top={0}>
          <Nav
            rightElement={
              <Box
                display={{
                  base: "none",
                  md: "block",
                }}
                maxW="sm"
                w="full"
              >
                <WizardProgress currentStep={stepIndex} steps={steps} />
              </Box>
            }
          />
        </Box>

        {showSuccess ? (
          <Success totalPlaylists={selectedPlaylists.length} />
        ) : (
          <>
            <Box px={4} position="relative">
              {/* {steps.map((stepContent, stepIndex) => (
            <Box
              key={stepIndex}
              display={step === stepIndex ? "block" : "none"}
            >
              {stepContent}
            </Box>
          ))} */}

              {/* {transitions((style, step) => {
            return (
              <Box as={animated.div} style={style}>
                {renderStep(step)}
              </Box>
            );
          })} */}

              <ConvertWizardContext.Provider
                value={{
                  steps: steps,
                  youtubeConnected,
                  spotifyConnected,
                  setYoutubeConnected: setYoutubeConnected,
                  setSpotifyConnected: setSpotifyConnected,
                  togglePlaylist,
                  selectedPlaylists,
                  setSelectedPlaylists,
                  sourcePlatform,
                  setSourcePlatform,
                  destinationPlatform,
                  setDestinationPlatform,
                }}
              >
                {loadingConnectionStatus ? (
                  <Box
                    minH="60vh"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Spinner
                      thickness="4px"
                      speed="0.65s"
                      emptyColor="gray.200"
                      color="blue.500"
                      size="lg"
                    />
                  </Box>
                ) : (
                  <Outlet />
                )}
              </ConvertWizardContext.Provider>
            </Box>

            <Box
              px={4}
              pb={6}
              position="fixed"
              bottom={0}
              left={0}
              width="full"
            >
              <Box
                display="flex"
                alignItems="center"
                gap={4}
                w={{
                  base: "100%",
                  lg: "90%",
                }}
                mx="auto"
              >
                {stepIndex > 0 && (
                  <chakra.button
                    bg="whiteAlpha.200"
                    border="1px solid"
                    borderColor="whiteAlpha.600"
                    onClick={() => {
                      const prevStep = steps[stepIndex - 1];
                      navigate("/convert/" + prevStep.path);
                    }}
                    transition=".2s ease-in-out"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    py={2}
                    px={8}
                    rounded="full"
                    color="white"
                    _hover={{
                      bg: "whiteAlpha.300",
                    }}
                  >
                    <Icon>
                      <ArrowLeft />
                    </Icon>
                    Back
                  </chakra.button>
                )}

                <Box ml="auto">
                  {/* {curStep.completed && nextStep && ( */}

                  {stepIndex === 2 ? (
                    <GradientButton
                      onClick={startMigration}
                      disabled={selectedPlaylists.length === 0}
                    >
                      Start Migration{" "}
                      {selectedPlaylists.length > 0
                        ? `(${selectedPlaylists.length})`
                        : ""}
                      <Icon as={ArrowRight} ml={2} />
                    </GradientButton>
                  ) : (
                    <GradientButton
                      onClick={() => {
                        if (nextStep) {
                          navigate("/convert/" + nextStep.path);
                        }
                      }}
                    >
                      Next
                      <Icon as={ArrowRight} ml={2} />
                    </GradientButton>
                  )}
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

const GradientButton = ({
  onClick,
  children,
  disabled = false,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  return (
    <chakra.button
      color="white"
      bgGradient="linear(to-r, pink.500, purple.500)"
      rounded="full"
      display="flex"
      py={2}
      px={7}
      alignItems="center"
      transition=".2s ease-in-out"
      _hover={{
        bgGradient: "linear(to-r, pink.600, purple.600)",
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </chakra.button>
  );
};
