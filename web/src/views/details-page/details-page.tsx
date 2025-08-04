import api from "@/api/api";
import EllipsisLoader from "@/components/ellipsis-loader";
import DefaultErrorState from "@/components/errors/default-error-state";
import Nav from "@/components/nav";
import { getServiceColor, getServiceLabel } from "@/constants/constants";
import {
  Heading,
  Text,
  Box,
  Container,
  Link as StyledLink,
  Icon,
  Select,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckIcon,
  CircleAlert,
  ExternalLinkIcon,
  Loader,
  MusicIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useSWR from "swr";

type ConversionDetails = {
  conversion_id: string;
  playlist_title: string;
  total_tracks: number;
  source_platform: string;
  destination_platform: string;
  status: string;
  playlist_link: string;
  result: null | Record<
    string,
    {
      data: string;
      error: string;
    }
  >;
  playlist_tracks: {
    track_id: string;
    artists: string[];
    title: string;
    album: string;
  }[];

  created_playlist_link: string;
};

const StatusBadge = ({ status }: { status: string }) => {
  const getIcon = () => {
    return (
      {
        completed: CheckIcon,
        pending: Loader,
        failed: CircleAlert,
      }[status] || null
    );
  };

  const icon = getIcon();
  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1}
      color={
        status === "completed"
          ? "green.400"
          : status === "pending"
          ? "yellow.400"
          : "red.400"
      }
      textTransform="capitalize"
    >
      {icon && <Icon as={icon} w={4} h={4} />}

      {status}
    </Box>
  );
};

