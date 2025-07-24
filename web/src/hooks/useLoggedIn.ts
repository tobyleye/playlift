import { useState } from "react";

export default function useLoggedIn() {
  const [loggedIn] = useState(() => localStorage.getItem("userId") !== null);
  return loggedIn;
}
