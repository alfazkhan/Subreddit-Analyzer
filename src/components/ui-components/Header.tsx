import { Heading, Highlight, HStack } from "@chakra-ui/react";
import type { HeaderProps } from "@/util/Types";

export default function Header({ text, highlight }: HeaderProps) {
  return (
    <HStack gap={10}>
      <Heading size="5xl">
        <Highlight query={highlight ?? ""} styles={{ color: "orange.600" }}>
          {text}
        </Highlight>
      </Heading>
    </HStack>
  );
}