import { Link } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Text,
  Link as ChakraLink,
  Button,
  Container,
  Grid,
  Icon,
} from "@chakra-ui/react";

import { ArrowRight, CheckCircle, Music, Repeat, Zap } from "lucide-react";

export default function Index() {
  return (
    <Box className="flex flex-col min-h-screen bg-gradient-to-b from-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <Box
        as="header"
        px={{ base: 4, lg: 6 }}
        h="14"
        display="flex"
        alignItems="center"
        borderBottom="1px"
        borderColor="purple.200"
        bg="whiteAlpha.50"
        backdropBlur="md"
      >
        <ChakraLink as={Link} to="/" display="flex" alignItems="center">
          <Music className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <Text ml={2} fontSize="lg" fontWeight="bold" color="purple.800">
            Playlist Converter
          </Text>
        </ChakraLink>
        <Flex ml="auto" gap={{ base: 4, sm: 6 }}>
          <ChakraLink
            as={Link}
            to="#features"
            fontSize="sm"
            fontWeight="medium"
            color="purple.600"
            _hover={{ color: "purple.800" }}
          >
            Features
          </ChakraLink>
          <ChakraLink
            as={Link}
            to="#pricing"
            fontSize="sm"
            fontWeight="medium"
            color="purple.600"
            _hover={{ color: "purple.800" }}
          >
            Pricing
          </ChakraLink>
          <ChakraLink
            as={Link}
            to="#about"
            fontSize="sm"
            fontWeight="medium"
            color="purple.600"
            _hover={{ color: "purple.800" }}
          >
            About
          </ChakraLink>
        </Flex>
      </Box>
      <Box as="main" flex="1">
        <Box as="section" w="full" py={{ base: 12, md: 24 }}>
          <Container px={{ base: 4, md: 6 }} maxW={"full"}>
            <Flex
              flexDirection="column"
              alignItems="center"
              textAlign="center"
              columnGap={4}
            >
              <Box columnGap={2}>
                <Heading
                  as="h1"
                  mb={4}
                  fontSize={{ base: "3xl", sm: "4xl", md: "5xl", lg: "6xl" }}
                  fontWeight="bold"
                  bgClip="text"
                  textColor="transparent"
                  bgGradient="linear(to-r, purple.600, blue.500)"
                >
                  Convert Your Playlists
                  <br /> Seamlessly
                </Heading>
                <Text
                  mb={6}
                  mx="auto"
                  maxW="700px"
                  fontSize={{ md: "xl" }}
                  color="purple.800"
                >
                  Switch between music platforms without losing your carefully
                  curated playlists. Fast, easy, and free.
                </Text>
              </Box>
              <Flex>
                <ChakraLink as={Link} to="/home">
                  <Button
                    bg="purple.600"
                    _hover={{ bg: "purple.700" }}
                    color="white"
                  >
                    Start Converting
                  </Button>
                </ChakraLink>
              </Flex>
            </Flex>
          </Container>
        </Box>

        {/* why choose us */}
        <Box
          as="section"
          w="full"
          py={{ base: 12, md: 24, lg: 32 }}
          bgGradient="linear(to-r, blue.500, purple.600)"
          color="white"
        >
          <Container px={{ base: 4, md: 6 }} maxWidth="full">
            <Heading
              as="h2"
              fontSize={{ base: "3xl", sm: "4xl", md: "5xl" }}
              textAlign="center"
              mb={8}
            >
              Why Choose Us?
            </Heading>
            <Grid
              gap={8}
              templateColumns={{ sm: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }}
            >
              <Flex
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                columnGap={2}
                p={4}
                rounded="lg"
                backgroundColor="whiteAlpha.100"
                backdropBlur="md"
              >
                <Icon as={Zap} h={8} w={8} mb={2} color="yellow.300" />

                <Heading as="h3" fontSize="xl" fontWeight="bold" mb={2}>
                  Lightning Fast
                </Heading>
                <Text fontSize="sm" textAlign="center">
                  Convert your playlists in seconds, not minutes.
                </Text>
              </Flex>

              <Flex
                flexDirection="column"
                alignItems="center"
                columnGap={2}
                p={4}
                rounded="lg"
                backgroundColor="whiteAlpha.100"
                backdropBlur="md"
              >
                <Icon as={Repeat} h={8} w={8} mb={2} color="green.300" />

                <Heading as="h3" fontSize="xl" fontWeight="bold">
                  Multiple Platforms
                </Heading>
                <Text fontSize="sm" textAlign="center">
                  Support for all major music streaming services.
                </Text>
              </Flex>
              <Flex
                flexDirection="column"
                alignItems="center"
                columnGap={2}
                p={4}
                rounded="lg"
                backgroundColor="whiteAlpha.100"
                backdropBlur="md"
              >
                <Icon as={CheckCircle} h={8} w={8} mb={2} color="blue.300" />

                <Heading as="h3" fontSize="xl" fontWeight="bold">
                  100% Accurate
                </Heading>
                <Text fontSize="sm" textAlign="center">
                  Our smart matching ensures you don't lose any tracks.
                </Text>
              </Flex>
            </Grid>
          </Container>
        </Box>

        {/* how it works */}
        <Box as="section" w="full" py={{ base: 12, md: 24, lg: 32 }}>
          <Container px={{ base: 4, md: 6 }} maxWidth="full">
            <Heading
              as="h2"
              fontSize={{ base: "3xl", sm: "4xl", md: "5xl" }}
              textAlign="center"
              mb={8}
              color="purple.800"
            >
              How It Works
            </Heading>
            <Grid
              rowGap={10}
              columnGap={6}
              templateColumns={{ sm: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }}
            >
              <Flex
                flexDirection="column"
                alignItems="center"
                columnGap={2}
                p={4}
                rounded="lg"
                bg="white"
                shadow="lg"
              >
                <Box
                  bg="purple.600"
                  color="white"
                  rounded="full"
                  w={8}
                  h={8}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mb={4}
                >
                  1
                </Box>
                <Heading
                  as="h3"
                  fontSize="xl"
                  fontWeight="bold"
                  color="purple.600"
                >
                  Select Platforms
                </Heading>
                <Text fontSize="sm" color="purple.800" textAlign="center">
                  Choose your source and destination music platforms.
                </Text>
              </Flex>
              <Flex
                flexDirection="column"
                alignItems="center"
                columnGap={2}
                p={4}
                rounded="lg"
                bg="white"
                shadow="lg"
              >
                <Box
                  bg="purple.600"
                  color="white"
                  rounded="full"
                  w={8}
                  h={8}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mb={4}
                >
                  2
                </Box>
                <Heading
                  as="h3"
                  fontSize="xl"
                  fontWeight="bold"
                  color="purple.600"
                >
                  Pick Playlists
                </Heading>
                <Text fontSize="sm" color="purple.800" textAlign="center">
                  Select the playlists you want to transfer.
                </Text>
              </Flex>
              <Flex
                flexDirection="column"
                alignItems="center"
                columnGap={2}
                p={4}
                rounded="lg"
                bg="white"
                shadow="lg"
              >
                <Box
                  bg="purple.600"
                  color="white"
                  rounded="full"
                  w={8}
                  h={8}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mb={4}
                >
                  3
                </Box>
                <Heading
                  as="h3"
                  fontSize="xl"
                  fontWeight="bold"
                  color="purple.600"
                >
                  Convert & Enjoy
                </Heading>
                <Text fontSize="sm" color="purple.800" textAlign="center">
                  Let our app do the magic and enjoy your music anywhere.
                </Text>
              </Flex>
            </Grid>
          </Container>
        </Box>

        {/* ready to convert */}
        <Box
          as="section"
          w="full"
          py={{ base: 12, md: 24, lg: 32 }}
          bgGradient="linear(to-r, purple.600, blue.500)"
          color="white"
        >
          <Container px={{ base: 4, md: 6 }}>
            <Box textAlign="center">
              <Heading
                as="h2"
                fontSize={{ base: "3xl", sm: "4xl", md: "5xl" }}
                fontWeight="bold"
                mb={2}
              >
                Ready to Convert Your Playlists?
              </Heading>
              <Text mx="auto" maxW="600px" fontSize={{ md: "xl" }} mb={4}>
                Join thousands of music lovers who have already made the switch.
                Try our playlist converter now!
              </Text>
              <Link to="/home">
                <Button
                  type="submit"
                  bg="white"
                  color="purple.600"
                  _hover={{ bg: "purple.100" }}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Box>
          </Container>
        </Box>
      </Box>
      <Box
        as="footer"
        display="flex"
        flexDirection={{ base: "column", sm: "row" }}
        py={6}
        w="full"
        alignItems="center"
        px={{ base: 4, md: 6 }}
        borderTop="1px"
        borderColor="purple.200"
        bg="whiteAlpha.50"
        backdropBlur="md"
      >
        <Text fontSize="xs" color="purple.600">
          © 2024 Playlist Converter. All rights reserved.
        </Text>
        <Flex ml={{ sm: "auto" }} gap={{ base: 4, sm: 6 }}>
          <ChakraLink
            as={Link}
            to="#"
            fontSize="xs"
            color="purple.600"
            _hover={{ color: "purple.800" }}
          >
            Terms of Service
          </ChakraLink>
          <ChakraLink
            as={Link}
            to="#"
            fontSize="xs"
            color="purple.600"
            _hover={{ color: "purple.800" }}
          >
            Privacy
          </ChakraLink>
        </Flex>
      </Box>
    </Box>
  );
}
