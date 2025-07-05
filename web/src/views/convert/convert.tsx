import { Box, Icon, chakra } from "@chakra-ui/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import ConnectYoutube from "./connect-youtube";
import ConnectSpotify from "./connect-spotify";
import PlaylistsSelection from "./playlist-selection";
import Nav from "@/components/nav";
import { useTransition, animated } from "@react-spring/web";
import WizardProgress from "./wizard-progress";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ConvertWizardContext } from "./context";

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

export default function ConversionWizard() {
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [step, prevStep, setStep] = useStep();

  const location = useLocation();
  const paths = location.pathname.split("/");
  const stepPath = paths.length > 2 ? paths[2] : "";

  console.log({ paths, stepPath });

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

  const transitions = useTransition(step, {
    from: { opacity: 0, x: step > prevStep ? 20 : -20 },
    enter: { opacity: 1, x: 0 },
    leave: { opacity: 0, x: step > prevStep ? -20 : 20 },
    exitBeforeEnter: true,
  });

  // const renderStep = (step: number) => {
  //   console.log("rendering step..", step);
  //   switch (step) {
  //     case 0:
  //       return (
  //         <ConnectYoutube
  //           youtubeConnected={youtubeConnected}
  //           setYoutubeConnected={setYoutubeConnected}
  //           setStep={setStep}
  //         />
  //       );
  //     case 1:
  //       return (
  //         <ConnectSpotify
  //           spotifyConnected={spotifyConnected}
  //           setSpotifyConnected={setSpotifyConnected}
  //           setStep={setStep}
  //         />
  //       );
  //     case 2:
  //       return <PlaylistsSelection />;
  //     default:
  //       return null;
  //   }
  // };

  // const steps = [
  //   { label: 1, completed: youtubeConnected },
  //   { label: 2, completed: spotifyConnected },
  //   { label: 3, completed: false },
  // ];

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
              <WizardProgress currentStep={step} steps={steps} />
            </Box>
          }
        />

        <Box
          minH="80vh"
          display="flex"
          flexDirection={"column"}
          px={4}
          position="relative"
        >
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
            }}
          >
            <Outlet />
          </ConvertWizardContext.Provider>
        </Box>

        <Box px={4} pb={6} position="fixed" bottom={0} left={0} width="full">
          <Box
            display="flex"
            alignItems="center"
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
              <chakra.button
                color="white"
                bgGradient="linear(to-r, pink.500, purple.500)"
                rounded="full"
                display="flex"
                py={2}
                px={7}
                alignItems="center"
                gap={2}
                transition=".2s ease-in-out"
                _hover={{
                  bgGradient: "linear(to-r, pink.600, purple.600)",
                }}
                onClick={() => {
                  if (nextStep) {
                    navigate("/convert/" + nextStep.path);
                  }
                  // setStep(step + 1);
                }}
              >
                Next
                <Icon>
                  <ArrowRight />
                </Icon>
              </chakra.button>
              {/* )} */}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
