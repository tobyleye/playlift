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
import { User, LogOut, ArrowLeftRight, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import BackdropLoader from "./backdrop-loader";
import { useState } from "react";

export default function UserMenu() {
  const { session } = useSessionContext();
  const [logoutLoading, setLogoutLoading] = useState(false);

  return !session ? (
    <Box
      w={10}
      h={10}
      borderRadius={"full"}
      border="2px solid"
      borderColor="whiteAlpha.200"
      bg="linear-gradient(to right, #9f7aea, #ec4899)"
      color="white"
      fontWeight="semibold"
    />
  ) : (
    <>
      {logoutLoading && <BackdropLoader loadingText="Logging out" />}
      <Menu>
        <MenuButton
          as={Box}
          cursor="pointer"
          _hover={{
            ".avatar-border": {
              borderColor: "whiteAlpha.400",
            },
          }}
          transition="all 0.2s"
        >
          <Avatar
            className="avatar-border"
            size={{ base: "sm", md: "md" }}
            name={session.name}
            src={session.picture}
            border="2px solid"
            borderColor="whiteAlpha.200"
            bg="linear-gradient(to right, #9f7aea, #ec4899)"
            color="white"
            fontWeight="semibold"
          />
        </MenuButton>
        <MenuList
          bg="blackAlpha.200"
          backdropFilter="blur(16px)"
          borderColor="whiteAlpha.200"
          color="white"
          w="56"
        >
          <Box p={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                size="sm"
                name={session.name}
                src={session.picture}
                bg="linear-gradient(to right, #9f7aea, #ec4899)"
                color="white"
                fontSize="xs"
              />
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
            to="/convert/select-playlists"
            bg="unset"
            _hover={{ bg: "whiteAlpha.100" }}
            _focus={{ bg: "whiteAlpha.100" }}
            display="flex"
            alignItems="center"
          >
            <Icon as={ArrowLeftRight} w={4} h={4} mr={2} />
            New migration
          </MenuItem>

          <Box h="1px" bg="whiteAlpha.200" />

          <MenuItem
            as={Link}
            to="/settings"
            bg="unset"
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
