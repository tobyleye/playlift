import api, { client } from "@/api/api";
import { toastHelper } from "@/components/utils/toast";
import { SessionContext, UserSession } from "@/contexts/session";
import { useToast } from "@chakra-ui/react";

import { useEffect, useRef, useState } from "react";
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
  const { current: savedUserId } = useRef(localStorage.getItem("userId"));

  const isLoggedIn = session?.user_id || savedUserId;

  useEffect(() => {
    // if (isLoggedIn) {
    //   const requestInterceptor = client.interceptors.response.use(
    //     null,
    //     (err) => {
    //       if (err.response && err.response.status === 401) {
    //         localStorage.removeItem("userId");
    //         toastHelper(toast, {
    //           title: "Session expired",
    //           description: "Please log in again to continue",
    //           status: "error",
    //         });
    //         navigate("/");
    //         return Promise.reject(err);
    //       }
    //       return Promise.reject(err);
    //     }
    //   );
    //   return () => {
    //     client.interceptors.request.eject(requestInterceptor);
    //   };
    // }
  }, [isLoggedIn]);

  useEffect(() => {
    if (savedUserId) {
      // user is probably logged in.
      // fetch user session
      api
        .getUserSession()
        .then((data) => {
          setSession(data);
        })
        .catch(() => {})
        .finally(() => {
          setLoadingSession(false);
        });
    } else {
      setLoadingSession(false);
    }
  }, []);

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
