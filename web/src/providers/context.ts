import React from "react";

type User = {
  email: string;
  name: string;
  picture: string;
};
export const AuthContext = React.createContext<User | null>(null);
