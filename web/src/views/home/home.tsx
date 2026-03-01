/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Heading,
  Box,
  Text,
  Icon,
  useToast,
  Container,
  SimpleGrid,
  Link as StyledLink,
} from "@chakra-ui/react";

import useSWR from "swr";
import api from "../../api/api";
import { Clock, Check, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Rabbit } from "lucide-react";
import { Link } from "react-router-dom";
import Nav from "@/components/nav";
import { PlaylistConversion } from "@/types";
import EllipsisLoader from "@/components/ellipsis-loader";
import { PrimaryButton } from "@/components/buttons";
import DefaultErrorState from "@/components/errors/default-error-state";
import ConversionCard from "@/components/conversion-card/conversion-card";

export default function Home() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    isLoading: isLoadingConversions,
    data,
    error,
    mutate,
  } = useSWR<PlaylistConversion[]>("/conversions", async () => {
    return api.fetchConversions();
  });

  const conversions = data || [];

  const pendingConversions = [];
  const completedConversions = [];

  for (const conversion of conversions) {
    if (conversion.status === "pending") {
      pendingConversions.push(conversion);
    } else {
      completedConversions.push(conversion);
    }
  }

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
          conv.id == conversionId ? { ...conv, status: "pending" } : conv,
        ),
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

      <Box position="fixed" left={0} right={0} bottom={0} py={6}>
        <Container maxW="68rem" display="flex" justifyContent="end">
          <StyledLink
            borderRadius="full"
            bgGradient="linear(to-r, pink.500, purple.500)"
            color="white"
            w={14}
            h={14}
            display="grid"
            placeItems="center"
            boxShadow="2xl"
            fontSize={"2xl"}
            as={Link}
            to="/convert/select-playlists"
          >
            <Icon as={PlusIcon} w={8} h={8} />
          </StyledLink>
        </Container>
      </Box>
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
                  <Box mb={10}>
                    <Heading mb={4} size={"md"}>
                      Pending migrations
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
                  <Box>
                    <Heading mb={4} size={"md"}>
                      Past migrations
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
