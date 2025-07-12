import api, { client } from "@/api/api";
import { toastHelper } from "@/components/utils/toast";
import { SessionContext, UserSession } from "@/contexts/session";
import { useToast } from "@chakra-ui/react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loadingSession, setLoadingSession] = useState(true);
  const [session, setSession] = useState<null | UserSession>(null);
  const navigate = useNavigate();

  const toast = useToast();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      // user is probably logged in.
      // fetch user session

      api
        .getUserSession()
        .then((data) => {
          setSession(data);
        })
        .catch((err) => {
          // remove userId from localStorage if session returns 401
          if (err.response && err.response.status === 401) {
            localStorage.removeItem("userId");
          }
        })
        .finally(() => {
          setLoadingSession(false);
        });
    } else {
      setLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    // intercept the request and clear user session if the request fails with 401
    const requestInterceptor = client.interceptors.response.use(null, (err) => {
      if (err.response && err.response.status === 401) {
        // clear session
        setSession(null);
        localStorage.removeItem("userId");
        toastHelper(toast, {
          title: "Session expired",
          description: "Please log in again to continue",
          status: "error",
        });
        navigate("/");
      }
    });

    return () => {
      client.interceptors.response.eject(requestInterceptor);
    };
  }, [session]);

  return (
    <SessionContext.Provider
      value={{
        loadingSession,
        session,
        setSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
