import { Box, Heading, Text, chakra, Icon, useToast } from "@chakra-ui/react";
import { CheckIcon, PlayIcon } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { client } from "@/api/api";
import { useConvertWizardContext } from "./context";
import { useSessionContext } from "@/contexts/session";
import { toastHelper } from "@/components/utils/toast";
import EllipsisLoader from "@/components/ellipsis-loader";

export default function ConnectYoutube() {
  const [loading, setLoading] = useState(false);
  // const [searchParams] = useSearchParams();
  // const code = searchParams.get("code");
  // const error = searchParams.get("error");
  // const navigate = useNavigate();

  const toast = useToast();
  const { setSession } = useSessionContext();
  const { youtubeConnected, setYoutubeConnected } = useConvertWizardContext();

  const [showDescription] = useState(() => !youtubeConnected);

  // useEffect(() => {
  //   const connectCallback = async () => {
  //     setLoading(true);
  //     try {
  //       const { data } = await client.post("/login/google/callback", {
  //         code,
  //         origin: "connect",
  //       });
  //       setYoutubeConnected(true);
  //       const { user, is_new_user } = data.data;
  //       localStorage.setItem("userId", user.user_id);
  //       setSession(user);
  //       toastHelper(toast, {
  //         title: "YouTube Music connected!",
  //         description: is_new_user
  //           ? "Account created successfully! You can now manage your music across platforms."
  //           : `Welcome back!`,
  //       });
  //     } catch (err) {
  //       console.error("Error connecting to YouTube Music:", err);
  //       toastHelper(toast, {
  //         title: "Connection failed",
  //         description: `Unable to connect to YouTube Music. Please try again.`,
  //         status: "error",
  //       });
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   navigate(".", { replace: true });

  //   if (error) {
  //     toastHelper(toast, {
  //       title: "Login failed",
  //       description: `Unable to login. Please try again.`,
  //       status: "error",
  //     });
  //   } else if (code) {
  //     connectCallback();
  //   }

  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [code, error]);

  const connectYoutube = useGoogleLogin({
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
        // not likely to not have data, but just in case
        if (!data) throw new Error("No data received");
        setYoutubeConnected(true);
        const { user, is_new_user } = data.data;
        localStorage.setItem("userId", user.user_id);
        setSession(user);
        toastHelper(toast, {
          title: "YouTube Music connected!",
          description: is_new_user
            ? "Account created successfully! You can now manage your music across platforms."
            : `Welcome back!`,
        });
      } catch (err) {
        console.error("Error connecting to YouTube Music:", err);
        toastHelper(toast, {
          title: "Connection failed",
          description: `Unable to connect to YouTube Music. Please try again.`,
          status: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      toastHelper(toast, {
        title: "Error!",
        description: `Error initiating connection. Please try again`,
        status: "error",
      });
    },
    // redirect_uri: window.location.href,
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
          <Icon w="14" h="14">
            <PlayIcon />
          </Icon>
        </Box>
        <Heading fontSize="3xl" mb={4} fontWeight={"bold"}>
          Connect YouTube Music
        </Heading>
        {showDescription && (
          <Text mb={8} fontSize="md" maxW="md" mx="auto" color="gray.200">
            First, let's connect your YouTube Music account to access your
            playlists and create your profile.
          </Text>
        )}

        <chakra.button
          py={2}
          px={6}
          minW={200}
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
          {loading ? (
            <EllipsisLoader text="Connecting" />
          ) : youtubeConnected ? (
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
