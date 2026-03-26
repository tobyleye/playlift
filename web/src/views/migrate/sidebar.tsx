import { CheckSmIcon } from "@/icons/check";
import { Box, Flex, Text } from "@chakra-ui/react";

export const STEP_DEFS = [
  {
    path: "connect-youtube",
    label: "Connect YouTube",
    desc: "Authorize read access to your playlists",
  },
  {
    path: "connect-spotify",
    label: "Connect Spotify",
    desc: "Authorize playlist creation access",
  },
  {
    path: "select-playlists",
    label: "Pick playlists",
    desc: "Select what you want to migrate",
  },
];

export default function Sidebar({
  step,
  showSuccess,
}: {
  step: number;
  showSuccess: boolean;
}) {
  return (
    <Flex
      direction="column"
      gap={8}
      bg="brand.surface"
      borderRight="0.5px solid"
      borderColor="border.subtle"
      px={6}
      py={8}
    >
      <Box>
        <Box
          as="h2"
          fontFamily={"heading"}
          fontSize="1.55rem"
          lineHeight={1.2}
          color="text.primary"
        >
          Let's get
          <br />
          <Box as="em" fontStyle="italic" color="text.muted">
            your music
          </Box>
          <br />
          moving.
        </Box>
        <Text
          fontSize="sm"
          color="text.muted2"
          lineHeight={1.6}
          fontWeight={300}
          mt="0.4rem"
        >
          Connect your accounts and pick playlists to migrate. Takes about a
          minute.
        </Text>
      </Box>

      {/* Step list */}
      <Box display="flex" flexDirection="column">
        {STEP_DEFS.map((s, i) => {
          const num = i + 1;
          const isActive = step === num && !showSuccess;
          const isDone = num < step || showSuccess;
          return (
            <Box
              key={s.path}
              position="relative"
              display="flex"
              gap="14px"
              alignItems="flex-start"
              py="12px"
              sx={{
                "&:not(:last-child)::after": {
                  content: '""',
                  position: "absolute",
                  left: "14px",
                  top: "40px",
                  width: "1px",
                  height: "calc(100% - 20px)",
                  background: "rgba(255,255,255,0.07)",
                },
              }}
            >
              <Flex
                w="28px"
                h="28px"
                borderRadius="50%"
                align="center"
                justify="center"
                fontSize="12px"
                fontWeight={isActive ? 700 : 500}
                flexShrink={0}
                position="relative"
                zIndex={1}
                border="1px solid"
                transition="all .3s"
                borderColor={
                  isActive
                    ? "brand.accent"
                    : isDone
                      ? "brand.spotifyBorder"
                      : "rgba(255,255,255,0.12)"
                }
                bg={
                  isActive
                    ? "brand.accent"
                    : isDone
                      ? "brand.spotifyDim"
                      : "brand.bg"
                }
                color={
                  isActive
                    ? "brand.bg"
                    : isDone
                      ? "brand.spotify"
                      : "text.muted2"
                }
              >
                {isDone ? <CheckSmIcon /> : num}
              </Flex>
              <Box pt="3px">
                <Text
                  fontSize="sm"
                  fontWeight={500}
                  transition="color .3s"
                  color={
                    isActive
                      ? "text.primary"
                      : isDone
                        ? "brand.spotify"
                        : "text.muted2"
                  }
                >
                  {s.label}
                </Text>
                <Text
                  fontSize="xs"
                  color="text.muted2"
                  mt="2px"
                  lineHeight={1.5}
                >
                  {s.desc}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Flex>
  );
}
