import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  ScrollRestoration,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { theme } from "./theme/theme.ts";
import SessionProvider from "./providers/SessionProvider.tsx";
import { SWRConfig } from "swr";
import useLoggedIn from "./hooks/useLoggedIn.ts";
import "./css/animation.css";

const Landing = lazy(() => import("./views/landing/landing.tsx"));
const Home = lazy(() => import("./views/home/home.tsx"));
// const Convert = lazy(() => import("./views/convert/convert.tsx"));

// const ConnectSpotify = lazy(
//   () => import("./views/convert/connect-spotify.tsx"),
// );
// const ConnectYoutube = lazy(
//   () => import("./views/convert/connect-youtube.tsx"),
// );
// const PlaylistsSelection = lazy(
//   () => import("./views/convert/playlist-selection.tsx"),
// );
const Migrate = lazy(() => import("./views/migrate/migrate.tsx"));
const ConnectSpotify = lazy(
  () => import("./views/migrate/steps/connect-spotify.tsx"),
);
const ConnectYoutube = lazy(
  () => import("./views/migrate/steps/connect-youtube.tsx"),
);
const PlaylistsSelection = lazy(
  () => import("./views/migrate/steps/playlist-selection.tsx"),
);

const DetailsPage = lazy(() => import("./views/details-page/details-page.tsx"));
const PrivacyPolicy = lazy(() => import("./views/privacy-policy.tsx"));
const Settings = lazy(() => import("./views/settings.tsx"));
const HealthCheck = lazy(() => import("./views/HealthCheck.tsx"));

const PrivateRouteProtector = () => {
  const loggedIn = useLoggedIn();
  if (!loggedIn) {
    return <Navigate to="/" replace />;
  } else {
    return <Outlet />;
  }
};

const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  import.meta.env.VITE_APP_GOOGLE_CLIENT_ID;

console.log("your client id is:", googleClientId);

function Root() {
  return (
    <ChakraProvider theme={theme}>
      <SessionProvider>
        <GoogleOAuthProvider clientId={googleClientId}>
          <SWRConfig>
            <Suspense fallback={<div />}>
              <Outlet />
            </Suspense>
          </SWRConfig>
        </GoogleOAuthProvider>
      </SessionProvider>
      <ScrollRestoration />
    </ChakraProvider>
  );
}

const router = createBrowserRouter([
  {
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: "/privacy-policy", Component: PrivacyPolicy },
      {
        path: "/convert",
        Component: Migrate,
        children: [
          {
            index: true,
            Component: () => <Navigate to="connect-youtube" replace />,
          },
          { path: "connect-youtube", index: true, Component: ConnectYoutube },
          { path: "connect-spotify", Component: ConnectSpotify },
          { path: "select-playlists", Component: PlaylistsSelection },
        ],
      },
      { path: "/healthcheck", Component: HealthCheck },
      // {
      //   path: "/convert",
      //   Component: Convert,
      //   children: [
      //     {
      //       index: true,
      //       Component: () => <Navigate to="connect-youtube" replace />,
      //     },
      //     { path: "connect-youtube", index: true, Component: ConnectYoutube },
      //     { path: "connect-spotify", Component: ConnectSpotify },
      //     { path: "select-playlists", Component: PlaylistsSelection },
      //   ],
      // },
      {
        Component: PrivateRouteProtector,
        children: [
          { path: "/home", Component: Home },
          { path: "/details/:id", Component: DetailsPage },
          { path: "/settings", Component: Settings },
        ],
      },
    ],
  },
]);

const App = () => <RouterProvider router={router} />;

export default App;
