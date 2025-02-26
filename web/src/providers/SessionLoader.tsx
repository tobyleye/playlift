// create authentication provider to wrap the entire application
import { ReactNode } from "react";
import api from "../api/api";

import { useGlobalStore } from "../store/store";
import useSWRImmutable from "swr/immutable";

export default function SessionLoader({ children }: { children: ReactNode }) {
  const setUser = useGlobalStore((state) => state.setUser);

  useSWRImmutable(
    "/user-session",
    async () => {
      return api.getUserSession();
    },
    {
      revalidateIfStale: false,
      onSuccess: (data) => {
        return setUser(data);
      },
    }
  );

  return <>{children}</>;
}
