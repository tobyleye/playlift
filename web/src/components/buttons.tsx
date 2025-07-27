import { chakra } from "@chakra-ui/react";

export const GradientButton = chakra("button", {
  baseStyle: () => {
    return {
      color: "white",
      bgGradient: "linear(to-r, pink.500, purple.500)",
      rounded: "full",
      display: "flex",
      py: 2,
      px: 7,
      alignItems: "center",
      justifyContent: "center",
      transition: ".2s ease-in-out",
      _hover: {
        bgGradient: "linear(to-r, pink.600, purple.600)",
        opacity: 0.9,
      },

      _disabled: {
        bgGradient: "linear(to-r, pink.500, purple.500)",
        opacity: 0.6,
        cursor: "not-allowed",
      },
    };
  },
});

export const SecondaryButton = chakra("button", {
  baseStyle: () => ({
    bg: "whiteAlpha.200",
    border: "1px solid",
    borderColor: "whiteAlpha.600",

    transition: ".2s ease-in-out",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    py: 2,
    px: 8,
    rounded: "full",
    color: "white",
    _hover: {
      bg: "whiteAlpha.300",
    },

    _disabled: {
      bg: "whiteAlpha.200",
      opacity: 0.6,
    },
  }),
});

export const PrimaryButton = ({
  onClick,
  children,
  disabled = false,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  return (
    <chakra.button
      color="white"
      bgGradient="linear(to-r, pink.500, purple.500)"
      rounded="full"
      display="flex"
      py={2}
      px={7}
      alignItems="center"
      transition=".2s ease-in-out"
      _hover={{
        bgGradient: "linear(to-r, pink.600, purple.600)",
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </chakra.button>
  );
};
