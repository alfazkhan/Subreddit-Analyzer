import { HStack, Progress } from "@chakra-ui/react";

export default function ProgressBar({ value, processingStatus }) {
  return (
    <Progress.Root
      colorPalette="orange"
      animated={value !== 100}
      striped={value !== 100}
      variant="subtle"
      value={value}
      size="lg"
      w={"100%"}
    >
      <Progress.Label marginBottom="2">{processingStatus}</Progress.Label>
      <HStack gap="5" >
        <Progress.Track flex="1">
          <Progress.Range />
        </Progress.Track>
        <Progress.ValueText>{value}%</Progress.ValueText>
      </HStack>
    </Progress.Root>
  );
}
