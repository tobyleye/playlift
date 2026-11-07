import { Box, Icon, Link as StyledLink } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import Nav from "@/components/nav";
import { SecondaryButton } from "@/components/buttons";
import BackdropLoader from "@/components/backdrop-loader";
import { useSessionContext } from "@/contexts/session";

/** the logged-out chrome: background, nav with sign-in, centred main, footer */
export default function GuestShell({
  onLogin,
  signingIn,
  children,
}: {
  onLogin: () => void;
  signingIn: boolean;
  children: React.ReactNode;
}) {
  const { session, loadingSession } = useSessionContext();

  return (
    <Box>
      {signingIn && <BackdropLoader loadingText="Signing you in" />}

      <BGShapes />
      <Box position="relative">
        <Nav
          rightElement={
            loadingSession ? (
              <Box />
            ) : !session ? (
              <SecondaryButton onClick={onLogin} fontSize="md" py={2}>
                <Icon as={FcGoogle} />
                Login
              </SecondaryButton>
            ) : null
          }
        />

        <Box as="main" px={6} mt={6}>
          <Box mb={20} maxWidth={896} mx="auto">
            {children}
          </Box>
        </Box>

        <Box
          width="full"
          as="footer"
          display="flex"
          flexDir={{ base: "column", lg: "row" }}
          gap={4}
          alignItems="center"
          justifyContent="space-between"
          pt={4}
          pb={6}
          px={4}
          mx="auto"
          w={{
            base: "full",
            lg: "90%",
          }}
          sx={{
            a: {
              color: "whiteAlpha.800",
              textDecor: "none",
              _hover: {
                color: "white",
                textDecor: "underline",
              },
            },
          }}
        >
          <Box display="flex" alignItems="center" gap={4}>
            <StyledLink
              as={Link}
              to="mailto:hey@playlift.lol?subject=Hey Playlift"
              fontWeight="semibold"
              color="whiteAlpha.800"
            >
              Contact us
            </StyledLink>
            <StyledLink
              as={Link}
              to="/privacy-policy"
              fontWeight="semibold"
              color="whiteAlpha.800"
            >
              Privacy Policy
            </StyledLink>
          </Box>
          <Box>
            <StyledLink
              fontWeight="semibold"
              href="http://oluwatobi.vercel.app"
              rel="noreferrer"
              target="_blank"
            >
              Oluwatobi
            </StyledLink>
            {"・"}
            ❤️
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function BGShapes() {
  return (
    <Box
      pos={"absolute"}
      inset={0}
      pointerEvents="none"
      className="absolute inset-0 pointer-events-none"
    >
      <Box
        pos="absolute"
        top={20}
        left={10}
        w={32}
        h={32}
        rounded="full"
        bg="linear-gradient(to right, rgb(236, 72, 153), rgb(139, 92, 246))"
        opacity={0.2}
      ></Box>
      <Box
        pos="absolute"
        top={40}
        right={20}
        w={24}
        h={24}
        rounded="full"
        bg="linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246))"
        opacity={0.3}
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-30 animate-bounce"
      ></Box>
      <Box
        pos="absolute"
        bottom={20}
        left="25%"
        w={40}
        h={40}
        rounded="full"
        bg="linear-gradient(to right, rgb(34, 197, 94), rgb(20, 184, 166))"
        opacity={0.2}
        className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-500 to-teal-500 rounded-full opacity-20 animate-pulse delay-1000"
      ></Box>
      {/* <Box
        pos="absolute"
        bottom={40}
        right="33.3%"
        w={28}
        h={28}
        rounded="full"
        bg="linear-gradient(to right, rgb(249, 115, 22), rgb(239, 68, 68))"
        opacity={0.25}
        className="absolute bottom-40 right-1/3 w-28 h-28 bg-gradient-to-r from-orange-500 to-red-500 rounded-full opacity-25 animate-bounce delay-500"
      ></Box>
      <Box
        pos="absolute"
        top={"50%"}
        left={"50%"}
        w={20}
        h={20}
        rounded="full"
        bg="linear-gradient(to right, rgb(234, 179, 8), rgb(249, 115, 22))"
        opacity={0.3}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full opacity-30 animate-spin"
      ></Box> */}
    </Box>
  );
}
