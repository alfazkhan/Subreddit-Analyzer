import { HypothesisContent } from "./HypothesisContent";
import { getHypothesisStats, isHypothesisPassed } from "./KPIHelpers";
import type { HypothesisResponse, HypothesisTabDefinition } from "./KPIHelpers";

export const HYPOTHESIS_TABS: HypothesisTabDefinition<HypothesisResponse>[] =
  Array.from({ length: 7 }, (_, index) => {
    const hypothesisKey = `H${index + 1}`;
    return {
      value: hypothesisKey.toLowerCase(),
      label: hypothesisKey,
      getPassed: (response) =>
        isHypothesisPassed(hypothesisKey, getHypothesisStats(hypothesisKey, response)),
      render: (response) => (
        <HypothesisContent
          hypothesisKey={hypothesisKey}
          stats={getHypothesisStats(hypothesisKey, response)}
        />
      ),
    };
  });
