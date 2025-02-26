/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Heading,
  Box,
  Link as ChakraLink,
  Text,
  Flex,
  Icon,
  useToast,
  Button,
  Modal,
  ModalContent,
  ModalBody,
  ModalOverlay,
} from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useSWR from "swr";
import api from "../api/api";
import { MoveRightIcon, Trash2Icon, RotateCw, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import config from "../config";
import { useGlobalStore } from "../store/store";

const formatPlatform = (platform: string) => {
  return platform.replace("_", " ");
};

function LoginModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal isCentered isOpen={true} onClose={onClose}>
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

export default function Home() {
  const user = useGlobalStore((store) => store.user);

  const fetchResult = useSWR<any>(user ? "/conversions" : null, async () => {
    return api.fetchConversions();
  });

  const { isLoading: isLoadingConversions, mutate, error } = fetchResult;

  let { data: conversions } = fetchResult;

  conversions = conversions || [];

  const toast = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const loginError = searchParams.get("loginError");
    if (loginError) {
      searchParams.delete("loginError");
      toast({
        title: "Error logging in",
        description: loginError,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      setSearchParams(searchParams);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteConversion = async (conversionId: string) => {
    try {
      setIsLoading(true);
      await api.deleteConversion(conversionId);
      mutate(conversions.filter((conv: any) => conv.id !== conversionId));
    } catch {
      toast({
        title: "Error restarting conversion",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const restartConversion = async (conversionId: string) => {
    try {
      setIsLoading(true);
      await api.restartConversion(conversionId);
      mutate(
        conversions.filter((conv: any) =>
          conv.id == conversionId ? { ...conv, status: "pending" } : conv
        )
      );
    } catch {
      toast({
        title: "Error deleting conversion",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      {!user && <LoginModal onClose={() => {}} />}

      <Heading size="lg" color="gray.700" mb={8}>
        Your conversions
      </Heading>

      {isLoadingConversions ? (
        <Box>Loading...</Box>
      ) : error ? (
        <div>error..</div>
      ) : conversions.length === 0 ? (
        <Box>
          <Text>You don't have any conversions</Text>
        </Box>
      ) : (
        <Flex
          direction="column"
          gap={4}
          pointerEvents={isLoading ? "none" : "auto"}
          opacity={isLoading ? 0.5 : 1}
        >
          {conversions.map((conversion: any) => {
            return (
              <ChakraLink
                onClick={() => {
                  navigate("/conversion/" + conversion.id);
                }}
                key={conversion.id}
                textDecoration="none"
                _hover={{
                  textDecor: "none",
                  color: "current",
                }}
              >
                <Box bg="white" rounded="sm" px={4} py={3}>
                  <Flex align="center" w="full">
                    <Heading size="lg" mb={2}>
                      {conversion.title}
                    </Heading>
                    <Box ml="auto" display="flex" gap={2} alignItems="center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          restartConversion(conversion.id);
                        }}
                      >
                        <Icon color="blue.400" as={RotateCw} />
                      </button>
                      <button
                        style={{ padding: 5 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversion(conversion.id);
                        }}
                      >
                        <Icon color="red.500" as={Trash2Icon} />
                      </button>
                    </Box>
                  </Flex>
                  <Text mb={2} textTransform="capitalize">
                    {conversion.status}
                  </Text>

                  <Box display="flex" alignItems="center" mb={2}>
                    <Box
                      py={1}
                      px={2}
                      fontSize="sm"
                      rounded="full"
                      bg="gray.200"
                      textTransform="capitalize"
                    >
                      {formatPlatform(conversion.source_platform)}
                    </Box>
                    <Icon as={MoveRightIcon} mx={1} />

                    <Box
                      py={1}
                      px={2}
                      fontSize="sm"
                      rounded="full"
                      bg="gray.200"
                      textTransform="capitalize"
                    >
                      {formatPlatform(conversion.destination_platform)}
                    </Box>
                  </Box>

                  <Box>
                    <Box
                      display="inline-flex"
                      alignItems="center"
                      gap={1}
                      color="red.500"
                      bg="red.100"
                      rounded="full"
                      px={3}
                      py={1}
                    >
                      <AlertCircle size={14} />
                      <Text fontSize="sm" as="span">
                        Requires action
                      </Text>
                    </Box>
                  </Box>
                </Box>
              </ChakraLink>
            );
          })}
        </Flex>
      )}
    </Box>
  );
}
