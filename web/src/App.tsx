import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { theme } from "./theme/theme.ts";
import SessionProvider from "./providers/SessionProvider.tsx";
import { SWRConfig } from "swr";

const Landing = lazy(() => import("./views/landing/landing.tsx"));
const LoginCallback = lazy(() => import("./views/landing/login-callback.tsx"));

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
const DetailsPage = lazy(() => import("./views/details-page/details-page.tsx"));

const PrivateRouteProtector = () => {
  const [loggedIn] = useState(() => localStorage.getItem("userId") !== null);
  if (!loggedIn) {
    return <Navigate to="/" replace />;
  } else {
    return <Outlet />;
  }
};

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
                <Route path="/" element={<Landing />}>
                  <Route path="login/callback" element={<LoginCallback />} />
                </Route>

                <Route path="/convert" element={<Convert />}>
                  <Route
                    index
                    path=""
                    element={<Navigate to="/convert/connect-youtube" replace />}
                  />
                  <Route path="connect-youtube" element={<ConnectYoutube />} />
                  <Route path="connect-spotify" element={<ConnectSpotify />} />
                  <Route
                    path="select-playlists"
                    element={<PlaylistsSelection />}
                  />
                </Route>
                <Route path="/" element={<PrivateRouteProtector />}>
                  <Route path="/home" element={<Home />} />
                  <Route path="/details/:id" element={<DetailsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </SWRConfig>
        </GoogleOAuthProvider>
      </SessionProvider>
    </ChakraProvider>
  );
}

export default App;
