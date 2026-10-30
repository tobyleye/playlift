import { Box, Flex, Text, useToast } from "@chakra-ui/react";
import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { client } from "@/api/api";
import { useMigrateContext } from "../context";
import { useSessionContext } from "@/contexts/session";
import { toastHelper } from "@/components/utils/toast";
import EllipsisLoader from "@/components/ellipsis-loader";
import { YouTubeIcon } from "@/icons/youtube";
import { CheckIcon } from "@/icons/check";

export default function ConnectYouTubeStep() {
  const { youtubeConnected, setYoutubeConnected } = useMigrateContext();
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { setSession } = useSessionContext();

  const connect = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "popup",
    scope: ["https://www.googleapis.com/auth/youtube"].join(" "),
    onSuccess: async (codeResponse) => {
      setLoading(true);
      try {
        const { data } = await client.post("/login/google/callback", {
          code: codeResponse.code,
          origin: "connect",
        });
        setYoutubeConnected(true);
        const { user, is_new_user } = data.data;
        localStorage.setItem("userId", user.user_id);
        setSession(user);
        toastHelper(toast, {
          title: "YouTube connected!",
          description: is_new_user
            ? "Account created successfully!"
            : "Welcome back!",
        });
      } catch {
        toastHelper(toast, {
          title: "Connection failed",
          description: "Unable to connect to YouTube. Please try again.",
          status: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      toastHelper(toast, {
        title: "Error",
        description: "Error initiating connection. Please try again.",
        status: "error",
      });
    },
  });

  return (
    <Box display="flex" flexDirection="column" gap="2rem">
      <Flex align="center" gap="1rem">
        <Flex
          w="56px"
          h="56px"
          borderRadius="14px"
          bg="brand.youtubeDim"
          align="center"
          justify="center"
        >
          <YouTubeIcon />
        </Flex>
        <Box
          as="h1"
          fontSize={{ base: "1.5rem", md: "2rem" }}
          color="text.primary"
          lineHeight={1.15}
        >
          Connect{" "}
          <Box as="span" fontStyle="italic" color="text.muted2">
            YouTube
          </Box>
        </Box>
      </Flex>
      <Text color="text.muted" lineHeight={1.7} fontWeight={300} maxW="480px">
        We'll read your playlists so you can choose which ones to migrate. We
        never modify or delete anything on your account.
      </Text>

      {/* Permissions */}

      <Flex
        py="2rem"
        gap="2rem"
        flexWrap="wrap"
        border="1px solid"
        borderColor="border.subtle"
        borderRight="transparent"
        borderLeft="transparent"
      >
        {[
          {
            icon: (
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="#C8F04A"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z"
                />
                <circle cx="8" cy="8" r="2" />
              </svg>
            ),
            label: "Read-only access",
            desc: (
              <>
                {" "}
                We can see your playlists
                <br />
                but never change them
              </>
            ),
          },

          {
            icon: (
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="#C8F04A"
                stroke-width="1.5"
              >
                <rect x="3" y="5" width="10" height="8" rx="1.5" />
                <path stroke-linecap="round" d="M5 5V4a3 3 0 0 1 6 0v1" />
              </svg>
            ),
            label: `Your data stays yours`,

            desc: (
              <span>
                We never store your
                <br />
                playlist content
              </span>
            ),
          },
          {
            icon: (
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="#C8F04A"
                stroke-width="1.5"
              >
                <polyline stroke-linecap="round" points="3,8 6,11 13,4" />
              </svg>
            ),
            label: `Revoke anytime`,
            desc: (
              <>
                Disconnect from your
                <br />
                Google account settings
              </>
            ),
          },
        ].map((each) => (
          <Box
            key={each.label}
            display="flex"
            alignItems="flex-start"
            gap="10px"
          >
            <Box
              w={8}
              h={8}
              rounded="lg"
              display="flex"
              justifyContent="center"
              alignItems="center"
              bg="brand.accentDim2x"
              sx={{
                svg: {
                  width: "14px",
                  height: "14px",
                },
              }}
            >
              {each.icon}
            </Box>
            <Box>
              <Text fontWeight={500} color="#f0f0f0">
                {each.label}
              </Text>
              <Text color="text.muted" fontSize="sm">
                {each.desc}
              </Text>
            </Box>
          </Box>
        ))}
      </Flex>

      <Box>
        {youtubeConnected ? (
          <Flex align="center" gap="12px" alignSelf="flex-start">
            <Flex
              bg="brand.spotifyDim"
              border="1px solid"
              borderColor="brand.spotifyBorder"
              color="brand.spotify"
              fontFamily="body"
              borderRadius="999px"
              fontWeight={500}
              fontSize="14px"
              py="8px"
              px="28px"
              align="center"
              justify="center"
              gap="8px"
            >
              <CheckIcon />
              Connected
            </Flex>

            {/* <Box
              as="button"
              fontSize="sm"
              color="text.muted2"
              cursor="pointer"
              bg="none"
              border="none"
              fontFamily="body"
              p={0}
              transition="color .15s"
              _hover={{ color: "text.muted" }}
              onClick={() => setYoutubeConnected(false)}
            >
              Switch account
            </Box> */}
          </Flex>
        ) : (
          <Box
            as="button"
            bg="brand.accent"
            borderRadius="9px"
            color="brand.bg"
            fontFamily="body"
            fontWeight={700}
            fontSize="14px"
            py="13px"
            px="28px"
            cursor="pointer"
            transition="transform .15s"
            _hover={{ transform: "scale(1.02)" }}
            onClick={() => connect()}
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            gap="8px"
            disabled={loading}
            opacity={loading ? 0.7 : 1}
          >
            {loading ? (
              <EllipsisLoader text="Connecting" />
            ) : (
              <>
                <YouTubeIcon size={16} />
                Continue with YouTube
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
