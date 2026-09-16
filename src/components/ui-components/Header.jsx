import {  Heading, Highlight, HStack } from "@chakra-ui/react";

export default function Header({ text, highlight }) {
  return (
    <HStack gap={10}>
      <Heading size="5xl">
        <Highlight query={highlight} styles={{ color: "orange.600" }}>
          {text}
        </Highlight>
      </Heading>
    </HStack>
  );
}
