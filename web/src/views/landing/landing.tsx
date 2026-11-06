import { Box, Text, Heading, SimpleGrid, useToast } from "@chakra-ui/react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Music, Play } from "lucide-react";
import { toastHelper } from "@/components/utils/toast";
import { useCallback, useEffect, useRef } from "react";
import useLoggedIn from "@/hooks/useLoggedIn";
import useGuestConversion from "./guest-convert/use-guest-conversion";
import useGuestLogin from "./guest-convert/use-guest-login";
import GuestShell from "./guest-convert/guest-shell";
import PasteForm from "./guest-convert/paste-form";
import PlaylistPreview from "./guest-convert/playlist-preview";
import ResumeConversions from "./guest-convert/resume-conversions";
import Stepper from "./guest-convert/stepper";
import DevStepNav, { DevStep } from "./guest-convert/dev-step-nav";

export default function Landing() {
  const isLoggedIn = useLoggedIn();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login, signingIn } = useGuestLogin();

  const onGuestError = useCallback(
    (description: string) => {
      toastHelper(toast, {
        title: "Oops!",
        description,
        status: "error",
      });
    },
    [toast],
  );

  const guest = useGuestConversion({ onError: onGuestError });
  const inFlow = guest.step !== "paste";

  // the dev bar on the conversion page steps back here through history state
  const devStep = (location.state as { devStep?: DevStep } | null)?.devStep;
  const { showSample } = guest;
  useEffect(() => {
    if (!import.meta.env.DEV || !devStep) return;
    showSample(devStep);
    navigate(".", { replace: true, state: null });
  }, [devStep, showSample, navigate]);

  // each panel starts from the top, the way the flow reads
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [guest.step]);

  if (isLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  return (
    <GuestShell onLogin={login} signingIn={signingIn}>
      {import.meta.env.DEV && (
        <DevStepNav step={guest.step} onChange={guest.showSample} />
      )}

      {inFlow ? (
        <>
          <Stepper current={0} />

          {guest.step === "preview" && guest.playlist && (
            <PlaylistPreview
              source={guest.link?.platform}
              playlist={guest.playlist}
              destination={guest.destination}
              onSelectDestination={guest.setDestination}
              onStart={guest.startMatching}
              isStarting={guest.starting}
              onBack={guest.reset}
            />
          )}

        </>
      ) : (
        <>
          {/*   heading */}
          <Box mb={16} textAlign="center">
            <Heading
              fontSize={{ base: "5xl", lg: "7xl" }}
              fontWeight={700}
              color="white"
              mb={4}
            >
              {/* Move Your Playlists */}
              Your Music, <br />
              Wherever You Go
              {/* Keep your music collection unified across all platforms. */}
            </Heading>

            <Text
              maxW="2xl"
              mx="auto"
              color="gray.200"
              fontSize={{ base: "xl", lg: "2xl" }}
              lineHeight={1.4}
              mb={12}
            >
              Seamlessly migrate your music playlists between{" "}
              <Box as="span" fontWeight="bold">
                Spotify
              </Box>{" "}
              and{" "}
              <Box as="span" fontWeight="bold">
                YouTube Music
              </Box>
              .
            </Text>

            {/* start migration button */}

            {/* <StyledLink
              as={Link}
              to="/convert"
              bgGradient=" linear(to-r, rgb(219, 39, 119), rgb(124, 58, 237))"
              bgColor={"rgba(15, 23, 42, 0.9)"}
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              h={10}
              px={8}
              rounded="full"
              color="white"
              transition=".3s cubic-bezier(0.4, 0, 0.2, 1)"
              fontWeight={600}
              _hover={{
                transform: "scale(1.05)",
                ".btn-icon": {
                  transform: "translateX(4px)",
                },
              }}
            >
              <Box
                as="span"
                fontSize="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                Start Migration
                <Icon
                  ml={2}
                  className="btn-icon"
                  transition=".3s cubic-bezier(0.4, 0, 0.2, 1)"
                >
                  <ArrowRight />
                </Icon>
              </Box>
            </StyledLink> */}
          </Box>

          <ResumeConversions />

          <Box mb={16}>
            <PasteForm
              onSubmit={guest.loadPlaylist}
              isLoading={guest.loadingPlaylist}
            />
          </Box>
          {/* feature cards */}
          <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
            {[
              {
                icon: <Music />,
                iconBg:
                  "linear-gradient(to right, rgb(74, 222, 128), rgb(59, 130, 246))",
                title: "Easy Connection",
                description:
                  " Connect your Spotify and YouTube Music accounts securely",
              },
              {
                icon: <ArrowRight />,
                iconBg:
                  "linear-gradient(to right, rgb(192, 132, 252), rgb(236, 72, 153))",
                title: "Fast Transfer",
                description:
                  "Migrate multiple playlists in just a few clicks",
              },
              {
                icon: <Play />,
                iconBg:
                  "linear-gradient(to right, rgb(34, 211, 238), rgb(168, 85, 247))",
                title: "Keep Listening",
                description:
                  "Your music follows you across all platforms",
              },
            ].map((feature, index) => (
              <Box
                key={`feature-${index}`}
                bg="rgba(255,255,255,.1)"
                rounded="lg"
                px={6}
                py={6}
                color="white"
                textAlign="center"
                backdropFilter="blur(16px)"
                transition=".3s cubic-bezier(.4,0,.2,1)"
                _hover={{
                  bg: "#fff3",
                  transform: "scale(1.05)",
                }}
              >
                <Box
                  bg={feature.iconBg}
                  w={12}
                  h={12}
                  rounded="lg"
                  mb={4}
                  display="inline-grid"
                  placeItems="center"
                  color="white"
                >
                  {feature.icon}
                </Box>
                <Text fontSize="lg" fontWeight={600} mb={2}>
                  {feature.title}
                </Text>
                <Text color="gray.300">{feature.description}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </>
      )}
    </GuestShell>
  );
}
