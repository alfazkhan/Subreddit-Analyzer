import { Box, Text } from "@chakra-ui/react";
import hypothesisContent from "@/constants/Hypothesis-Content.json";
import type { ThesisStats } from "@/util/Types";
import { formatStatValue } from "./KPIHelpers";

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

function formatHypothesisResult(hypothesisKey: string, stats: ThesisStats) {
  switch (hypothesisKey) {
    case "H1":
      return `Discussion Depth: Spearman rho = ${formatStatValue(stats.rhoComments)} (p ${formatStatValue(stats.pComments)}); Upvote Approval: Spearman rho = ${formatStatValue(stats.rhoApproval)} (p ${formatStatValue(stats.pApproval)}).`;
    case "H2":
      return `Spearman rho = ${formatStatValue(stats.rho)} (p ${formatStatValue(stats.pVal)}).`;
    case "H3":
    case "H4":
      return `Coefficient = ${formatStatValue(stats.coef)} (p ${formatStatValue(stats.pVal)}, Model R2 = ${formatStatValue(stats.r2)}).`;
    case "H5":
      return `Negative sentiment t = ${formatStatValue(stats.tNeg)} (p ${formatStatValue(stats.pNeg)}); Upvote ratio t = ${formatStatValue(stats.tUpvote)} (p ${formatStatValue(stats.pUpvote)}).`;
    case "H6":
      return `Factorial ANOVA F = ${formatStatValue(stats.fStat)} (p ${formatStatValue(stats.pVal)}); Local averages: ${formatStatValue(stats.means)}.`;
    case "H7":
      return `Linear coefficient = ${formatStatValue(stats.linearCoef)}; Quadratic coefficient = ${formatStatValue(stats.quadCoef)} (p ${formatStatValue(stats.quadP)}).`;
    default:
      return "";
  }
}
