/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Heading,
  Box,
  Text,
  Icon,
  useToast,
  Container,
  SimpleGrid,
} from "@chakra-ui/react";
import useSWR from "swr";
import api from "../api/api";
import { AlertCircle, Clock, Check, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Rabbit } from "lucide-react";
import Nav from "@/components/nav";
import dayjs from "dayjs";
import { Platform, PlaylistConversion } from "@/types";
import { streamingServicesMap } from "@/constants/constants";
import UserMenu from "@/components/user-menu";
import { useSessionContext } from "@/contexts/session";
import LoginModal from "@/components/login-modal";

export default function Home() {
  const { session, loadingSession } = useSessionContext();

  // create local copy of session
  // const [localSession, setLocalSession] = useState<UserSession | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!loadingSession && !session) {
      setShowLogin(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingSession]);

  const fetchResult = useSWR<PlaylistConversion[]>(
    session?.user_id ? "/conversions" : null,
    async () => {
      return api.fetchConversions();
    }
  );

  const { isLoading: isLoadingConversions, mutate, error } = fetchResult;

  const { data: conversions = [] } = fetchResult;

  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // @ts-ignore: leave this for now
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

  // @ts-ignore: leave this for now
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
      <Nav rightElement={<UserMenu />} />

      <LoginModal
        open={showLogin}
        onLogin={() => {
          setShowLogin(false);
        }}
        onClose={() => {}}
      />

      <Container maxWidth="container.lg" mt={8}>
        <Box display="flex" gap={4} flexWrap="wrap" alignItems="center" mb={8}>
          <Box>
            <Heading mb={1}>Your migration</Heading>
            <Text color="whiteAlpha.700">
              Manage and track your playlist migrations
            </Text>
          </Box>
        </Box>

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
              {conversions.map((conversion) => {
                return (
                  <ConversionCard
                    key={conversion.conversion_id}
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

const ConversionCard = ({ conversion }: { conversion: PlaylistConversion }) => {
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
          {conversion.playlist_title}
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
          <Text>{conversion.total_tracks}</Text>
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
};
