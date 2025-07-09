import { Heading, Box, Text, Icon } from "@chakra-ui/react";
import { CheckIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function Success({
  totalPlaylists,
}: {
  totalPlaylists: number;
}) {
  return (
    <Box minH="80vh" display="flex" justifyContent="center" alignItems="center">
      <Box color="white" textAlign="center">
        <Box
          w={20}
          h={20}
          mx="auto"
          rounded="full"
          mb={4}
          bg="green.500"
          display="grid"
          placeItems="center"
        >
          <Icon as={CheckIcon} w={10} h={10} />
        </Box>
        <Heading mb={4}>Migration Started!</Heading>
        <Text color="whiteAlpha.800" maxW={"md"} mb={4}>
          Successfully migrated {totalPlaylists} playlist to YouTube Music.
        </Text>
        <Box>
          <Link to="/home">Go home</Link>
        </Box>
      </Box>
    </Box>
  );
}
