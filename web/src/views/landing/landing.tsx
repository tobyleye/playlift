import {
  Box,
  Text,
  Heading,
  SimpleGrid,
  Link as StyledLink,
  Icon,
  useToast,
} from "@chakra-ui/react";
import { Link, Navigate, Outlet, useNavigate } from "react-router-dom";
import { ArrowRight, Music, Play } from "lucide-react";
import Nav from "@/components/nav";
import { useSessionContext } from "@/contexts/session";
import { useGoogleLogin } from "@react-oauth/google";
import useLoggedIn from "@/hooks/useLoggedIn";
import { FcGoogle } from "react-icons/fc";
import "./login-callback";

import { SecondaryButton } from "@/components/buttons";
import { toastHelper } from "@/components/utils/toast";

const ReturningUserLink = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const login = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "popup",
    scope: ["https://www.googleapis.com/auth/youtube"].join(" "),

    onSuccess: (data) => {
      navigate(`/login/callback?code=${data.code}`, { replace: true });
    },
    onError: (error) => {
      console.error("Login Failed:", error);
      toastHelper(toast, {
        title: "Error",
        description: `Couldn't initialize login. Please try again.`,
        status: "error",
      });
    },
    // redirect_uri: window.location.origin + "/login/callback",
  });

  return (
    <Box color="white">
      <SecondaryButton onClick={login} fontSize="md" py={2}>
        <Icon as={FcGoogle} />
        Login
      </SecondaryButton>
    </Box>
  );
};
export default function Landing() {
  const { session, loadingSession } = useSessionContext();
  const loggedIn = useLoggedIn();

  if (loggedIn) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Box>
      <BGShapes />
      <Box position="relative">
        <Nav
          rightElement={
            loadingSession ? <Box /> : !session ? <ReturningUserLink /> : null
          }
        />

        <Box px={6} mt={6}>
          <Box mb={20} maxWidth={896} mx="auto">
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

              <StyledLink
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
              </StyledLink>
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
                  description: "Your music follows you across all platforms",
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
          </Box>

          <Box as="footer" pt={4} pb={6} textAlign="center">
            <Text color="white">
              <StyledLink
                fontWeight="semibold"
                textDecor="underline"
                _hover={{
                  textDecor: "underline",
                }}
                href="http://oluwatobi.vercel.app"
                rel="noreferrer"
                target="_blank"
              >
                Oluwatobi
              </StyledLink>
              {"・"}
              ❤️
            </Text>
          </Box>
        </Box>

        <Outlet />
      </Box>
    </Box>
  );
}

function BGShapes() {
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
      ></Box>
      <Box
        pos="absolute"
        top={40}
        right={20}
        w={24}
        h={24}
        rounded="full"
        bg="linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246))"
        opacity={0.3}
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-30 animate-bounce"
      ></Box>
      <Box
        pos="absolute"
        bottom={20}
        left="25%"
        w={40}
        h={40}
        rounded="full"
        bg="linear-gradient(to right, rgb(34, 197, 94), rgb(20, 184, 166))"
        opacity={0.2}
        className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-500 to-teal-500 rounded-full opacity-20 animate-pulse delay-1000"
      ></Box>
      {/* <Box
        pos="absolute"
        bottom={40}
        right="33.3%"
        w={28}
        h={28}
        rounded="full"
        bg="linear-gradient(to right, rgb(249, 115, 22), rgb(239, 68, 68))"
        opacity={0.25}
        className="absolute bottom-40 right-1/3 w-28 h-28 bg-gradient-to-r from-orange-500 to-red-500 rounded-full opacity-25 animate-bounce delay-500"
      ></Box>
      <Box
        pos="absolute"
        top={"50%"}
        left={"50%"}
        w={20}
        h={20}
        rounded="full"
        bg="linear-gradient(to right, rgb(234, 179, 8), rgb(249, 115, 22))"
        opacity={0.3}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full opacity-30 animate-spin"
      ></Box> */}
    </Box>
  );
}
