import { Box, Link as StyledLink } from "@chakra-ui/react";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function Nav({ rightElement }: { rightElement?: ReactNode }) {
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
            to="/"
            fontWeight={800}
            fontSize="xl"
            textDecor={"none"}
            _hover={{ textDecor: "none" }}
          >
            Playlist Migrator
          </StyledLink>
        </Box>

        <Box ml="auto" flex={1} display="flex" justifyContent="flex-end">
          {rightElement}
        </Box>
      </Box>
    </Box>
  );
}
