import api from "@/api/api";
import { useSessionContext } from "@/contexts/session";
import {
  Box,
  Text,
  Menu,
  MenuItem,
  MenuList,
  Icon,
  Avatar,
  MenuButton,
} from "@chakra-ui/react";
import { User, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import BackdropLoader from "./backdrop-loader";
import { useState } from "react";

export default function UserMenu() {
  const { session } = useSessionContext();
  const [logoutLoading, setLogoutLoading] = useState(false);

  return !session ? (
    <Box
      w={12}
      h={12}
      borderRadius={"full"}
      border="2px solid"
      borderColor="whiteAlpha.200"
      color="white"
      bg="whiteAlpha.500"
      fontWeight="semibold"
      animation="pulse 2s infinite"
    />
  ) : (
    <>
      {logoutLoading && <BackdropLoader loadingText="Logging out" />}
      <Menu>
        <Box
          as={MenuButton}
          cursor="pointer"
          shadow={"xl"}
          border="1px solid"
          rounded="full"
          borderColor="rgba(255, 255, 255, .13)"
          _hover={{
            transition: "transform .25s ease",
            transform: "scale(0.96)",
          }}
          _active={{
            transform: "scale(0.96)",
          }}
          transition="all 0.2s"
          bg="brand.card2"
        >
          <Avatar
            className="avatar"
            w={8}
            h={8}
            fontSize="sm"
            border="none"
            bg="border.subtle"
            name={session.name}
            src={session.picture}
            color="white"
            fontWeight="semibold"
            sx={{
              ".chakra-avatar__initials": {
                fontSize: "14px",
              },
            }}
          />
        </Box>
        <MenuList
          bg="blackAlpha.200"
          backdropFilter="blur(16px)"
          borderColor="whiteAlpha.200"
          color="white"
          w="56"
        >
          <Box p={2}>
            <Box display="flex" alignItems="center" gap={2}>
              {/* <Avatar
                size="sm"
                name={session.name}
                src={session.picture}
                bg="linear-gradient(to right, #9f7aea, #ec4899)"
                color="white"
                fontSize="xs"
              /> */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="white">
                  {session.name}
                </Text>
                <Text fontSize="xs" color="whiteAlpha.600">
                  {session.email}
                </Text>
              </Box>
            </Box>
          </Box>

          <Box h="1px" bg="whiteAlpha.200" />

          <MenuItem
            as={Link}
            to="/home"
            bg="unset"
            fontSize="sm"
            _hover={{ bg: "whiteAlpha.100" }}
            _focus={{ bg: "whiteAlpha.100" }}
            display="flex"
            alignItems="center"
          >
            <Icon as={User} w={4} h={4} mr={2} />
            Home
          </MenuItem>

          <Box h="1px" bg="whiteAlpha.200" />

          <MenuItem
            as={Link}
            to="/settings"
            bg="unset"
            fontSize="sm"
            _hover={{ bg: "whiteAlpha.100" }}
            _focus={{ bg: "whiteAlpha.100" }}
            display="flex"
            alignItems="center"
          >
            <Icon as={Settings} w={4} h={4} mr={2} />
            Settings
          </MenuItem>

          <Box h="1px" bg="whiteAlpha.200" />

          <MenuItem
            fontSize="sm"
            onClick={() => {
              setLogoutLoading(true);
              api
                .logout()
                .then(() => {
                  localStorage.removeItem("userId");
                  window.location.assign("/");
                })
                .catch(() => {
                  setLogoutLoading(false);
                });
            }}
            bg="unset"
            _hover={{
              bg: "whiteAlpha.100",
              color: "red.300",
            }}
            _focus={{
              bg: "whiteAlpha.100",
              color: "red.300",
            }}
            color="red.400"
            display="flex"
            alignItems="center"
          >
            <Icon as={LogOut} w={4} h={4} mr={2} />
            Logout
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  );
}
