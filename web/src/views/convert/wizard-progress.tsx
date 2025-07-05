import { Box, Icon } from "@chakra-ui/react";
import { CheckIcon } from "lucide-react";

const WizardProgress = ({
  steps,
  currentStep,
}: {
  steps: {
    label: number;
    completed: boolean;
  }[];
  currentStep: number;
}) => {
  return (
    <Box display="flex" gap={2} alignItems="center">
      {steps.map((step, index) => {
        return (
          <Box
            display="flex"
            alignItems="center"
            key={step.label}
            gap={2}
            flex={index < steps.length - 1 ? 1 : "unset"}
            flexShrink={1}
          >
            <Box
              h={8}
              w={8}
              rounded="full"
              display="flex"
              justifyContent="center"
              alignItems="center"
              bg={
                step.completed
                  ? "green.500"
                  : currentStep === index
                  ? "purple.500"
                  : "whiteAlpha.200"
              }
              color="whiteAlpha.800"
              fontSize="sm"
              fontWeight="semibold"
            >
              {step.completed ? (
                <Icon>
                  <CheckIcon />
                </Icon>
              ) : (
                step.label
              )}
            </Box>
            {index < steps.length - 1 && (
              <Box
                h={0.5}
                minWidth={6}
                flex={1}
                bg={step.completed ? "green.500" : "whiteAlpha.200"}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default WizardProgress;
