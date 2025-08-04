import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, User, AlertTriangle, Trash2 } from "lucide-react";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Avatar,
  HStack,
  VStack,
  Divider,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Icon,
  Container,
  Input,
  FormControl,
  FormLabel,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalOverlay,
  useToast,
  Link as StyledLink,
} from "@chakra-ui/react";
import Nav from "@/components/nav";
import { useSessionContext } from "@/contexts/session";
import api from "@/api/api";
import { toastHelper } from "@/components/utils/toast";

export default function Settings() {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const [nameConfirmation, setNameConfirmation] = useState("");
  const { session } = useSessionContext();
  const [deactivated, setDeactivated] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(10);

  const toast = useToast();

  useEffect(() => {
    if (deactivated && redirectCountdown > 0) {
      const countdown = setTimeout(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(countdown);
    }
  }, [redirectCountdown, deactivated]);

  useEffect(() => {
    if (redirectCountdown <= 0) {
      localStorage.removeItem("userId");
      location.assign("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectCountdown]);

  const handleDeactivateAccount = async () => {
    onClose();
    setIsDeactivating(true);
    try {
      await api.deactivateAccount();
      setDeactivated(true);
    } catch (error) {
      toastHelper(toast, {
        title: "Error",
        description: "Failed to deactivate account. Please try again later.",
        status: "error",
      });
      console.error("Error deactivating account:", error);
    } finally {
      setIsDeactivating(false);
    }
  };

  const acceptedName = session?.name.split(" ")[0] || "";

  return (
    <Box
      minH="100vh"
      bg="linear-gradient(135deg, purple.900 0%, blue.900 50%, indigo.900 100%)"
    >
      <Nav />
      <Container maxW="container.lg" py={8}>
        {/* Header */}
        <VStack align="stretch" maxW="2xl" spacing={8}>
          <Box>
            <StyledLink
              display="inline-flex"
              alignItems="center"
              gap={2}
              as={Link}
              to="/home"
              color="whiteAlpha.700"
              _hover={{
                textDecoration: "none",
                color: "white",
              }}
              mb={4}
            >
              <Icon as={ArrowLeft} />
              Back to dashboard
            </StyledLink>

            <Heading size="xl" color="white" mb={2}>
              Settings
            </Heading>
            <Text color="whiteAlpha.700">
              Manage your account preferences and data
            </Text>
          </Box>

          <Box>
            <VStack spacing={8} align="stretch">
              {/* User Information */}
              <Card
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.200"
                backdropFilter="blur(10px)"
              >
                <CardBody>
                  <Box as="header" mb={7}>
                    <HStack>
                      <Icon as={User} color="white" />
                      <Heading size="md" color="white">
                        Account Information
                      </Heading>
                    </HStack>
                    <Text color="whiteAlpha.700" fontSize="sm">
                      Your account details
                    </Text>
                  </Box>
                  <HStack spacing={4}>
                    <Avatar
                      size="md"
                      src={session?.picture}
                      name={session?.name}
                      bg="purple.500"
                    />
                    <VStack align="start" spacing={1}>
                      <Heading fontSize="md" color="white">
                        {session?.name}
                      </Heading>
                      <Text color="whiteAlpha.700">{session?.email}</Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>

              {/* Danger Zone */}
              <Card
                bg="rgba(99,23,27, .3)"
                borderColor="rgba(229,62,62, .3)"
                backdropFilter="blur(10px)"
              >
                <CardHeader pb={2}>
                  <HStack mb={2}>
                    <Icon as={AlertTriangle} color="red.400" />
                    <Heading size="md" color="red.400">
                      Danger Zone
                    </Heading>
                  </HStack>
                  <Text color="red.300" opacity={0.7} fontSize="sm">
                    Irreversible actions that will permanently affect your
                    account
                  </Text>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Divider borderColor="red.500" opacity={0.2} />

                    <VStack spacing={3} align="stretch">
                      <Box mb={2}>
                        <Heading size="sm" color="white" mb={2}>
                          Deactivate Account
                        </Heading>
                        <Text color="whiteAlpha.700" fontSize="sm">
                          Permanently delete your account and all associated
                          data. This will remove all your migrations, revoke
                          access tokens from connected services (Spotify,
                          YouTube Music), and cannot be undone.
                        </Text>
                      </Box>

                      <Button
                        colorScheme="red"
                        leftIcon={<Icon as={Trash2} />}
                        onClick={onOpen}
                        isLoading={isDeactivating}
                        loadingText="Deactivating..."
                        size="sm"
                        alignSelf="flex-start"
                      >
                        Deactivate Account
                      </Button>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </Box>
        </VStack>

        {/* Alert Dialog */}
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
          onCloseComplete={() => setNameConfirmation("")}
          size="lg"
        >
          <AlertDialogOverlay bg="blackAlpha.800">
            <AlertDialogContent bg="gray.900" borderColor="red.500">
              <AlertDialogBody>
                <AlertDialogHeader
                  fontSize="lg"
                  fontWeight="bold"
                  color="red.400"
                  px={0}
                  pb={2}
                >
                  Are you absolutely sure?
                </AlertDialogHeader>
                <Text color="whiteAlpha.700" fontSize="md" mb={6}>
                  This action cannot be undone.
                </Text>

                <FormControl>
                  <FormLabel>
                    Type your name "{acceptedName}" to confirm:
                  </FormLabel>
                  <Input
                    value={nameConfirmation}
                    onChange={(e) => setNameConfirmation(e.target.value)}
                  />
                </FormControl>
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button
                  ref={cancelRef}
                  onClick={onClose}
                  bg="gray.700"
                  color="white"
                  _hover={{ bg: "gray.600" }}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleDeactivateAccount}
                  ml={3}
                  isLoading={isDeactivating}
                  disabled={acceptedName !== nameConfirmation}
                  size="sm"
                >
                  Yes, deactivate my account
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
        {/* Success dialog */}
        <Modal isOpen={deactivated} onClose={() => {}} size="lg">
          <ModalOverlay bg="blackAlpha.800" />
          <ModalContent
            bg="gray.900"
            border="1px solid"
            borderColor="green.300"
          >
            <ModalHeader color="green.400" pb={0}>
              Account Successfully Deleted
            </ModalHeader>

            <ModalBody color="whiteAlpha.700" pb={8}>
              <Text mb={4} fontSize="sm">
                Your account has been permanently deleted. All your data, access
                tokens, and migration history have been removed from our
                systems.
              </Text>
              <Text textAlign="center" fontWeight="medium">
                Redirecting to homepage in{" "}
                <Box as="span" color="green.400" fontWeight="bold">
                  {redirectCountdown}
                </Box>{" "}
                seconds...
              </Text>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
}
