import { Modal, ModalContent, ModalOverlay } from "@chakra-ui/react";
import EllipsisLoader from "./ellipsis-loader";

export default function BackdropLoader({
  loadingText,
}: {
  loadingText: string;
}) {
  return (
    <Modal isOpen={true} onClose={() => {}} isCentered>
      <ModalOverlay
        bg="blackAlpha.300"
        backdropFilter="blur(6px) hue-rotate(40deg)"
      />
      <ModalContent bg="unset" textAlign="center" shadow="none">
        <EllipsisLoader text={loadingText} fontWeight="bold" fontSize="xl" />
      </ModalContent>
    </Modal>
  );
}
