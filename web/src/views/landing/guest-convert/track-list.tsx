import { Box, Icon, Link, Spinner, Text } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { CheckIcon, CircleAlert, ExternalLink, XIcon } from "lucide-react";
import { formatNumber } from "@/utils/utils";
import { GuestMatchStatus, Track } from "./types";

const statusStyles = {
  matched: { label: "Matched", color: "green.400", icon: CheckIcon },
  review: { label: "Review", color: "yellow.400", icon: CircleAlert },
  not_found: { label: "Not found", color: "red.400", icon: XIcon },
} as const;

export const MatchStatus = ({ status }: { status: GuestMatchStatus }) => {
  const style = statusStyles[status];

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1}
      flexShrink={0}
      fontSize="sm"
      fontWeight={600}
      color={style.color}
    >
      <Icon as={style.icon} w={4} h={4} />
      {style.label}
    </Box>
  );
};

const ConvertingStatus = () => (
  <Box
    display="flex"
    alignItems="center"
    gap={2}
    flexShrink={0}
    fontSize="sm"
    color="whiteAlpha.600"
  >
    <Spinner size="xs" speed=".8s" color="pink.300" />
    Converting
  </Box>
);

export const TrackRow = ({
  position,
  track,
  status,
  isPending,
  link,
  linkLabel,
}: {
  position: number;
  track: Track;
  status?: GuestMatchStatus;
  /** still being converted; shows a spinner instead of the status */
  isPending?: boolean;
  /** the converted track on the destination platform */
  link?: string;
  linkLabel?: string;
}) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      gap={4}
      px={{ base: 4, md: 5 }}
      py={3}
      borderBottom="1px solid"
      borderColor="whiteAlpha.100"
      _last={{ borderBottom: "none" }}
      opacity={isPending ? 0.6 : 1}
      transition="opacity .3s ease"
    >
      <Text
        w={5}
        flexShrink={0}
        textAlign="right"
        fontSize="xs"
        color="whiteAlpha.500"
      >
        {position}
      </Text>

      <Box flex={1} minW={0}>
        <Text fontWeight={500} noOfLines={1}>
          {track.title}
        </Text>
        <Text fontSize="sm" color="gray.300" noOfLines={1}>
          {track.artists && track.artists.join(", ")}
        </Text>
      </Box>

      {isPending ? (
        <ConvertingStatus />
      ) : (
        status && <MatchStatus status={status} />
      )}

      {!isPending && link && (
        <Link
          href={link}
          isExternal
          aria-label={linkLabel ?? "Open converted track"}
          title={linkLabel}
          flexShrink={0}
          w={8}
          h={8}
          display="grid"
          placeItems="center"
          rounded="md"
          bg="whiteAlpha.100"
          color="whiteAlpha.800"
          transition=".2s ease-in-out"
          _hover={{ bg: "whiteAlpha.300", color: "white" }}
        >
          <Icon as={ExternalLink} w={4} h={4} />
        </Link>
      )}
    </Box>
  );
};

export const TrackList = ({
  maxH = "280px",
  children,
  /** index of the row to keep in view, e.g. the one being converted */
  followIndex,
  moreCount = 0,
  moreHint,
}: {
  maxH?: string;
  children: React.ReactNode;
  followIndex?: number;
  /** tracks that exist but weren't loaded; renders a trailing "+ N more" row */
  moreCount?: number;
  moreHint?: string;
}) => {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (followIndex === undefined) return;
    const node = listRef.current;
    const row = node?.children[followIndex] as HTMLElement | undefined;
    if (!node || !row) return;
    // scroll the list, not the page
    node.scrollTo({
      top: row.offsetTop - node.clientHeight / 2 + row.clientHeight / 2,
      behavior: "smooth",
    });
  }, [followIndex]);

  return (
    <Box>
      <Box
        ref={listRef}
        position="relative"
        maxH={maxH}
        overflowY="auto"
        borderTop="1px solid"
        borderColor="whiteAlpha.100"
        sx={{
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-thumb": {
            // background: "rgba(255,255,255,.16)",
            borderRadius: "4px",
          },
        }}
      >
        {children}
        {moreCount > 0 && (
          <Box
            display="flex"
            gap={4}
            px={{ base: 4, md: 5 }}
            py={3}
            fontSize="sm"
            color="whiteAlpha.600"
          >
            <Box w={5} flexShrink={0} />
            <Text>
              + {formatNumber(moreCount)}{" "}
              {moreCount === 1 ? "more track" : "more tracks"}
              {moreHint && ` · ${moreHint}`}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export const FlowCard = ({ children }: { children: React.ReactNode }) => (
  <Box
    bg="whiteAlpha.100"
    border="1px solid"
    borderColor="whiteAlpha.200"
    rounded="lg"
    color="white"
    backdropFilter="blur(16px)"
    overflow="hidden"
  >
    {children}
  </Box>
);
