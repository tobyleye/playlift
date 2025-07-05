import { Route, Routes } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { theme } from "./theme/theme.ts";
import api from "./api/api.ts";

const Landing = lazy(() => import("./views/landing.tsx"));
const Home = lazy(() => import("./views/home.tsx"));
const Convert = lazy(() => import("./views/convert/convert.tsx"));

const ConnectSpotify = lazy(
  () => import("./views/convert/connect-spotify.tsx")
);
const ConnectYoutube = lazy(
  () => import("./views/convert/connect-youtube.tsx")
);
const PlaylistsSelection = lazy(
  () => import("./views/convert/playlist-selection.tsx")
);

const ConvertIndex = lazy(() => import("./views/convert/convert-index.tsx"));

function App() {
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      // user is probably logged in.
      // fetch user session

      api
        .getUserSession()
        .then((user) => {
          console.log("session..", user);
        })
        .catch(() => {
          // remove userId from localStorage if session fetch fails
          localStorage.removeItem("userId");
        });
    }
  }, []);
  return (
    <Suspense fallback={<div />}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <ChakraProvider theme={theme}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<Home />} />
            <Route path="/convert" element={<Convert />}>
              <Route path="" element={<ConvertIndex />} />
              <Route path="connect-spotify" element={<ConnectSpotify />} />
              <Route path="connect-youtube" element={<ConnectYoutube />} />
              <Route path="select-playlists" element={<PlaylistsSelection />} />
            </Route>
          </Routes>
        </ChakraProvider>
      </GoogleOAuthProvider>
    </Suspense>
  );
}

export default App;
