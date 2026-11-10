import type { ReactNode } from "react";
import type { HypothesisResponse } from "@/util/Types";

export type { HypothesisResponse };

// ── KPI Metric definitions (merged from kpiMetrics.tsx) ──────────────

export interface KpiMetric {
  rawKey: string;
  smaKey: string;
  label: ReactNode;
  color: string;
  axis: "left" | "right";
}

export const KPI_METRICS: KpiMetric[] = [
  {
    rawKey: "avg_negative_sentiment",
    smaKey: "avg_neg_sentiment_SMA",
    label: (
      <span>
        Negative Sentiment (P<sub>neg</sub>)
      </span>
    ),
    color: "#E53E3E",
    axis: "left",
  },
  { rawKey: "avg_upvote_ratio", smaKey: "avg_upvote_ratio_SMA", label: "Upvote Ratio", color: "#319795", axis: "left" },
  { rawKey: "avg_score", smaKey: "avg_score", label: "Avg Score (Karma)", color: "#FF9900", axis: "right" },
  { rawKey: "avg_num_comments", smaKey: "avg_num_comments", label: "Avg Comments", color: "#3182CE", axis: "right" },
];

/**
 * Definition for a hypothesis tab that can be rendered conditionally based on response data.
 */
export interface HypothesisTabDefinition<TResponse> {
  value: string;
  label: string;
  render: (response: TResponse) => ReactNode;
  getPassed?: (response: TResponse) => boolean;
}
