import Nav from "@/components/nav";
import { GradientButton } from "@/components/buttons";
import useLoggedIn from "@/hooks/useLoggedIn";
import { Box, Heading, Text } from "@chakra-ui/react";
import { Link, Navigate } from "react-router-dom";

export default function NotFound() {
  const isLoggedIn = useLoggedIn();

  if (isLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Box>
      <Nav rightElement={<></>} />
      <Box textAlign="center" py="15vh" px={6}>
        <Text
          fontSize={{ base: "7xl", md: "9xl" }}
          fontWeight={800}
          lineHeight={1}
          bgGradient="linear(to-r, pink.400, purple.400)"
          bgClip="text"
          mb={6}
        >
          404
        </Text>
        <Heading fontSize="2xl" fontWeight="bold" mb={3}>
          Lost in the shuffle
        </Heading>
        <Text color="whiteAlpha.700" maxW="md" mx="auto" mb={8}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <GradientButton as={Link} to="/" display="inline-flex">
          Back to home
        </GradientButton>
      </Box>
    </Box>
  );
}
