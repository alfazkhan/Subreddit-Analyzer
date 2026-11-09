import type { ReactNode } from "react";

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
