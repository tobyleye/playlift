import { Box } from "@chakra-ui/react";
import { animated, useSpring } from "@react-spring/web";

export const BigCircle = () => {
  const springs = useSpring({
    from: { y: 0 },
    to: [{ y: 20 }, { y: 0 }],
    loop: true,
  });

  return (
    <Box
      as={animated.div}
      pos="absolute"
      top={20}
      left={10}
      w={32}
      h={32}
      rounded="full"
      bg="linear-gradient(to right, rgb(236, 72, 153), rgb(139, 92, 246))"
      opacity={0.2}
      style={{
        ...springs,
      }}
    ></Box>
  );
};

export const BouncingCircle = () => {};
