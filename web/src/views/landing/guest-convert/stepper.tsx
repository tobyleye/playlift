import { Box } from "@chakra-ui/react";

const steps = [1, 2];

export default function Stepper({ current }: { current: number }) {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      mb={8}
      aria-label="Progress"
    >
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;

        return (
          <Box key={step} display="flex" alignItems="center">
            {index > 0 && (
              <Box w={{ base: 8, md: 16 }} h="1px" bg="whiteAlpha.300" />
            )}
            <Box
              w={7}
              h={7}
              rounded="full"
              display="grid"
              placeItems="center"
              fontSize="sm"
              fontWeight={600}
              transition=".3s ease-in-out"
              color={done || active ? "white" : "whiteAlpha.500"}
              bg={
                active
                  ? "linear-gradient(to right, rgb(236, 72, 153), rgb(139, 92, 246))"
                  : done
                    ? "rgba(139, 92, 246, .45)"
                    : "whiteAlpha.200"
              }
            >
              {step}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
