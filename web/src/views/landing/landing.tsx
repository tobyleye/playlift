import { Box, Flex, Grid, Text, useToast } from "@chakra-ui/react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useSessionContext } from "@/contexts/session";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { toastHelper } from "@/components/utils/toast";
import { client } from "@/api/api";
import { useState } from "react";
import BackdropLoader from "@/components/backdrop-loader";

export default function Landing() {
  const { session, loadingSession, setSession } = useSessionContext();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "popup",
    scope: ["https://www.googleapis.com/auth/youtube"].join(" "),
    redirect_uri: window.location.origin,
    onSuccess: async (codeResponse) => {
      try {
        setLoading(true);
        const { data } = await client.post("/login/google/callback", {
          code: codeResponse.code,
          origin: "login",
          redirect_url: window.location.origin,
        });
        const { user } = data.data;
        localStorage.setItem("userId", user.user_id);
        setSession(user);
        navigate("/home", { replace: true });
      } catch (err) {
        setLoading(false);
        toastHelper(toast, {
          title: "Oops!",
          description: "Unable to login. Please try again.",
          status: "error",
        });
        console.error("Error connecting to YouTube Music:", err);
      }
    },
    onError: (error) => {
      console.error("Login Failed:", error);
      toastHelper(toast, {
        title: "Oops!",
        description: "Couldn't complete login. Please try again.",
        status: "error",
      });
    },
  });

  return (
    <Box bg="brand.bg" minH="100vh" color="text.primary">
      {loading && <BackdropLoader loadingText="Signing you in" />}

      {/* Nav */}
      <Box borderBottom="0.5px solid" borderColor="border.subtle">
        <Flex
          align="center"
          justify="space-between"
          px={6}
          py="1.1rem"
          maxW="1100px"
          mx="auto"
        >
          <Flex
            align="center"
            gap={2}
            fontFamily="heading"
            fontWeight={800}
            fontSize="1.05rem"
            letterSpacing="-0.02em"
            color="text.primary"
          >
            <GemIcon />
            Playlift
          </Flex>

          <Flex align="center" gap={2}>
            {!loadingSession && !session && (
              <Box
                as="button"
                bg="border.subtle"
                border="1px solid"
                borderColor="border.strong"
                borderRadius="9px"
                color="text.primary"
                fontSize="13px"
                fontWeight={500}
                px="18px"
                py="7px"
                cursor="pointer"
                transition="all .15s"
                _hover={{
                  bg: "border.medium",
                  borderColor: "border.strong",
                }}
                onClick={() => login()}
                display="flex"
                alignItems="center"
                gap={2}
              >
                <FcGoogle />
                Sign in
              </Box>
            )}
            <Box
              as={Link}
              to="/convert"
              bg="brand.accent"
              borderRadius="9px"
              color="brand.bg"
              // fontFamily="heading"
              fontWeight={700}
              fontSize="13px"
              px="18px"
              py="8px"
              cursor="pointer"
              transition="transform .15s"
              letterSpacing="0.01em"
              display="inline-block"
              _hover={{ transform: "scale(1.03)", textDecoration: "none" }}
            >
              Get started
            </Box>
          </Flex>
        </Flex>
      </Box>

      {/* Hero */}
      <Flex
        direction="column"
        align="center"
        textAlign="center"
        gap="1.75rem"
        px={6}
        pt={{ base: "3.5rem", md: "5.5rem" }}
        pb={{ base: "3rem", md: "5rem" }}
        maxW="1100px"
        mx="auto"
      >
        <Box
          as="h1"
          // fontFamily="heading"
          fontSize={{ base: "2.6rem", md: "4.6rem" }}
          fontWeight={800}
          letterSpacing="-0.03em"
          lineHeight={1.06}
          color="text.primary"
          maxW="720px"
          sx={{
            em: {
              fontStyle: "italic",
              color: "rgba(240,240,240,0.3)",
              fontWeight: 400,
            },
          }}
        >
          Your music,
          <br />
          <em>every</em> platform.
        </Box>

        <Text
          fontSize={{ base: "16px", md: "18px" }}
          color="text.muted"
          maxW="440px"
          lineHeight={1.7}
          fontWeight={300}
        >
          Move your playlists between <Box as="span">YouTube</Box> and{" "}
          <Box as="span">Spotify</Box> in seconds. No copying links. No lost
          tracks.
        </Text>

        <Flex align="center" gap="10px" flexWrap="wrap" justify="center">
          <Box
            as={Link}
            to="/convert"
            bg="brand.accent"
            borderRadius="9px"
            color="brand.bg"
            // fontFamily="heading"
            fontWeight={700}
            fontSize="14px"
            px="28px"
            py="13px"
            cursor="pointer"
            transition="transform .15s"
            letterSpacing="0.01em"
            display="flex"
            alignItems="center"
            gap={2}
            _hover={{ transform: "scale(1.03)", textDecoration: "none" }}
            _active={{ transform: "scale(0.97)" }}
          >
            Start for free
            <ArrowIcon />
          </Box>
        </Flex>
      </Flex>

      <Box h="0.5px" bg="border.subtle" />

      {/* How it works */}
      <Box
        maxW="1100px"
        mx="auto"
        px={6}
        py={{ base: "3rem", md: "4.5rem" }}
        id="how-it-works"
      >
        <Text
          fontSize="11px"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color="brand.accent"
          fontWeight={500}
          mb="0.75rem"
        >
          How it works
        </Text>
        <Box
          as="h2"
          // fontFamily="heading"
          fontSize={{ base: "1.7rem", md: "2.5rem" }}
          fontWeight={800}
          letterSpacing="-0.02em"
          lineHeight={1.12}
          mb="1rem"
          color="text.primary"
        >
          Three steps.
          <br />
          Done.
        </Box>
        <Text
          fontSize="15px"
          color="text.muted"
          maxW="460px"
          lineHeight={1.7}
          fontWeight={300}
          mb="2rem"
        >
          Connect your accounts, pick your playlists, and migrate. Simple as
          that.
        </Text>

        <Grid
          templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
          gap="10px"
        >
          {[
            {
              num: "1",
              title: "Connect your accounts",
              desc: "Log in with YouTube and Spotify. We only ask for the permissions we actually need — your account is created automatically.",
            },
            {
              num: "2",
              title: "Pick your playlists",
              desc: "Your playlists load automatically. Select one, a few, or all of them — then choose where they're going.",
            },
            {
              num: "3",
              title: "Watch them migrate",
              desc: "We match every track and build the playlist on the other side. Live progress, track by track.",
            },
          ].map((step) => (
            <Box
              key={step.num}
              bg="brand.card"
              border="0.5px solid"
              borderColor="border.subtle"
              borderRadius="14px"
              p="1.35rem"
              display="flex"
              flexDirection="column"
              gap="12px"
              transition="border-color .2s"
              _hover={{ borderColor: "border.medium" }}
            >
              <Flex
                w="28px"
                h="28px"
                borderRadius="8px"
                bg="brand.accentDim"
                border="0.5px solid"
                borderColor="brand.accentBorder"
                align="center"
                justify="center"
                // fontFamily="heading"
                fontSize="13px"
                fontWeight={700}
                color="brand.accent"
                flexShrink={0}
              >
                {step.num}
              </Flex>
              <Text
                // fontFamily="heading"
                fontSize="15px"
                fontWeight={700}
                color="text.primary"
              >
                {step.title}
              </Text>
              <Text fontSize="13px" color="text.muted" lineHeight={1.65}>
                {step.desc}
              </Text>
            </Box>
          ))}
        </Grid>
      </Box>

      <Box h="0.5px" bg="border.subtle" />

      {/* CTA */}
      <Flex
        direction="column"
        align="center"
        py={{ base: "3rem", md: "5rem" }}
        px={6}
      >
        <Box
          bg="brand.card"
          border="0.5px solid"
          borderColor="brand.accentBorder"
          borderRadius={{ base: "14px", md: "20px" }}
          p={{ base: "2rem 1.25rem", md: "3rem 2rem" }}
          w="100%"
          maxW="540px"
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap="1.5rem"
        >
          <Flex align="center" gap="16px">
            <Flex
              w="52px"
              h="52px"
              borderRadius="14px"
              bg="brand.youtubeDim"
              align="center"
              justify="center"
            >
              <YouTubeIcon />
            </Flex>
            <Flex
              w="28px"
              h="28px"
              borderRadius="50%"
              bg="brand.accentDim"
              border="0.5px solid"
              borderColor="brand.accentBorder"
              align="center"
              justify="center"
              color="brand.accent"
            >
              <ArrowIcon size={13} />
            </Flex>
            <Flex
              w="52px"
              h="52px"
              borderRadius="14px"
              bg="brand.spotifyDim"
              align="center"
              justify="center"
            >
              <SpotifyIcon />
            </Flex>
          </Flex>

          <Box
            as="h2"
            // fontFamily="heading"
            fontSize={{ base: "1.4rem", md: "2rem" }}
            fontWeight={800}
            letterSpacing="-0.02em"
            color="text.primary"
            textAlign="center"
            lineHeight={1.15}
          >
            Move your music today.
          </Box>

          <Box
            as={Link}
            to="/convert"
            bg="brand.accent"
            borderRadius="9px"
            color="brand.bg"
            // fontFamily="heading"
            fontWeight={700}
            fontSize="15px"
            py="15px"
            w="100%"
            cursor="pointer"
            transition="transform .15s"
            letterSpacing="0.01em"
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
            _hover={{ transform: "scale(1.02)", textDecoration: "none" }}
          >
            Get started free
            <ArrowIcon />
          </Box>
        </Box>
      </Flex>

      <Box h="0.5px" bg="border.subtle" />

      {/* Footer */}
      <Flex
        align="center"
        justify="space-between"
        flexWrap="wrap"
        gap="12px"
        px={6}
        py="1.75rem"
        maxW="1100px"
        mx="auto"
      >
        <Flex
          align="center"
          gap="6px"
          // fontFamily="heading"
          fontWeight={700}
          fontSize="0.9rem"
        >
          <Box
            w="16px"
            h="16px"
            borderRadius="4px"
            bg="brand.accent"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <svg width="9" height="9" viewBox="0 0 11 11" fill="#0d0d0d">
              <polygon points="5.5,1 10,5.5 5.5,10 1,5.5" />
            </svg>
          </Box>
          Playlift
        </Flex>

        <Flex gap="16px" fontSize="12px">
          <Box
            as={Link}
            to="/privacy-policy"
            transition="color .15s"
            _hover={{ textDecoration: "none" }}
          >
            Privacy
          </Box>
          <Box
            as="a"
            href="mailto:hey@playlift.lol?subject=Hey Playlift"
            transition="color .15s"
            _hover={{ textDecoration: "none" }}
          >
            Contact
          </Box>
        </Flex>

        <Text fontSize="12px">
          {/* <Box as="a"
              fontWeight="semibold"
              href="http://oluwatobi.vercel.app"
              rel="noreferrer"
              target="_blank"
            >
              Oluwatobi
            </Box>
            {"・"}
            ❤️ */}
          With ❤️ by{" "}
          <Box
            as="a"
            fontWeight="semibold"
            href="http://oluwatobi.vercel.app"
            rel="noreferrer"
            target="_blank"
          >
            Oluwatobi
          </Box>
        </Text>
      </Flex>

      <Outlet />
    </Box>
  );
}

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

function ArrowIcon({ size = 15 }: { size?: number }) {
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

function YouTubeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="#FF3B30">
      <path d="M23.5 6.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.3-1C17.1 2.7 12 2.7 12 2.7s-5.1 0-8.3.2c-.5.1-1.5.1-2.3 1-.7.7-.9 2.3-.9 2.3S.2 8 .2 9.8v1.7c0 1.8.3 3.5.3 3.5s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.8.2 7.5.2 7.5.2s5.1 0 8.3-.2c.5-.1 1.5-.1 2.3-1 .7-.7.9-2.3.9-2.3s.3-1.8.3-3.5V9.8c0-1.8-.3-3.6-.3-3.6zM9.7 14.7V8.5l6.2 3.1-6.2 3.1z" />
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}
