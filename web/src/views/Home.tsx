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
  Container,
  SimpleGrid,
} from "@chakra-ui/react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import useSWR from "swr";
import api from "../api/api";
import {
  MoveRightIcon,
  Trash2Icon,
  RotateCw,
  AlertCircle,
  Clock,
  Check,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import config from "../config";
import { useGlobalStore } from "../store/store";
import { Rabbit } from "lucide-react";
import Nav from "@/components/nav";
import dayjs from "dayjs";
import { Platform, PlaylistConversion } from "@/types";
import { streamingServicesMap } from "@/constants/constants";

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
    <Box
      minH="100vh"
      color="white"
      bg="linear-gradient(to right bottom, rgb(88, 28, 135), rgb(30, 58, 138), rgb(49, 46, 129))"
      pb={8}
    >
      <Nav
        rightElement={
          <Box>
            <Button as={Link} to="/convert">
              New Migration
            </Button>
          </Box>
        }
      />

      {/* {!user && <LoginModal onClose={() => {}} />} */}

      <Container maxWidth="container.lg" mt={8}>
        <Heading mb={1}>Your migration</Heading>
        <Text mb={8} color="whiteAlpha.700">
          Manage and track your playlist migrations
        </Text>

        <SimpleGrid
          columns={{ base: 1, md: 2 }}
          gap={{ base: 4, md: 6 }}
          mb={12}
        >
          {[
            {
              title: "Pending",
              count: 0,
              icon: (
                <Icon color="yellow.500">
                  <Clock />
                </Icon>
              ),
            },
            {
              title: "Completed",
              count: 0,
              icon: (
                <Icon color="green.500">
                  <Check />
                </Icon>
              ),
            },
          ].map((each, idx) => {
            return (
              <Box
                key={`stats-card-${idx}`}
                display="flex"
                alignItems="center"
                py={6}
                px={6}
                border="1px solid"
                borderColor="whiteAlpha.300"
                rounded="md"
                bg="whiteAlpha.200"
              >
                <Box>
                  <Text fontWeight="semibold" color="whiteAlpha.500">
                    {each.title}
                  </Text>
                  <Text color="white" fontSize="2xl">
                    {each.count}
                  </Text>
                </Box>

                <Box ml="auto">
                  <Icon w={8} h={8}>
                    {each.icon}
                  </Icon>
                </Box>
              </Box>
            );
          })}
        </SimpleGrid>

        {isLoadingConversions ? (
          <Box>Loading...</Box>
        ) : error ? (
          <div>error..</div>
        ) : conversions.length === 0 ? (
          <EmptyState />
        ) : (
          <Box>
            <Heading mb={4} fontSize="2xl">
              All Migrations
            </Heading>
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              gap={6}
              pointerEvents={isLoading ? "none" : "auto"}
              opacity={isLoading ? 0.5 : 1}
            >
              {conversions.map((conversion: any, index: number) => {
                return (
                  <ConversionCard
                    index={index + 1}
                    key={index}
                    conversion={conversion}
                  />
                );
              })}
            </SimpleGrid>
          </Box>
        )}
      </Container>
    </Box>
  );
}

const EmptyState = () => {
  return (
    <Box>
      <Box
        paddingY={20}
        display="flex"
        flexDir={"column"}
        alignItems="center"
        justifyContent="center"
      >
        <Box mb={2}>
          <Icon
            as={Rabbit}
            color="whiteAlpha.800"
            width={"100px"}
            height={"100px"}
          />
        </Box>
        <Text fontSize="xl" color="whiteAlpha.400" mb={2}>
          You don't have any conversions!
        </Text>
      </Box>
    </Box>
  );
};

