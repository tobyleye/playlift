import { client } from "@/api/api";
import { UserSession, useSessionContext } from "@/contexts/session";
import {
  Box,
  Text,
  Button,
  Modal,
  ModalContent,
  ModalBody,
  ModalOverlay,
} from "@chakra-ui/react";
import { useGoogleLogin } from "@react-oauth/google";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function LoginModal({
  open,
  onClose,
  onLogin,
}: {
  open: boolean;
  onClose: () => void;
  onLogin?: (session: UserSession) => void;
}) {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const { setSession } = useSessionContext();
  const [loading, setLoading] = useState(code ? true : false);
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      console.error("Error connecting to YouTube Music:", error);
    }
  }, [error]);

  useEffect(() => {
    const connectCallback = async () => {
      setLoading(true);
      try {
        const { data } = await client.post("/login/google/callback", {
          code,
          from: "home",
        });

        const session = data.data;
        localStorage.setItem("userId", session.user_id);
        setSession(session);
        onLogin?.(session);
      } catch (err) {
        navigate("/home", { replace: true });
        console.error("Error connecting to YouTube Music:", err);
      }
    };

    if (code) {
      navigate("/home", { replace: true });
      connectCallback();
    }
  }, [code, navigate, setSession]);

  const connectYoutube = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "redirect",
    scope: "",

    onSuccess: (tokenResponse) => {
      console.log("token response..", tokenResponse);
    },
    onError: (error) => console.error("Login Failed:", error),
    redirect_uri: window.location.href,
  });

  return (
    <Modal isCentered isOpen={open} onClose={onClose}>
      <ModalOverlay
        bg="blackAlpha.300"
        backdropFilter="blur(6px) hue-rotate(90deg)"
      />
      <ModalContent margin={4}>
        <ModalBody>
          {loading ? (
            <Box textAlign="center" py={6}>
              <Text>Loading..</Text>
            </Box>
          ) : (
            <Box textAlign="center" py={4}>
              <Text fontSize="2xl" fontWeight={600} mb={2}>
                Not so fast!
              </Text>
              <Text size="lg" mb={4}>
                Login with google to continue
              </Text>

              <Button
                onClick={() => {
                  connectYoutube();
                }}
                colorScheme="purple"
              >
                Login with google
              </Button>
            </Box>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
