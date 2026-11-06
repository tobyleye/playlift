import { Box, Button, Icon, Text } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GuestStep } from "./types";

/** the wizard's views, including the conversion page it hands off to */
export type DevStep = GuestStep | "converting";

const order: DevStep[] = ["paste", "preview", "converting"];

/** dev-only Back/Next bar for walking the wizard with sample data */
export default function DevStepNav({
  step,
  onChange,
}: {
  step: DevStep;
  onChange: (step: DevStep) => void;
}) {
  const index = order.indexOf(step);

  return (
    <Box
      position="fixed"
      bottom={4}
      left="50%"
      transform="translateX(-50%)"
      zIndex="overlay"
      display="flex"
      alignItems="center"
      gap={3}
      px={3}
      py={2}
      rounded="full"
      bg="blackAlpha.800"
      border="1px solid"
      borderColor="whiteAlpha.300"
      color="white"
      backdropFilter="blur(12px)"
    >
      <Button
        size="sm"
        variant="ghost"
        color="white"
        _hover={{ bg: "whiteAlpha.200" }}
        isDisabled={index <= 0}
        onClick={() => onChange(order[index - 1])}
      >
        <Icon as={ChevronLeft} w={4} h={4} />
        Back
      </Button>
      <Text fontSize="xs" color="whiteAlpha.700" minW={24} textAlign="center">
        {index + 1}/{order.length} · {step}
      </Text>
      <Button
        size="sm"
        variant="ghost"
        color="white"
        _hover={{ bg: "whiteAlpha.200" }}
        isDisabled={index >= order.length - 1}
        onClick={() => onChange(order[index + 1])}
      >
        Next
        <Icon as={ChevronRight} w={4} h={4} />
      </Button>
    </Box>
  );
}
