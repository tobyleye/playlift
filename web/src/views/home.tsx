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
import { useState } from "react";
import { Rabbit } from "lucide-react";
import { Link } from "react-router-dom";
import Nav from "@/components/nav";
import dayjs from "dayjs";
import { PlaylistConversion } from "@/types";
import { getServiceColor, getServiceLabel } from "@/constants/constants";
import { useSessionContext } from "@/contexts/session";
import EllipsisLoader from "@/components/ellipsis-loader";
import { useNavigate } from "react-router-dom";
import { PrimaryButton } from "@/components/buttons";
import DefaultErrorState from "@/components/errors/default-error-state";

export default function Home() {
  const { session } = useSessionContext();

  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    isLoading: isLoadingConversions,
    data,
    error,
    mutate,
  } = useSWR<PlaylistConversion[]>(
    session?.user_id ? "/conversions" : null,
    async () => {
      return api.fetchConversions();
    }
  );

  const conversions = data || [];

  const pendingConversions = conversions.filter(
    (conversion) => conversion.status === "pending"
  );
  const completedConversions = conversions.filter(
    (conversion) => conversion.status === "completed"
  );

  // @ts-ignore: leave this for now
  const deleteConversion = async (conversionId: string) => {
    try {
      setIsLoading(true);
      await api.deleteConversion(conversionId);
      mutate(data!.filter((conv: any) => conv.id !== conversionId));
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
        data!.filter((conv: any) =>
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
    <Box pb={8}>
      <Nav />

      <Container maxWidth="container.lg" mt={8}>
        <Box display="flex" gap={4} flexWrap="wrap" alignItems="center" mb={8}>
          <Box>
            <Heading mb={1}>Your migrations</Heading>
            <Text color="whiteAlpha.700">
              Manage and track your playlist migrations
            </Text>
          </Box>
        </Box>

        {isLoadingConversions ? (
          <Box py={"20vh"} textAlign="center">
            <EllipsisLoader
              fontSize="xl"
              color="whiteAlpha.800"
              text="Loading"
            />
          </Box>
        ) : error ? (
          <Box>
            <DefaultErrorState
              title="Error Loading migrations"
              description="We're having trouble loading your migrations. Please try again."
            />
          </Box>
        ) : data ? (
          <Box>
            {conversions.length === 0 ? (
              <EmptyState />
            ) : (
              <Box>
                <SimpleGrid
                  columns={{ base: 1, md: 2 }}
                  gap={{ base: 4, md: 6 }}
                  mb={12}
                >
                  {[
                    {
                      title: "Pending",
                      count: pendingConversions.length,
                      icon: (
                        <Icon color="yellow.500">
                          <Clock />
                        </Icon>
                      ),
                    },
                    {
                      title: "Completed",
                      count: completedConversions.length,
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

                {pendingConversions.length > 0 && (
                  <Box>
                    <Heading mb={4} fontSize="xl" color="whiteAlpha.800">
                      Pending Migrations
                    </Heading>
                    <SimpleGrid
                      columns={{ base: 1, md: 2, lg: 3 }}
                      gap={6}
                      pointerEvents={isLoading ? "none" : "auto"}
                      opacity={isLoading ? 0.5 : 1}
                    >
                      {pendingConversions.map((conversion) => {
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

                {completedConversions.length > 0 && (
                  <Box mt={12}>
                    <Heading mb={4} fontSize="xl" color="whiteAlpha.800">
                      Completed Migrations
                    </Heading>
                    <SimpleGrid
                      columns={{ base: 1, md: 2, lg: 3 }}
                      gap={6}
                      pointerEvents={isLoading ? "none" : "auto"}
                      opacity={isLoading ? 0.5 : 1}
                    >
                      {completedConversions.map((conversion) => {
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
              </Box>
            )}
          </Box>
        ) : null}
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
        <Text fontSize="xl" color="whiteAlpha.600" mb={4}>
          You don't have any migrations!
        </Text>

        <Link to="/convert/select-playlists">
          <PrimaryButton>Create one</PrimaryButton>
        </Link>
      </Box>
    </Box>
  );
};

const ConversionCard = ({ conversion }: { conversion: PlaylistConversion }) => {
  const navigate = useNavigate();

  return (
    <Box
      onClick={() => navigate(`/details/${conversion.conversion_id}`)}
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
            <Icon color="yellow.500" as={Clock}></Icon>
          ) : conversion.status === "failed" ? (
            <Icon color="red.500" as={AlertCircle}></Icon>
          ) : conversion.status === "completed" ? (
            <Icon color="green.500" as={Check}></Icon>
          ) : null}
        </Box>
      </Box>

      <Box display="flex" alignItems="center" justifyContent="center" mb={5}>
        <Box
          w={3}
          h={3}
          mr={2}
          rounded="full"
          bg={getServiceColor(conversion.source_platform)}
        />
        <Text>{getServiceLabel(conversion.source_platform)}</Text>
        <Icon color="whiteAlpha.700" mx={4} as={ArrowRight} />

        <Box
          mr={2}
          w={3}
          h={3}
          rounded="full"
          bg={getServiceColor(conversion.destination_platform)}
        />
        <Text>{getServiceLabel(conversion.destination_platform)}</Text>
      </Box>

      <Box display="grid" gap={4} fontSize="sm">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Text color="whiteAlpha.700" fontSize="sm">
            Tracks
          </Text>
          <Text>
            {conversion.total_tracks > -1 ? conversion.total_tracks : `∞`}
          </Text>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Text color="whiteAlpha.700" fontSize="sm">
            Status
          </Text>
          <Text
            textTransform="capitalize"
            color={
              conversion.status === "completed"
                ? "green.400"
                : conversion.status === "pending"
                ? "yellow.400"
                : "red.400"
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
