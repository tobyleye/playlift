import { Box, Icon, Heading, Text } from "@chakra-ui/react";
import { FileX } from "lucide-react";

export default function DefaultErrorState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Box textAlign="center" py="10vh">
      <Box
        w={24}
        h={24}
        bg="whiteAlpha.100"
        display="grid"
        placeItems="center"
        mb={4}
        mx="auto"
        rounded="full"
      >
        <Icon color="whiteAlpha.600" as={FileX} w={14} h={14} />
      </Box>
      <Heading fontSize="2xl" fontWeight="bold" mb={4}>
        {title}
      </Heading>
      <Text color="whiteAlpha.700" fontSize="base" maxW="md" mx="auto">
        {description}
      </Text>
    </Box>
  );
}
