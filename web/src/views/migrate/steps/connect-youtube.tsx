import { Box, Flex, Text, useToast } from "@chakra-ui/react";
import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { client } from "@/api/api";
import { useMigrateContext } from "../context";
import { useSessionContext } from "@/contexts/session";
import { toastHelper } from "@/components/utils/toast";
import EllipsisLoader from "@/components/ellipsis-loader";

function YouTubeIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF3B30">
      <path d="M23.5 6.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.3-1C17.1 2.7 12 2.7 12 2.7s-5.1 0-8.3.2c-.5.1-1.5.1-2.3 1-.7.7-.9 2.3-.9 2.3S.2 8 .2 9.8v1.7c0 1.8.3 3.5.3 3.5s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.8.2 7.5.2 7.5.2s5.1 0 8.3-.2c.5-.1 1.5-.1 2.3-1 .7-.7.9-2.3.9-2.3s.3-1.8.3-3.5V9.8c0-1.8-.3-3.6-.3-3.6zM9.7 14.7V8.5l6.2 3.1-6.2 3.1z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="3,8 6.5,11.5 13,4.5" />
    </svg>
  );
}

// function PermCheckIcon({ muted = false }: { muted?: boolean }) {
//   if (muted) {
//     return (
//       <svg
//         width="12"
//         height="12"
//         viewBox="0 0 12 12"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//       >
//         <path strokeLinecap="round" d="M2 6h8" />
//       </svg>
//     );
//   }
//   return (
//     <svg
//       width="12"
//       height="12"
//       viewBox="0 0 12 12"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="1.8"
//     >
//       <polyline points="2,6 4.5,8.5 10,3" />
//     </svg>
//   );
// }

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
    <Box display="flex" flexDirection="column" gap={6}>
      <Box>
        <Flex mb={4} alignItems="center" gap={2}>
          <Flex
            w="60px"
            h="60px"
            borderRadius="lg"
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
            <Box as="span" color="brand.youtube">
              YouTube
            </Box>
          </Box>
        </Flex>
        <Text
          color="text.muted"
          mt="0.5rem"
          lineHeight={1.65}
          fontWeight={300}
          maxW="420px"
        >
          We'll read your playlists so you can choose which ones to migrate. We
          never modify or delete anything on your account.
        </Text>
      </Box>

      <Flex
        mb={4}
        py={10}
        gap="2rem"
        flexWrap="wrap"
        border="1px solid"
        borderColor="rgba(255,255,255,0.07)"
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
            title: "Read-only access",
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
            title: `Your data stays yours`,

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
            title: `Revoke anytime`,
            desc: (
              <>
                Disconnect from your
                <br />
                Google account settings
              </>
            ),
          },
        ].map((each) => (
          <Box display="flex" alignItems="flex-start" gap={2}>
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
            <Flex flexDir="column" align="flex-start">
              <Box as="strong" color="#f0f0f0">
                {each.title}
              </Box>
              <Box color="text.muted" fontSize="sm">
                {each.desc}
              </Box>
            </Flex>
          </Box>
        ))}
      </Flex>

      <Box maxW="260px">
        {youtubeConnected ? (
          <Flex
            bg="brand.spotifyDim"
            border="1px solid"
            borderColor="brand.spotifyBorder"
            borderRadius="9px"
            color="brand.spotify"
            fontFamily="body"
            fontWeight={500}
            fontSize="14px"
            py="12px"
            px="28px"
            w="100%"
            align="center"
            justify="center"
            gap="8px"
          >
            <CheckIcon />
            Connected
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
            py="12px"
            px="20px"
            w="100%"
            cursor="pointer"
            transition="transform .15s"
            _hover={{ transform: "scale(1.02)" }}
            onClick={() => connect()}
            display="flex"
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
