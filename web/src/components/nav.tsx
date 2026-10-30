import { Box, Flex } from "@chakra-ui/react";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import UserMenu from "./user-menu";
import useLoggedIn from "@/hooks/useLoggedIn";
import { GemIcon } from "@/icons/gem";

export default function Nav({ rightElement }: { rightElement?: ReactNode }) {
  const isLoggedIn = useLoggedIn();

  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      px={6}
      h="54px"
      borderBottom="0.5px solid"
      borderColor="border.subtle"
      bg="brand.surface"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex
        as={Link}
        to={isLoggedIn ? "/home" : "/"}
        align="center"
        gap={2}
        fontFamily="heading"
        fontSize="1.1rem"
        color="text.primary"
      >
        <GemIcon />
        Playlift
      </Flex>

      <Box>{rightElement ? rightElement : <UserMenu />}</Box>
    </Flex>
  );
}
