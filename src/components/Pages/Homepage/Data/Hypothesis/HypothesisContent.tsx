import { Box, Text } from "@chakra-ui/react";
import hypothesisContent from "@/constants/Hypothesis-Content.json";
import type { ThesisStats } from "@/util/Types";
import { formatHypothesisResult } from "@/util/analytics";

export function HypothesisContent({
  hypothesisKey,
  stats,
}: {
  hypothesisKey: string;
  stats: ThesisStats;
}) {
  const content = hypothesisContent[hypothesisKey as keyof typeof hypothesisContent];
  if (!content) return null;

  return (
    <Box mt={2} pt={4} borderTopWidth="1px" borderColor="whiteAlpha.200" width="100%">
      <Text fontSize="md" fontWeight="bold" color="orange.300" mb={2}>
        {content.title}
      </Text>
      <Text
        fontSize="sm"
        mb={4}
        fontStyle="italic"
        color="gray.300"
        bg="whiteAlpha.50"
        p={3}
        borderRadius="md"
      >
        &quot;{content.formulation}&quot;
      </Text>
      <Text fontSize="sm" color="gray.400">
        {content.interpretation}
      </Text>
      <Text fontSize="sm" color="gray.400" mt={2}>
        {formatHypothesisResult(hypothesisKey, stats)}
      </Text>
    </Box>
  );
}
