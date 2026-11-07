import { Box, Button, Icon, Input, Spinner } from "@chakra-ui/react";
import { Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { GradientButton } from "@/components/buttons";
import {
  getServiceColor,
  getServiceIcon,
  getServiceLabel,
} from "@/constants/constants";
import { detectPlatform } from "./detect-platform";

const testPlaylists = [
  "https://open.spotify.com/playlist/31ymdYCITDnZRtkKzP3Itp?si=12_E9IW8Q6uuHrZ54uAUpg",
  "https://open.spotify.com/playlist/1Ejhas5z6QIbnAapTmT6C5?si=944d177dd38f4112",
  "https://open.spotify.com/playlist/3mwMYE3NLNQA76cdmWPbH4?si=51a30edccf864e01",
  "https://music.youtube.com/playlist?list=PL8zS8JsgQy1BVyaTSkF7qrjMKsAuZKM1t&si=jFtIvArAi9_VQJ6O",
  "https://music.youtube.com/playlist?list=RDCLAK5uy_nEnpCM6rHJYEPKumrMpR8HJaRCww_vr5U&playnext=1&si=P5hYu_wcSbWQj-eS",
  "https://music.youtube.com/playlist?list=RDCLAK5uy_mp5cNmReB3OGMjoRsbRrNMOBczEy-o32s&playnext=1&si=KRu6_JDpwx7swHeo",
];

export default function PasteForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (playlistUrl: string) => void;
  isLoading: boolean;
}) {
  const [playlistUrl, setPlaylistUrl] = useState("");

  const platform = useMemo(() => detectPlatform(playlistUrl), [playlistUrl]);

  const selectTestPlaylist = () => {
    const randomPlaylist =
      testPlaylists[Math.floor(Math.random() * testPlaylists.length)];

    setPlaylistUrl(randomPlaylist);
  };

  return (
    <Box maxW="2xl" mx="auto">
      <Box
        as="form"
        display="flex"
        flexWrap={{ base: "wrap", md: "nowrap" }}
        alignItems="center"
        gap={2}
        bg="whiteAlpha.100"
        border="1px solid"
        borderColor="whiteAlpha.200"
        rounded={{ base: "xl", md: "full" }}
        backdropFilter="blur(16px)"
        p={2}
        pl={{ base: 2, md: 5 }}
        transition=".2s ease-in-out"
        _focusWithin={{
          borderColor: "pink.400",
          boxShadow: "0 0 0 4px rgba(236, 72, 153, .12)",
        }}
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          if (!platform || isLoading) return;
          onSubmit(playlistUrl.trim());
        }}
      >
        {platform && (
          <Box
            flexShrink={0}
            display={{ base: "none", md: "grid" }}
            placeItems="center"
            w={9}
            h={9}
            rounded="full"
            bg="whiteAlpha.200"
            color={getServiceColor(platform)}
            aria-label={getServiceLabel(platform)}
            title={getServiceLabel(platform)}
          >
            <Icon as={getServiceIcon(platform)} w={5} h={5} />
          </Box>
        )}
        <Input
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
          aria-label="playlist url"
          name="playlist_url"
          type="url"
          inputMode="url"
          placeholder="https://open.spotify.com/playlist/…"
          variant="unstyled"
          flex={1}
          minW={0}
          w={{ base: "full", md: "auto" }}
          px={{ base: 3, md: 0 }}
          py={2}
          color="white"
          _placeholder={{ color: "whiteAlpha.500" }}
        />

        <GradientButton
          type="submit"
          flexShrink={0}
          w={{ base: "full", md: "auto" }}
          fontWeight={600}
          gap={2}
          disabled={!platform || isLoading}
        >
          {isLoading && <Spinner size="sm" />}
          {isLoading ? "Loading" : "Convert it"}
        </GradientButton>
      </Box>

      <Box mt={4} textAlign="center" color="gray.300">
        No link handy?{" "}
        <Button
          variant="link"
          color="purple.200"
          fontWeight={500}
          textDecoration="underline"
          textUnderlineOffset={3}
          _hover={{ color: "purple.100" }}
          onClick={selectTestPlaylist}
        >
          Try an example playlist
        </Button>
      </Box>

      <Box
        mt={3}
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap={2}
        color="whiteAlpha.600"
        fontSize="sm"
      >
        <Icon as={Lock} w={3.5} h={3.5} />
        Works with public playlists — no account needed to preview your
        conversion.
      </Box>
    </Box>
  );
}
