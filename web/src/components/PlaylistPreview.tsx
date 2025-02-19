import { useMediaQuery } from "@chakra-ui/react";
import { BoxIcon } from "lucide-react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from "@chakra-ui/react";
import { ArrowRight, Loader2, Music, Check, Clock } from "lucide-react";

export default function PlaylistPreview({
  isPreviewOpen,
  setIsPreviewOpen,
  playlistData,
  onConvert,
  destination,
}: {
  isPreviewOpen: boolean;
  setIsPreviewOpen: (val: boolean) => void;
  playlistData: any;
  onConvert?: () => void;
  destination?: string;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const renderPreviewContent = () => {
    const playlist = playlistData.object;
    return (
      <Box spaceY={4}>
        <Flex alignItems="center" spaceX={4}>
          <Box w={24} h={24} bg="gray.200" rounded="lg"></Box>
          <Box>
            <Heading as="h3" fontSize="xl" fontWeight="semibold">
              {playlist.name}
            </Heading>
            <Text fontSize="sm" color={"gray.500"}>
              By {playlist.creator}
            </Text>
            <Flex alignItems="center" spaceX={2} mt={2}>
              <Music className="w-4 h-4 text-teal-500" />
              <Text fontSize="sm">{playlist.trackCount} tracks</Text>
              <Clock className="w-4 h-4 text-teal-500 ml-2" />
              <Text fontSize="sm">{playlist.duration}</Text>
            </Flex>
          </Box>
        </Flex>
        <Box h="300px" rounded="md" border="1px" borderColor="gray.200" p={4}>
          {playlist.tracks.tracks.map((track: any) => (
            <Flex
              key={track.id}
              justifyContent="space-between"
              alignItems="center"
              py={2}
              borderBottom="1px"
              borderColor="gray.200"
              _last={{ borderBottom: "none" }}
            >
              <Box>
                <Text fontWeight="medium">{track.name}</Text>
                <Text fontSize="sm" color={"gray.500"}>
                  {track.artist}
                </Text>
              </Box>
              <Text fontSize="sm" color={"gray.500"}>
                {track.duration}
              </Text>
            </Flex>
          ))}
        </Box>
        <Button
          onClick={onConvert}
          w="full"
          bg="teal.500"
          _hover={{ bg: "teal.600" }}
          color="white"
        >
          {destination
            ? `Convert Playlist to ${destination}`
            : `Convert Playlist`}
        </Button>
      </Box>
    );
  };

  return (
    <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)}>
      <ModalOverlay />
      <ModalContent maxW="425px" bg="white">
        <ModalHeader>Playlist Preview</ModalHeader>
        <ModalCloseButton />
        <ModalBody>{playlistData && renderPreviewContent()}</ModalBody>
      </ModalContent>
    </Modal>
  );
}

// return isDesktop ? (
//     <></>
// ) : (
//   <Drawer open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
//     <DrawerTrigger asChild></DrawerTrigger>
//     <DrawerContent className="bg-white">
//       <DrawerHeader>
//         <DrawerTitle>Playlist Preview</DrawerTitle>
//       </DrawerHeader>
//       {playlistData && renderPreviewContent()}
//     </DrawerContent>
//   </Drawer>
