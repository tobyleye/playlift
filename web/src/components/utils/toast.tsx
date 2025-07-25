import { Box, Text, CreateToastFnReturn } from "@chakra-ui/react";

export const toastHelper = (
  toastFn: CreateToastFnReturn,
  {
    title,
    description,
    status = "info",
  }: {
    title: string;
    description: string;
    status?: "info" | "error";
  }
) => {
  return toastFn({
    duration: 4000,
    title: title,
    description: description,
    containerStyle: {
      borderRadius: "md",
    },
    status: status,
    render(prop) {
      return (
        <Box
          px="4"
          py="4"
          rounded="md"
          color="white"
          className={prop.status}
          sx={{
            "&.info": {
              color: "white",
              blur: "0.5px",
              bg: "linear-gradient(to right, rgba(88, 28, 135, 0.9), rgba(30, 58, 138, 0.9), rgba(49, 46, 129, 0.9))",
              border: "1px solid",
              borderColor: "whiteAlpha.300",
            },
            "&.error": {
              bgGradient: "linear(to-r, red.800, pink.800)",
              border: "1px solid",
              borderColor: "whiteAlpha.300",
              color: "white",
            },
          }}
        >
          <Text mb={0} fontSize="md" fontWeight="bold">
            {prop.title}
          </Text>
          <Text fontSize="sm" color="whiteAlpha.900">
            {prop.description}
          </Text>
        </Box>
      );
    },
  });
};
