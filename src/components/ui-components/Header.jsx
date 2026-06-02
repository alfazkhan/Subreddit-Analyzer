import { Heading, Highlight } from "@chakra-ui/react";

export default function Header({text, highlight}) {
  return (
    <Heading size="5xl">
      <Highlight query={highlight} styles={{ color: "orange.600" }}>
      {text}
      </Highlight>
    </Heading>
  );
}
