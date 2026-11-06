import { Box, Text, Icon } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Clock,
  Check,
  ArrowRight,
  EllipsisVertical,
} from "lucide-react";
import { PlaylistConversion } from "@/types";
import { getServiceColor, getServiceLabel } from "@/constants/constants";
import "./conversion-card.css";
import { formatNumber } from "@/utils/utils";
import { Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import api from "@/api/api";
import { useState } from "react";

const ConversionCard = ({
  conversion,
  onDeleted,
}: {
  conversion: PlaylistConversion;
  onDeleted: () => void;
}) => {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("are u sure?")) {
      return;
    }
    try {
      setDeleting(true);
      await api.deleteConversion(conversion.conversion_id);
      onDeleted();
    } catch (err) {
      console.log("conversion deleted..", err);
    } finally {
      setDeleting(false);
    }
  };
  return (
    <Box
      opacity={deleting ? "0.5" : "1"}
      onClick={() => navigate(`/converts/${conversion.conversion_id}`)}
      bg="whiteAlpha.100"
      border="1px solid"
      borderColor="whiteAlpha.200"
      rounded="md"
      px={4}
      py={3}
      cursor="pointer"
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={4}
      >
        <Box display="flex" alignItems="center" gap={1}>
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

        <Menu>
          <MenuButton
            onClick={(e) => {
              e.stopPropagation();
            }}
            as={"button"}
          >
            <Icon>
              <EllipsisVertical />
            </Icon>
          </MenuButton>
          <MenuList
            bg="blue.800"
            color="whiteAlpha.200"
            py={0}
            width="50px"
            minWidth="120px"
            border="none"
            rounded="md"
            overflow="hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem
              width="120px"
              py={2}
              px={4}
              fontSize="xs"
              bg="red.300"
              color="white"
              fontWeight="medium"
              onClick={handleDelete}
            >
              Delete
            </MenuItem>
          </MenuList>
        </Menu>
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
          <Text color="whiteAlpha.700">
            {dayjs(conversion.created_at).format("MMM DD, YYYY")}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default ConversionCard;
