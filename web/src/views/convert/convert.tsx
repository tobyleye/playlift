import { Box, Icon, Spinner, useToast } from "@chakra-ui/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import Nav from "@/components/nav";
import WizardProgress from "./wizard-progress";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ConvertWizardContext } from "./context";
import api from "@/api/api";
import { Playlist } from "@/types";
import { streamingServices } from "@/constants/constants";
import Success from "./success-screen";
import { useSessionContext } from "@/contexts/session";
import "./connect-youtube";
import "./connect-spotify";
import "./playlist-selection";
import ConfirmationModal from "./confirmation-modal";
import { GradientButton, SecondaryButton } from "@/components/buttons";
import { toastHelper } from "@/components/utils/toast";
import BackdropLoader from "@/components/backdrop-loader";

// import { useTransition, animated } from "@react-spring/web";

// const useStep = () => {
//   const [step, setStep] = useState(1);
//   const prevStep = useRef(-1);

//   const setter = (val: number) => {
//     if (step !== val) {
//       prevStep.current = step;
//     }
//     setStep(val);
//   };

//   return [step, prevStep.current, setter] as [
//     number,
//     number,
//     (val: number) => void
//   ];
// };

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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  const location = useLocation();

  const paths = location.pathname.split("/");

  const stepPath = paths.length > 2 ? paths[2] : "";
  const { session } = useSessionContext();

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
      completed: showSuccess,
    },
  ];

  const toast = useToast();

  const stepIndex = steps.findIndex((step) => step.path === stepPath);

  const curStep = stepIndex > -1 ? steps[stepIndex] : null;
  const totalSteps = steps.length;
  const nextStep = stepIndex < totalSteps - 1 ? steps[stepIndex + 1] : null;
  const firstUncompleted = steps.findIndex((step) => !step.completed);

  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
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
    } else {
      setLoadingConnectionStatus(false);
    }
  }, [session]);

  // const transitions = useTransition(step, {
  //   from: { opacity: 0, x: step > prevStep ? 20 : -20 },
  //   enter: { opacity: 1, x: 0 },
  //   leave: { opacity: 0, x: step > prevStep ? -20 : 20 },
  //   exitBeforeEnter: true,
  // });

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

  const startMigration = async () => {
    const body = {
      destination: destinationPlatform.value,
      source: sourcePlatform.value,
      playlists: selectedPlaylists.map((pl) => ({
        id: pl.playlist_id,
        title: pl.title,
      })),
    };
    try {
      setTransferLoading(true);
      await api.convert(
        body.playlists,
        destinationPlatform.value,
        sourcePlatform.value
      );

      setShowSuccess(true);
    } catch (err) {
      console.error("Error:", err);
      toastHelper(toast, {
        title: "Error starting migration",
        description: "",
      });
    } finally {
      setTransferLoading(false);
    }
  };

  // some simple route validation logic

  if (
    !loadingConnectionStatus &&
    firstUncompleted > -1 &&
    firstUncompleted < stepIndex
  ) {
    // navigate if there's an uncompleted step before the current step
    return <Navigate to={`/convert/${steps[firstUncompleted].path}`} replace />;
  }

  return (
    <Box minHeight="100vh" pb={20}>
      <BGShapes />
      <ConfirmationModal
        open={showConfirmation}
        setOpen={setShowConfirmation}
        onConfirm={startMigration}
        selectedPlaylists={selectedPlaylists}
        sourcePlatform={sourcePlatform.label}
        destinationPlatform={destinationPlatform.label}
      />
      <Box position="relative">
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

              {transferLoading && (
                <BackdropLoader loadingText="Starting migration" />
              )}
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

            {curStep && (
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
                  flexWrap="wrap"
                  gap={2}
                  w={{
                    base: "100%",
                    lg: "90%",
                  }}
                  mx="auto"
                >
                  {stepIndex > 0 && (
                    <SecondaryButton
                      onClick={() => {
                        const prevStep = steps[stepIndex - 1];
                        navigate("/convert/" + prevStep.path);
                      }}
                    >
                      <Icon>
                        <ArrowLeft />
                      </Icon>
                      <Box display={{ base: "none", sm: "inline-block" }}>
                        Back
                      </Box>
                    </SecondaryButton>
                  )}

                  <Box ml="auto">
                    {stepIndex === 2 ? (
                      <GradientButton
                        minWidth={150}
                        onClick={() => setShowConfirmation(true)}
                        disabled={
                          selectedPlaylists.length === 0 || transferLoading
                        }
                      >
                        Start Migration{" "}
                        {selectedPlaylists.length > 0 &&
                          `(${selectedPlaylists.length})`}
                        <Icon as={ArrowRight} ml={2} />
                      </GradientButton>
                    ) : curStep.completed && nextStep ? (
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
                    ) : null}
                  </Box>
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

const BGShapes = () => {
  return (
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
  );
};
