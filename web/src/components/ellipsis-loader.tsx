import { Text, TextProps } from "@chakra-ui/react";
import "./ellipsis-loader.css";

export default function EllipsisLoader({
  text,
  ...textProps
}: { text?: string } & TextProps) {
  return (
    <Text {...textProps}>
      {text}
      <span className="ellipsis-loader"></span>
    </Text>
  );
}
