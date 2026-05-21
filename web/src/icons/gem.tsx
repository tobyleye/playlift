import { Box } from "@chakra-ui/react";

export function GemIcon() {
  return (
    <Box
      w="20px"
      h="20px"
      bg="brand.accent"
      borderRadius="5px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <svg width="11" height="11" viewBox="0 0 11 11" fill="#0d0d0d">
        <polygon points="5.5,1 10,5.5 5.5,10 1,5.5" />
      </svg>
    </Box>
  );
}
