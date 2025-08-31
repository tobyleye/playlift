import api from "@/api/api";
import EllipsisLoader from "@/components/ellipsis-loader";
import DefaultErrorState from "@/components/errors/default-error-state";
import Nav from "@/components/nav";
import { getServiceColor, getServiceLabel } from "@/constants/constants";
import { formatNumber } from "@/utils/utils";
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
import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useSWR from "swr";
import { useVirtualizer } from "@tanstack/react-virtual";

type Track = {
  id: string;
  artists: string[];
  title: string;
  album: string;
};

type ConversionResult = null | Record<
  string,
  {
    data: string;
    error: string;
  }
>;

type ConversionDetails = {
  conversion_id: string;
  playlist_title: string;
  total_tracks: number;
  source_platform: string;
  destination_platform: string;
  status: string;
  time_taken: number;
  playlist_link: string;
  result: ConversionResult;
  playlist_tracks: Track[];
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

  const [trackFilter, setTrackFilter] = useState<string>("all");

  const { completedCount, failedCount, successRate, overallProgress } =
    useMemo(() => {
      let completedCount = 0;
      let failedCount = 0;

      let successRate = 0;
      let overallProgress = 0;
      if (data && data.result && data.playlist_tracks) {
        let totalProcessed = 0;
        for (const track of data.playlist_tracks) {
          const trackId = track.id;
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

  const formatDuration = (duration: number) => {
    duration = Math.round(duration);
    if (duration > 60) {
      return `${Math.floor(duration / 60)} mins, ${duration % 60} secs`;
    }

    return `${duration} secs`;
  };

  const tracks = useMemo(() => {
    if (!data) return [];

    const playlistTracks = data.playlist_tracks || [];

    if (!data.result) return playlistTracks;

    if (trackFilter === "completed") {
      return playlistTracks.filter((track) => data.result![track.id]?.data);
    } else if (trackFilter === "failed") {
      return playlistTracks.filter((track) => data.result![track.id]?.error);
    }

    return playlistTracks;
  }, [data, trackFilter]);

  console.log("tracks..", tracks);
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
        ) : data ? (
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

              <Box w="full">
                <Box display="flex" alignItems="center" gap={2} mb={4}>
                  <Heading fontSize="2xl">{data?.playlist_title}</Heading>
                  {["completed"].includes(data.status) && (
                    <Text ml="auto" fontSize="sm" color="whiteAlpha.600">
                      Took {formatDuration(data.time_taken)}
                    </Text>
                  )}
                </Box>
                <Box display="flex" alignItems="center" gap={2} mb={4}>
                  <Box display="flex" gap={1.5} alignItems="center">
                    <Icon as={MusicIcon} color="blue.400" w={4} h={4} />
                    {data?.total_tracks > -1
                      ? formatNumber(data.total_tracks)
                      : `-`}{" "}
                    tracks
                  </Box>
                </Box>
                <Box
                  display="flex"
                  alignItems="center"
                  gridRowGap={4}
                  gridColumnGap={6}
                  flexWrap="wrap"
                  css={{
                    ".link[href]:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    color="whiteAlpha.800"
                  >
                    <Box
                      as={"a"}
                      className="link"
                      href={data.playlist_link}
                      rel="noopener noreferrer"
                      target="_blank"
                      display="flex"
                      alignItems="center"
                      gap={1.5}
                    >
                      <Box
                        w={3}
                        h={3}
                        rounded="full"
                        bg={getServiceColor(data.source_platform)}
                      />
                      {getServiceLabel(data.source_platform)}

                      <Icon as={ExternalLinkIcon} />
                    </Box>
                    <Icon as={ArrowRight} mx={4} />
                    <Box
                      as="a"
                      className="link"
                      rel="noopener noreferrer"
                      target="_blank"
                      href={data.created_playlist_link}
                      display="flex"
                      alignItems="center"
                      gap={1.5}
                    >
                      <Box
                        w={3}
                        h={3}
                        rounded="full"
                        bg={getServiceColor(data.destination_platform)}
                      />
                      {getServiceLabel(data.destination_platform)}
                      {data.created_playlist_link && (
                        <Icon as={ExternalLinkIcon} />
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
                    onChange={(e) => setTrackFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </Select>
                </Box>
              </Box>

              {data.status === "failed" ? (
                <Box>
                  {data.total_tracks === -1 ? (
                    <Box p={4}>
                      <Text>Failed to load tracks</Text>
                    </Box>
                  ) : (
                    <TrackList
                      key={trackFilter}
                      tracks={tracks || []}
                      result={data?.result ?? {}}
                    />
                  )}
                </Box>
              ) : data.total_tracks === -1 ? (
                <Box p={4}>
                  <EllipsisLoader text="Loading tracks" />
                </Box>
              ) : (
                <TrackList
                  key={trackFilter}
                  tracks={tracks || []}
                  result={data?.result ?? {}}
                />
              )}
            </Box>
          </Box>
        ) : error ? (
          <DefaultErrorState
            title="Error Loading Details"
            description="We're having trouble loading your migration details. Please try again."
          />
        ) : null}
      </Container>
    </Box>
  );
}

const TrackList = ({
  tracks,
  result,
}: {
  tracks: Track[];
  result: ConversionResult;
}) => {
  // The scrollable element for your list
  const parentRef = useRef(null);

  // The virtualizer
  const rowVirtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 75,
    enabled: true,
  });

  const renderTrack = (index: number) => {
    const track = tracks[index];
    const trackResult = result?.[track.id];
    const isCompleted = trackResult && trackResult.data;
    const isFailed = trackResult && trackResult.error;

    return (
      <Box
        className="track"
        key={`track-id-${track.id}-${index}`}
        display="flex"
        alignItems="center"
        px={4}
        py={4}
        _hover={{
          bg: "whiteAlpha.100",
        }}
      >
        <Box
          fontSize="sm"
          flexShrink={0}
          color="whiteAlpha.700"
          fontWeight={"medium"}
          mr={5}
        >
          {index + 1}
        </Box>
        <Box mr={4}>
          <Text fontSize="sm" fontWeight="medium">
            {track.title}
          </Text>
          <Text fontSize="smaller" color="whiteAlpha.700">
            {track.artists.join(", ")}
          </Text>
        </Box>

        <Box ml="auto" fontSize="sm">
          <StatusBadge
            status={isCompleted ? "completed" : isFailed ? "failed" : "pending"}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Box
      ref={parentRef}
      height={80}
      position="relative"
      overflow="auto"
      sx={{
        ".track-list-item": {
          borderBottom: "1px solid",
          borderColor: "whiteAlpha.200",
        },
        ".track-list-item:last-child": {
          borderBottom: "none",
        },
      }}
    >
      {/* The large inner element to hold all of the items */}
      <Box
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
        className="track-list"
      >
        {/* Only the visible items in the virtualizer, manually positioned to be in view */}
        {rowVirtualizer.getVirtualItems().map((virtualItem) => (
          <Box
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={rowVirtualizer.measureElement}
            className="track-list-item"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              // height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {/* Row {virtualItem.index} */}
            {renderTrack(virtualItem.index)}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
