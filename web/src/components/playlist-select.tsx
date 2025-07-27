import { Playlist } from "@/types";
import { Box, Text, Spinner } from "@chakra-ui/react";
import { CheckIcon } from "lucide-react";

export const PlaylistSelect = ({
  isLoading,
  playlists,
  onToggle,
  selected,
}: {
  playlists: Playlist[];
  onToggle: (playlist: Playlist) => void;
  selected: string[];
  isLoading?: boolean;
}) => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="lg"
        />
      </Box>
    );
  }

  return (
    <Box display="grid" gap={4}>
      {playlists.map((pl, index) => {
        const isSelected = selected.includes(pl.playlist_id);
        const isDisabled = pl.total_tracks == 0;

        return (
          <Box
            key={`playlist-item-index-${index}-id-${pl.playlist_id}`}
            as="button"
            display="flex"
            alignItems="center"
            gap={4}
            py={4}
            px={4}
            rounded="lg"
            border="1px solid"
            borderColor={"whiteAlpha.200"}
            w="full"
            bg="whiteAlpha.100"
            transition="ease .25s"
            aria-selected={isSelected}
            _selected={{
              bg: "var(--btn-bg-selected)",
              borderColor: "var(--btn-border-selected)",
            }}
            _disabled={{
              opacity: 0.6,
            }}
            _hover={
              isDisabled
                ? {}
                : isSelected
                ? { opacity: 0.9 }
                : { bg: "whiteAlpha.300" }
            }
            onClick={() => {
              onToggle(pl);
            }}
            disabled={isDisabled}
          >
            <Box
              w={4}
              h={4}
              display="flex"
              alignItems="center"
              justifyContent="center"
              rounded={"4px"}
              border="2px solid"
              borderColor={
                isSelected ? "var(--checkbox-bg-selected)" : "whiteAlpha.700"
              }
              bg={isSelected ? "var(--checkbox-bg-selected)" : "transparent"}
            >
              {isSelected && <CheckIcon />}
            </Box>

            <Box textAlign="left">
              <Text
                fontWeight="medium"
                style={{
                  color: "var(--color)",
                }}
              >
                {pl.title}
              </Text>
              <Text fontSize="sm" color="whiteAlpha.700">
                {pl.total_tracks} tracks
              </Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