export default function DetailsPage() {
  const { id } = useParams();

  const { data, error, isLoading } = useSWR<ConversionDetails>(
    ["details", id],
    () => api.fetchSingleConversion(id!),
    {
      shouldRetryOnError: false,
    }
  );

  const [trackFilter, settrackFilter] = useState<string>("all");

  const { completedCount, failedCount, successRate, overallProgress } =
    useMemo(() => {
      let completedCount = 0;
      let failedCount = 0;

      let successRate = 0;
      let overallProgress = 0;
      if (data && data.result) {
        let totalProcessed = 0;
        for (const track of data.playlist_tracks) {
          const trackId = track.track_id;
          const trackResult = data.result[trackId];
          if (trackResult && trackResult.data) {
            completedCount++;
          } else if (trackResult && trackResult.error) {
            failedCount++;
          }

          if (trackResult) {
            totalProcessed++;
          }
        }

        successRate = Math.round(
          (completedCount / data.playlist_tracks.length) * 100
        );

        overallProgress = Math.round(
          (totalProcessed / data.playlist_tracks.length) * 100
        );
      }

      return {
        completedCount,
        failedCount,
        successRate,
        overallProgress,
      };
    }, [data]);

  const getFilteredTracks = () => {
    if (!data) return [];
    if (!data.result) return data.playlist_tracks;

    if (trackFilter === "completed") {
      return data.playlist_tracks.filter(
        (track) => data.result![track.track_id]?.data
      );
    } else if (trackFilter === "failed") {
      return data.playlist_tracks.filter(
        (track) => data.result![track.track_id]?.error
      );
    }

    return data.playlist_tracks;
  };
  return (
    <Box pb={10}>
      <Nav />
      <Container maxW="container.md" mt={6}>
        {!!(data || error) && (
          <Box mb={6}>
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
            >
              <Icon as={ArrowLeft} />
              Back to dashboard
            </StyledLink>
          </Box>
        )}

        {isLoading ? (
          <Box py={"20vh"} textAlign="center">
            <EllipsisLoader text="Loading details" />
          </Box>
        ) : error ? (
          <DefaultErrorState
            title="Error Loading Details"
            description="We're having trouble loading your migration details. Please try again."
          />
        ) : null}

        {data && (
          <Box>
            {/* header */}
            <Box
              blur={16}
              bg="whiteAlpha.100"
              p={6}
              borderRadius="md"
              display="flex"
              flexDir={{ base: "column", md: "row" }}
              gap={6}
              mb={10}
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              {/* <Box w={20} h={20} bg="orange.200" rounded="md" /> */}

              <Box>
                <Heading fontSize="2xl" mb={4}>
                  {data?.playlist_title}
                </Heading>
                <Box display="flex" alignItems="center" gap={2} mb={4}>
                  <Box display="flex" gap={1.5} alignItems="center">
                    <Icon as={MusicIcon} color="blue.400" w={4} h={4} />
                    {data?.total_tracks > -1 ? data.total_tracks : `∞`} tracks
                  </Box>
                  {/* <Text>7m 0s</Text> */}
                </Box>
                <Box
                  display="flex"
                  alignItems="center"
                  gridRowGap={4}
                  gridColumnGap={6}
                  flexWrap="wrap"
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    color="whiteAlpha.800"
                  >
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        w={3}
                        h={3}
                        rounded="full"
                        bg={getServiceColor(data.source_platform)}
                      />
                      {getServiceLabel(data.source_platform)}

                      <StyledLink
                        display="inline-flex"
                        href={data.playlist_link}
                        isExternal
                      >
                        <Icon as={ExternalLinkIcon} />
                      </StyledLink>
                    </Box>
                    <Icon as={ArrowRight} mx={4} />
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        w={3}
                        h={3}
                        rounded="full"
                        bg={getServiceColor(data.destination_platform)}
                      />
                      {getServiceLabel(data.destination_platform)}
                      {data.created_playlist_link && (
                        <StyledLink
                          display={"inline-flex"}
                          href={data.created_playlist_link}
                          isExternal
                        >
                          <Icon as={ExternalLinkIcon} />
                        </StyledLink>
                      )}
                    </Box>
                  </Box>

                  <StatusBadge status={data.status} />
                </Box>
              </Box>
            </Box>

            {/* overall progress */}
            <Box blur={16} mb={10} bg="whiteAlpha.100" borderRadius="md" p={6}>
              <Box display="flex" mb={2}>
                <Heading fontSize="xl">Overall Progress</Heading>
                <Text ml="auto" fontWeight="bold" fontSize="xl">
                  {overallProgress}%
                </Text>
              </Box>
              <Box h={2} bg="whiteAlpha.200" rounded="full" mb={6}>
                <Box
                  h="100%"
                  w={`${overallProgress}%`}
                  bg="green.400"
                  rounded="full"
                />
              </Box>

              <Box
                display="flex"
                justifyContent="space-around"
                color="whiteAlpha.800"
              >
                <Box>
                  <Text fontWeight="bold" fontSize="xl" color="green.400">
                    {completedCount}
                  </Text>
                  <Text fontSize="sm">Completed</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" fontSize="xl" color="red.300">
                    {failedCount}
                  </Text>
                  <Text fontSize="sm">Failed</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" fontSize="xl" color="white">
                    {successRate}%
                  </Text>
                  <Text fontSize="sm">Success Rate</Text>
                </Box>
              </Box>
            </Box>

            {/* tracks list */}
            <Box blur={16} bg="whiteAlpha.100" borderRadius="md">
              <Box
                p={6}
                borderBottom={"1px solid"}
                borderColor="whiteAlpha.200"
                blur={16}
                display="flex"
                alignItems={"center"}
              >
                <Heading fontSize="xl">Track Details</Heading>

                <Box ml="auto">
                  <Select
                    display="inline-block"
                    size="sm"
                    value={trackFilter}
                    onChange={(e) => settrackFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </Select>
                </Box>
              </Box>

              {data.status === "failed" ? null : data.total_tracks === -1 ? (
                <Box>
                  <EllipsisLoader text="Loading tracks" />
                </Box>
              ) : (
                <Box
                  maxH="80"
                  overflow="auto"
                  sx={{
                    ".track-item:not(:last-child)": {
                      borderBottom: "1px solid",
                      borderColor: "whiteAlpha.200",
                    },
                  }}
                >
                  {getFilteredTracks().map((track, index) => {
                    const result = data.result?.[track.track_id];
                    const isCompleted = result && result.data;
                    const isFailed = result && result.error;

                    return (
                      <Box
                        className="track-item"
                        key={track.track_id}
                        display="flex"
                        alignItems="center"
                        gap={2}
                        p={4}
                        _hover={{
                          bg: "whiteAlpha.100",
                        }}
                      >
                        <Box
                          fontSize="sm"
                          color="whiteAlpha.700"
                          fontWeight={"medium"}
                          mr={4}
                        >
                          {index + 1}
                        </Box>
                        <Box>
                          <Text fontSize="sm" fontWeight="medium">
                            {track.title}
                          </Text>
                          <Text fontSize="smaller" color="whiteAlpha.700">
                            {track.artists.join(", ")}
                          </Text>
                        </Box>

                        <Box ml="auto" fontSize="sm">
                          <StatusBadge
                            status={
                              isCompleted
                                ? "completed"
                                : isFailed
                                ? "failed"
                                : "pending"
                            }
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}