const ConversionCard = ({
  index,
  conversion,
}: {
  index: number;
  conversion: PlaylistConversion;
}) => {
  const getPlaylistColor = (platform: Platform) => {
    if (platform === "youtube_music") {
      return "youtube-red";
    } else if (platform === "spotify") {
      return "spotify-green";
    }
    return;
  };

  return (
    <Box
      bg="whiteAlpha.100"
      border="1px solid"
      borderColor="whiteAlpha.200"
      rounded="md"
      px={4}
      py={3}
      cursor="pointer"
    >
      <Box display="flex" alignItems="center" mb={4}>
        <Text fontWeight="bold" fontSize="medium">
          {conversion.playlist_title || `Playlist ${index}`}
        </Text>
        <Box ml="auto">
          {conversion.status === "pending" ? (
            <Icon color="yellow.500">
              <Clock />
            </Icon>
          ) : conversion.status === "failed" ? (
            <Icon color="red.500">
              <AlertCircle />
            </Icon>
          ) : conversion.status === "completed" ? (
            <Icon>
              <Check />
            </Icon>
          ) : null}
        </Box>
      </Box>

      <Box display="flex" alignItems="center" justifyContent="center" mb={5}>
        <Box
          w={2}
          h={2}
          mr={1}
          rounded="full"
          bg={getPlaylistColor(conversion.source_platform)}
        />
        <Text>{streamingServicesMap[conversion.source_platform]}</Text>
        <Icon mx={4}>
          <ArrowRight />
        </Icon>
        <Box
          mr={1}
          w={2}
          h={2}
          rounded="full"
          bg={getPlaylistColor(conversion.destination_platform)}
        />
        <Text>{streamingServicesMap[conversion.destination_platform]}</Text>
      </Box>

      <Box display="grid" gap={4} fontSize="sm">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Text color="whiteAlpha.700" fontSize="sm">
            Tracks
          </Text>
          <Text>156</Text>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Text color="whiteAlpha.700" fontSize="sm">
            Status
          </Text>
          <Text
            color={
              conversion.status === "completed"
                ? "green.500"
                : conversion.status === "pending"
                ? "yellow.500"
                : "red.500"
            }
            fontWeight="semibold"
          >
            {conversion.status}
          </Text>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Text color="whiteAlpha.700" fontSize="sm">
            Created
          </Text>
          <Text color="whiteAlpha.700">{dayjs().format("MMM DD, YYYY")}</Text>
        </Box>
      </Box>
    </Box>
  );
  // return (
  //   <Box bg="white" rounded="sm" px={4} py={3}>
  //     <Flex align="center" w="full">
  //       <Heading size="lg" mb={2}>
  //         {conversion.title}
  //       </Heading>
  //       <Box ml="auto" display="flex" gap={2} alignItems="center">
  //         <button
  //           onClick={(e) => {
  //             e.stopPropagation();
  //             // restartConversion(conversion.id);
  //           }}
  //         >
  //           <Icon color="blue.400" as={RotateCw} />
  //         </button>
  //         <button
  //           style={{ padding: 5 }}
  //           onClick={(e) => {
  //             e.stopPropagation();
  //             // deleteConversion(conversion.id);
  //           }}
  //         >
  //           <Icon color="red.500" as={Trash2Icon} />
  //         </button>
  //       </Box>
  //     </Flex>
  //     <Text mb={2} textTransform="capitalize">
  //       {conversion.status}
  //     </Text>

  //     <Box display="flex" alignItems="center" mb={2}>
  //       <Box
  //         py={1}
  //         px={2}
  //         fontSize="sm"
  //         rounded="full"
  //         bg="gray.200"
  //         textTransform="capitalize"
  //       >
  //         {formatPlatform(conversion.source_platform)}
  //       </Box>
  //       <Icon as={MoveRightIcon} mx={1} />

  //       <Box
  //         py={1}
  //         px={2}
  //         fontSize="sm"
  //         rounded="full"
  //         bg="gray.200"
  //         textTransform="capitalize"
  //       >
  //         {formatPlatform(conversion.destination_platform)}
  //       </Box>
  //     </Box>

  //     <Box>
  //       <Box
  //         display="inline-flex"
  //         alignItems="center"
  //         gap={1}
  //         color="red.500"
  //         bg="red.100"
  //         rounded="full"
  //         px={3}
  //         py={1}
  //       >
  //         <AlertCircle size={14} />
  //         <Text fontSize="sm" as="span">
  //           Requires action
  //         </Text>
  //       </Box>
  //     </Box>
  //   </Box>
  // );
};
