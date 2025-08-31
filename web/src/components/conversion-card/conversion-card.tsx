import { Box, Text, Icon } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Clock, Check, ArrowRight } from "lucide-react";
import { PlaylistConversion } from "@/types";
import { getServiceColor, getServiceLabel } from "@/constants/constants";
import "./conversion-card.css";
import { formatNumber } from "@/utils/utils";

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

      <Box display="flex" alignItems="center" justifyContent="center">
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

      <Box my={4}>
        {conversion.status === "pending" && (
          <Box
            className="progress-bar"
            w="full"
            h="2"
            rounded="full"
            bg="whiteAlpha.100"
            position="relative"
            overflow="hidden"
          >
            <Box
              className="progress-bar-bar"
              position="absolute"
              rounded="full"
              left={0}
              top={0}
              bottom={0}
              w="full"
              transform={"translateX(-100%)"}
              bgGradient="linear(to-r, whiteAlpha.100, whiteAlpha.400)"
            />
          </Box>
        )}
      </Box>

      <Box display="grid" gap={2} fontSize="sm">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Text color="whiteAlpha.700" fontSize="sm">
            Tracks
          </Text>
          <Text>
            {conversion.total_tracks > -1
              ? formatNumber(conversion.total_tracks)
              : `-`}
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

export default ConversionCard;
