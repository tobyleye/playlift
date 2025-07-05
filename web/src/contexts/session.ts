import React from "react";

export type UserSession = {
  user_id: string;
  email: string;
  name: string;
  picture: string;
  spotify_connected: boolean;
  youtube_connected: boolean;
};

export const SessionContext = React.createContext<{
  loadingSession: boolean;
  session: UserSession | null;
  setSession: React.Dispatch<React.SetStateAction<UserSession | null>>;
} | null>(null);

export const useSessionContext = () => {
  const value = React.useContext(SessionContext);
  if (!value) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return value;
};
