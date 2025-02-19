import { useEffect } from "react";
import config from "../config";

export default function Login() {
  useEffect(() => {
    const url = config.SERVER_BASE_URL + "/login/google";
    window.location.assign(url);
  }, []);

  return null;
}
