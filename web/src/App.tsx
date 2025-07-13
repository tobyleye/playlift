import { Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { theme } from "./theme/theme.ts";
import SessionProvider from "./providers/SessionProvider.tsx";
import { SWRConfig } from "swr";

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
  return (
    <ChakraProvider theme={theme}>
      <SessionProvider>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <SWRConfig
            value={{
              shouldRetryOnError: (err) => {
                if (err.response && err.response.status === 401) {
                  return false;
                }
                // retry on other errors?
                return true;
              },
            }}
          >
            <Suspense fallback={<div />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/home" element={<Home />} />
                <Route path="/convert" element={<Convert />}>
                  <Route path="" element={<ConvertIndex />} />
                  <Route path="connect-spotify" element={<ConnectSpotify />} />
                  <Route path="connect-youtube" element={<ConnectYoutube />} />
                  <Route
                    path="select-playlists"
                    element={<PlaylistsSelection />}
                  />
                </Route>
              </Routes>
            </Suspense>
          </SWRConfig>
        </GoogleOAuthProvider>
      </SessionProvider>
    </ChakraProvider>
  );
}

export default App;
