import api from "@/api/api";
import { SessionContext, UserSession } from "@/contexts/session";
import { useEffect, useState } from "react";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loadingSession, setLoadingSession] = useState(true);
  const [session, setSession] = useState<null | UserSession>(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    console.log({ userId });
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
