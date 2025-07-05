import { Box, Heading, Text, chakra, Icon } from "@chakra-ui/react";
import { CheckIcon, PlayIcon } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { client } from "@/api/api";

export default function ConnectYoutube() {
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      console.error("Error connecting to YouTube Music:", error);
    }
  }, [error]);

  useEffect(() => {
    console.log({ code });

    const connectCallback = async () => {
      setLoading(true);
      try {
        const user = await client.post("/login/google/callback", {
          code,
        });
        console.log("user..", user);
        // localStorage.setItem("userId", user.data.user_id);
      } catch (err) {
        console.error("Error connecting to YouTube Music:", err);
      }
    };

    if (code) {
      connectCallback();
    }
  }, [code]);

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
    <Box display="flex" flex={1} flexDirection="column" justifyContent="center">
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
          disabled={youtubeConnected}
          onClick={() => {
            console.log("click mee bitch..");
            connectYoutube();
            // if (!youtubeConnected) {
            //   setYoutubeConnected(true);
            //   setStep(1);
            // }
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
