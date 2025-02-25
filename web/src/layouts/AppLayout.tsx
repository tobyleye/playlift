import { Link, Outlet } from "react-router-dom";

import {
  Box,
  Flex,
  Link as ChakraLink,
  Text,
  Container,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Image,
  Modal,
  ModalContent,
  ModalBody,
  ModalOverlay,
} from "@chakra-ui/react";
import { ChevronDownIcon, Music } from "lucide-react";
import { useGlobalStore } from "../store/store";
import config from "../config";

function LoginModal() {
  return (
    <Modal isCentered isOpen={true} onClose={() => null}>
      <ModalOverlay
        bg="blackAlpha.300"
        backdropFilter="blur(6px) hue-rotate(90deg)"
      />
      <ModalContent margin={4}>
        <ModalBody>
          <Box textAlign="center" py={4}>
            <Text fontSize="2xl" fontWeight={600} mb={2}>
              Not so fast!
            </Text>
            <Text size="lg" mb={4}>
              Login with google to get started
            </Text>
            <ChakraLink href={`${config.SERVER_BASE_URL}/login/google`}>
              <Button colorScheme="purple">Login with google</Button>
            </ChakraLink>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

const AppLayout = () => {
  const user = useGlobalStore((state) => state.user);
  return (
    <Box display="flex" overflow="hidden" flexDirection="column" height="100vh">
      <Box
        as="header"
        px={{ base: 4, lg: 6 }}
        h="14"
        top={0}
        display="flex"
        alignItems="center"
        borderBottom="1px"
        borderColor="purple.200"
        zIndex={10}
        backdropBlur="md"
      >
        <ChakraLink as={Link} to="/home" display="flex" alignItems="center">
          <Music className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <Text ml={2} fontSize="lg" fontWeight="bold" color="purple.800">
            Playlist Converter
          </Text>
        </ChakraLink>
        <Flex ml="auto" alignItems="center" gap={{ base: 4, sm: 6 }}>
          <ChakraLink
            as={Link}
            to="/convert-playlist/4"
            fontSize="sm"
            fontWeight="medium"
            color="purple.600"
            _hover={{ color: "purple.800" }}
            _dark={{ color: "purple.300", _hover: { color: "purple.100" } }}
          >
            Convert playlist
          </ChakraLink>
          <Box display="flex" position="relative">
            <Menu>
              <MenuButton
                as={Button}
                borderRadius={"full"}
                rightIcon={<ChevronDownIcon size={18} />}
                _hover={{
                  bg: "none",
                }}
              >
                {user && (
                  <Image
                    src={user.picture}
                    alt={user.name}
                    rounded="full"
                    height={"34px"}
                    width={"34px"}
                  />
                )}
              </MenuButton>
              <MenuList maxWidth="140px">
                <MenuItem>Logout</MenuItem>
              </MenuList>
            </Menu>
          </Box>
        </Flex>
      </Box>
      <Box flex={1} overflow="auto" pt={8} pb={8}>
        {user ? (
          <Container>
            <Outlet />
          </Container>
        ) : (
          <LoginModal />
        )}
      </Box>
    </Box>
  );
};

export default AppLayout;
