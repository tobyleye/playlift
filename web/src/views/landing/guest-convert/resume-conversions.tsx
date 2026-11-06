import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Box, Icon, Text } from "@chakra-ui/react";
import { ChevronRight } from "lucide-react";
import api from "@/api/api";
import { getServiceLabel } from "@/constants/constants";
import { formatNumber } from "@/utils/utils";
import { sampleConversions } from "./sample-data";
import { GuestConversionRecord } from "./types";
import { guestConversionPath } from "./use-guest-conversion";

const MAX_SHOWN = 3;

const statusLabel = (conversion: GuestConversionRecord) => {
  if (conversion.status === "completed") return "Ready · sign in to finish";
  if (conversion.status === "failed") return "Didn't finish · try again";
  return "Converting…";
};

const statusColor = (conversion: GuestConversionRecord) => {
  if (conversion.status === "completed") return "green.400";
  if (conversion.status === "failed") return "red.400";
  return "pink.300";
};

/**
 * The guest session's earlier conversions, so leaving the conversion page
 * doesn't strand one. Renders nothing until there is something to resume.
 */
export default function ResumeConversions() {
  const [conversions, setConversions] = useState<GuestConversionRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .guestConversions()
      .then(({ conversions }) => {
        if (!cancelled) setConversions(conversions ?? []);
      })
      // a nice-to-have; the landing page works the same without it
      .catch((error) => {
        console.error("error loading guest conversions", error);
        // dev-only: show sample cards while the endpoint doesn't exist yet
        if (!cancelled && import.meta.env.DEV) setConversions(sampleConversions);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (conversions.length === 0) return null;

  return (
    <Box maxW="2xl" mx="auto" mb={10}>
      <Text
        fontSize="sm"
        fontWeight={600}
        letterSpacing="wider"
        textTransform="uppercase"
        color="whiteAlpha.600"
        mb={3}
      >
        Pick up where you left off
      </Text>

      <Box display="flex" flexDir="column" gap={2}>
        {conversions.slice(0, MAX_SHOWN).map((conversion, index) => (
          <Box
            key={`${conversion.conversion_id}-${index}`}
            as={Link}
            to={guestConversionPath(conversion.conversion_id)}
            display="flex"
            alignItems="center"
            gap={4}
            px={4}
            py={3}
            rounded="lg"
            color="white"
            bg="whiteAlpha.100"
            border="1px solid"
            borderColor="whiteAlpha.200"
            backdropFilter="blur(16px)"
            transition=".2s ease-in-out"
            _hover={{ bg: "whiteAlpha.200" }}
          >
            <Box
              w={2}
              h={2}
              rounded="full"
              flexShrink={0}
              bg={statusColor(conversion)}
            />
            <Box flex={1} minW={0}>
              <Text fontWeight={600} noOfLines={1}>
                {conversion.playlist_title || "Untitled playlist"}
              </Text>
              <Text fontSize="sm" color="gray.300" noOfLines={1}>
                To {getServiceLabel(conversion.destination_platform)}
                {conversion.total_tracks > 0 &&
                  ` · ${formatNumber(conversion.total_tracks)} tracks`}
                {" · "}
                {statusLabel(conversion)}
              </Text>
            </Box>
            <Icon as={ChevronRight} w={5} h={5} color="whiteAlpha.600" />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
