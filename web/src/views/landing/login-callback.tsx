import { client } from "@/api/api";
import { useSessionContext } from "@/contexts/session";
import {
  Box,
  Modal,
  ModalContent,
  ModalBody,
  ModalOverlay,
  useToast,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import EllipsisLoader from "@/components/ellipsis-loader";
import { toastHelper } from "@/components/utils/toast";

export default function LoginModal() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const { setSession } = useSessionContext();
  const navigate = useNavigate();

  const toast = useToast();

  useEffect(() => {
    const loginCallback = async () => {
      try {
        const { data } = await client.post("/login/google/callback", {
          code,
          origin: "login",
        });

        const { user } = data.data;

        localStorage.setItem("userId", user.user_id);
        setSession(user);
        navigate("/home", { replace: true });
      } catch (err) {
        toastHelper(toast, {
          title: "Login failed",
          description: `Unable to login. Please try again.`,
          status: "error",
        });
        console.error("Error connecting to YouTube Music:", err);
        navigate("/", { replace: true });
      }
    };

    if (error) {
      toastHelper(toast, {
        title: "Login failed",
        description: `Unable to login. Please try again.`,
        status: "error",
      });
      navigate("/", { replace: true });
    } else if (code) {
      loginCallback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, code]);

  return (
    <Modal isCentered isOpen={true} onClose={() => {}}>
      <ModalOverlay
        bg="blackAlpha.300"
        backdropFilter="blur(6px) hue-rotate(90deg)"
      />
      <ModalContent margin={4} bg="blackAlpha.800" color="white">
        <ModalBody>
          <Box textAlign="center" py="20vh">
            <EllipsisLoader text="Loading" />
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
