import { Box, Link as StyledLink } from "@chakra-ui/react";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/logo";
import useLoggedIn from "@/hooks/useLoggedIn";
import UserMenu from "./user-menu";

export default function Nav({ rightElement }: { rightElement?: ReactNode }) {
  const loggedIn = useLoggedIn();

  return (
    <Box as="nav" py={4}>
      <Box
        w={{
          base: "full",
          lg: "90%",
        }}
        mx="auto"
        display="flex"
        alignItems="center"
        px={4}
      >
        <Box color="white" flexShrink={0} mr={6}>
          <StyledLink
            as={Link}
            to={loggedIn ? "/home" : "/"}
            fontWeight={800}
            fontSize="2xl"
            textDecor={"none"}
            _hover={{ textDecor: "none" }}
            display="flex"
            alignItems="center"
            gap={1}
          >
            <Logo />
            Playlift
          </StyledLink>
        </Box>

        <Box ml="auto" flex={1} display="flex" justifyContent="flex-end">
          {rightElement ? rightElement : <UserMenu />}
        </Box>
      </Box>
    </Box>
  );
}
