import { GradientButton } from "@/components/buttons";
import { Playlist } from "@/types";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Text,
  Heading,
  Box,
} from "@chakra-ui/react";

export default function ConfirmationModal({
  open,
  setOpen,
  onConfirm,
  selectedPlaylists,
}: {
  open: boolean;
  setOpen: (show: boolean) => void;
  sourcePlatform: string;
  destinationPlatform: string;
  selectedPlaylists: Playlist[];

  onConfirm: () => void;
}) {
  const totalTracks = selectedPlaylists.reduce(
    (acc, playlist) => acc + Number(playlist.total_tracks),
    0
  );

  return (
    <Modal isOpen={open} onClose={() => setOpen(false)}>
      <ModalOverlay bg="blackAlpha.800" />

      <ModalContent
        bg="gray.900"
        color="white"
        containerProps={{
          px: 4,
        }}
      >
        <ModalCloseButton />
        <ModalBody px={4} py={6}>
          <Heading pt={2} fontSize="lg" mb={2} textAlign="center">
            Confirm Migration
          </Heading>
          <Text color="gray.300" fontSize="sm" textAlign="center" mb={6}>
            You're about to migrate the following playlists
          </Text>
          <Box maxH="72" overflow="auto" mb={4}>
            {selectedPlaylists.map((p) => (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                bg="gray.800"
                p={2}
                rounded="md"
                key={p.playlist_id}
              >
                <Text> {p.title}</Text>
                <Text fontWeight="bold" fontSize="sm" color="gray.400">
                  {p.total_tracks}
                </Text>
              </Box>
            ))}
          </Box>

          <Box
            border="1px solid"
            borderColor="whiteAlpha.300"
            bg="gray.800"
            opacity={0.8}
            py={2}
            px={4}
            rounded="md"
            textAlign="center"
          >
            <Text fontWeight="bold">{selectedPlaylists.length} Playlists</Text>
            <Text color="whiteAlpha.500">{totalTracks} total tracks</Text>
          </Box>
        </ModalBody>
        <ModalFooter>
          <GradientButton
            borderRadius="md"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            Continue
          </GradientButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
