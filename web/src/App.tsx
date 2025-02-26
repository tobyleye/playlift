import {
  createBrowserRouter,
  Link,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { Box, ChakraProvider, Flex } from "@chakra-ui/react";

import "./App.css";

import ConversionThroughLink from "./views/link-conversion/LinkConversion.tsx";
import AppLayout from "./layouts/AppLayout.tsx";
import Login from "./views/Login.tsx";
import SessionLoader from "./providers/SessionLoader.tsx";

const Home = lazy(() => import("./views/Home.tsx"));
const ConvertPlaylist = lazy(() => import("./views/ConvertPlaylist.tsx"));

const ConvertPlaylist1 = lazy(
  () => import("./views/convert-old/convert-playlist-1.tsx")
);
const ConvertPlaylist2 = lazy(
  () => import("./views/convert-old/convert-playlist-2.tsx")
);
const ConvertPlaylist3 = lazy(
  () => import("./views/convert-old/convert-playlist-3.tsx")
);

const ConversionDetails = lazy(
  () => import("./views/conversions/details-1.tsx")
);

const LandingPage = lazy(() => import("./views/landing/landing-1.tsx"));

function OtherConversionLinks() {
  return (
    <Flex justifyContent="center" gap={2} py={2}>
      <Box>
        <Link to="/convert-playlist/1">01</Link>
      </Box>
      <Box>
        <Link to="/convert-playlist/2">02</Link>
      </Box>

      <Box>
        <Link to="/convert-playlist/3">03</Link>
      </Box>
      <Box>
        <Link to="/convert-playlist/4">04</Link>
      </Box>
    </Flex>
  );
}
const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: "/home",
        element: <Home />,
      },
      {
        path: "/convert-playlist",
        element: (
          <Box>
            {/* <OtherConversionLinks /> */}
            <Outlet />
          </Box>
        ),
        children: [
          {
            path: "",
            element: <ConvertPlaylist />,
          },
          {
            path: "/convert-playlist/2",
            element: <ConvertPlaylist2 />,
          },
          {
            path: "/convert-playlist/3",
            element: <ConvertPlaylist3 />,
          },
          {
            path: "/convert-playlist/4",
            element: <Outlet />,
            children: [
              {
                path: "/convert-playlist/4/with-link",
                element: <ConversionThroughLink />,
              },
              {
                path: "/convert-playlist/4",
                element: <ConvertPlaylist />,
              },
            ],
          },
        ],
      },
      {
        path: "/conversion/:conversionId",
        element: <ConversionDetails />,
      },
    ],
  },
]);

function App() {
  return (
    <Suspense fallback={<div />}>
      <SessionLoader>
        <ChakraProvider>
          <RouterProvider router={router}></RouterProvider>
        </ChakraProvider>
      </SessionLoader>
    </Suspense>
  );
}

export default App;
