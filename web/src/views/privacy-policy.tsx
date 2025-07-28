import Nav from "@/components/nav";
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  UnorderedList,
  ListItem,
  VStack,
  Link as StyledLink,
} from "@chakra-ui/react";

export default function PrivacyPolicy() {
  return (
    <Box>
      <Nav rightElement={<></>} />
      <Box maxW="4xl" mx="auto" mt={10} px={6}>
        <Heading as="h1" fontSize="3xl" mb={4} color="white">
          Privacy Policy
        </Heading>

        <Card
          bg="whiteAlpha.200"
          borderBottomRadius={0}
          borderColor="whiteAlpha.200"
        >
          <CardBody>
            <VStack spacing={8} align="stretch">
              <Box>
                <Heading as="h2" fontSize="xl" mb={3} color="white">
                  1. Introduction
                </Heading>
                <Text lineHeight="relaxed" color="gray.300">
                  Playlift helps users transfer playlists between supported
                  music platforms like Spotify and YouTube. We are committed to
                  protecting your privacy and handling your data with
                  transparency and care.
                </Text>
              </Box>

              <Box>
                <Heading as="h2" fontSize="xl" mb={3} color="white">
                  2. Information We Collect
                </Heading>
                <Text mb={4} lineHeight="relaxed" color="gray.300">
                  We collect the following types of personal information when
                  you use Playlift:
                </Text>
                <UnorderedList spacing={2} ml={6} color="gray.300">
                  <ListItem>
                    Account information from music streaming platforms (with
                    your consent)
                  </ListItem>
                  <ListItem>
                    Access tokens – used to securely access your music accounts
                    (Spotify or YouTube) during playlist migration.
                  </ListItem>
                  <ListItem>
                    Playlist metadata – such as playlist titles and content,
                    used to facilitate and display migration results
                  </ListItem>
                </UnorderedList>
              </Box>
              <Box>
                <Heading as="h2" fontSize="xl" mb={3} color="white">
                  3. How We Use Your Information
                </Heading>
                <Text mb={4} lineHeight="relaxed" color="gray.300">
                  Your information is used solely for the following purposes:
                </Text>
                <UnorderedList spacing={2} ml={6} mb={4} color="gray.300">
                  <ListItem>
                    Facilitate playlist transfers between supported platforms
                  </ListItem>
                  <ListItem>Managing your account and login sessions</ListItem>
                </UnorderedList>
                <Text lineHeight="relaxed" color="gray.300">
                  We do not use your data for advertising or analytics, and we
                  do not share or sell your personal information to third
                  parties.
                </Text>
              </Box>

              <Box>
                <Heading as="h2" fontSize="xl" mb={3} color="white">
                  4. Data Security
                </Heading>
                <Text lineHeight="relaxed" color="gray.300">
                  We follow industry best practices to protect your data. All
                  sensitive information is transmitted and stored securely using
                  encryption and access controls.
                </Text>
              </Box>
              <Box>
                <Heading as="h2" fontSize="xl" mb={3} color="white">
                  5. Third-Party APIs
                </Heading>
                <Text lineHeight="relaxed" color="gray.300">
                  Our service integrates with music streaming platforms
                  including Spotify, YouTube Music, and others. When you connect
                  these services, you are also subject to their respective
                  privacy policies and terms of service.
                </Text>
              </Box>

              <Box>
                <Heading as="h2" fontSize="xl" mb={3} color="white">
                  6. Data Retention
                </Heading>
                <Text lineHeight="relaxed" color="gray.300">
                  We retain your information only as long as necessary to
                  provide our services and comply with legal obligations. You
                  can request deletion of your data at any time.
                </Text>
              </Box>
              <Box>
                <Heading as="h2" fontSize="xl" mb={3} color="white">
                  7. Contact Us
                </Heading>
                <Text mb={4} lineHeight="relaxed" color="gray.300">
                  If you have any questions about this Privacy Policy or our
                  data practices, please contact us at:{" "}
                  <StyledLink
                    href="mailto:hey@playlist.lol"
                    color="gray.300"
                    textDecor="underline"
                  >
                    hey@playlist.lol
                  </StyledLink>
                </Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
}
