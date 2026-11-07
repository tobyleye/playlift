import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import { useGoogleLogin } from "@react-oauth/google";
import { client } from "@/api/api";
import { toastHelper } from "@/components/utils/toast";
import { useSessionContext } from "@/contexts/session";

/** Google sign-in for logged-out pages; lands the new session on /home */
export default function useGuestLogin() {
  const { setSession } = useSessionContext();
  const navigate = useNavigate();
  const toast = useToast();
  const [signingIn, setSigningIn] = useState(false);

  const login = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "popup",
    scope: ["https://www.googleapis.com/auth/youtube"].join(" "),
    redirect_uri: window.location.origin,
    onSuccess: async (codeResponse) => {
      try {
        setSigningIn(true);
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
        setSigningIn(false);
        toastHelper(toast, {
          title: "Oops!",
          description: `Unable to login. Please try again.`,
          status: "error",
        });
        console.error("Error connecting to YouTube Music:", err);
      }
    },
    onError: (error) => {
      console.error("Login Failed:", error);
      toastHelper(toast, {
        title: "Oops!",
        description: `Couldn't complete login. Please try again.`,
        status: "error",
      });
    },
    // redirect_uri: window.location.origin + "/login/callback",
  });

  return { login, signingIn };
}
