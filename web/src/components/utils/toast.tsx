import { Box, Text, CreateToastFnReturn } from "@chakra-ui/react";

export const toastHelper = (
  toastFn: CreateToastFnReturn,
  {
    title,
    description,
  }: {
    title: string;
    description: string;
    status: "info" | "success" | "warning" | "error";
  }
) => {
  toastFn({
    duration: 2_500,
    title: title,
    description: description,
    containerStyle: {
      borderRadius: "md",
    },
    render(prop) {
      return (
        <Box bg="white" px="4" py="4" rounded="md">
          <Text mb={0} fontSize="md" fontWeight="bold" color="blackAlpha.900">
            {prop.title}
          </Text>
          <Text color="blackAlpha.800" fontSize="sm">
            {prop.description}
          </Text>
        </Box>
      );
    },
  });
};
