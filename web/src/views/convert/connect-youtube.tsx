import { Box, Heading, Text, chakra, Icon } from "@chakra-ui/react";
import { CheckIcon, PlayIcon } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { client } from "@/api/api";
import { useConvertWizardContext } from "./context";
import { useSessionContext } from "@/contexts/session";

export default function ConnectYoutube() {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const navigate = useNavigate();

  const { setSession } = useSessionContext();
  const { youtubeConnected, setYoutubeConnected } = useConvertWizardContext();

  useEffect(() => {
    if (error) {
      console.error("Error connecting to YouTube Music:", error);
    }
  }, [error]);

  useEffect(() => {
    const connectCallback = async () => {
      setLoading(true);
      try {
        const resp = await client.post("/login/google/callback", {
          code,
        });
        setYoutubeConnected(true);
        localStorage.setItem("userId", resp.data.user_id);
        setSession(resp.data);
      } catch (err) {
        navigate("/convert/connect-youtube", { replace: true });
        console.error("Error connecting to YouTube Music:", err);
      }
    };

    if (code) {
      connectCallback();
    }
  }, [code, navigate, setSession, setYoutubeConnected]);

  const connectYoutube = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "redirect",
    scope: ["https://www.googleapis.com/auth/youtube"].join(" "),

    onSuccess: (tokenResponse) => {
      console.log("token response..", tokenResponse);
    },
    onError: (error) => console.error("Login Failed:", error),
    redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
  });

  return (
    <Box minH="80vh" display="flex" justifyContent="center" alignItems="center">
      <Box color="white" textAlign="center">
        <Box
          w={24}
          h={24}
          mb={6}
          mx="auto"
          rounded="full"
          display="flex"
          alignItems="center"
          color="white"
          bg="rgb(239, 68, 68)"
          justifyContent="center"
        >
          <Icon w="12" h="12">
            <PlayIcon />
          </Icon>
        </Box>
        <Heading fontSize="3xl" mb={4} fontWeight={"bold"}>
          Connect YouTube Music
        </Heading>
        <Text mb={8} fontSize="md" maxW="md" mx="auto" color="gray.200">
          Connect your YouTube Music account where your playlists will be
          migrated.
        </Text>

        <chakra.button
          py={2}
          px={6}
          fontWeight={500}
          bg="youtube-red"
          color="white"
          rounded="full"
          _disabled={{
            opacity: 0.6,
          }}
          disabled={youtubeConnected || loading}
          onClick={() => {
            if (!youtubeConnected) {
              connectYoutube();
            }
          }}
        >
          {youtubeConnected ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              gap={2}
            >
              <Icon>
                <CheckIcon />
              </Icon>
              Connected to Youtube Music
            </Box>
          ) : (
            `Connect Youtube Music`
          )}
        </chakra.button>
      </Box>
    </Box>
  );
}
