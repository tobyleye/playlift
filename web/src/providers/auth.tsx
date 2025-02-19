// create authentication provider to wrap the entire application
import { ReactNode } from "react";
import useSWR from "swr";
import api from "../api/api";

import { AuthContext } from "./context";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const { data } = useSWR("/api/auth", async () => {
    return api.getUserSession();
  });

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
}
