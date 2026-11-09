import type { ThesisStats } from "@/util/Types";
import type { ReactNode } from "react";

/**
 * Represents the structure of statistical data for hypothesis testing.
 */
export interface HypothesisResponse {
  hypothesis: Record<string, unknown>;
}

/**
 * Definition for a hypothesis tab that can be rendered conditionally based on response data.
 */
export interface HypothesisTabDefinition<TResponse> {
  value: string;
  label: string;
  render: (response: TResponse) => ReactNode;
  getPassed?: (response: TResponse) => boolean;
}

/**
 * Formats a statistical value for display, handling null/undefined values and nested objects.
 */
export function formatStatValue(value: unknown): string | number {
  if (value === null || value === undefined) return "N/A";
  if (typeof value !== "object") {
    return typeof value === "number" || typeof value === "string" ? value : String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "N/A";
  }
}

/**
 * Converts a generic value to a plain object record.
 */
const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

/**
 * Extracts statistical data from hypothesis response based on the hypothesis key.
 * @param hypothesisKey - The hypothesis identifier (e.g., "H1", "H2")
 * @param response - The full hypothesis response object
 * @returns ThesisStats containing extracted statistics for the given hypothesis
 */
export function getHypothesisStats(
  hypothesisKey: string,
  response: HypothesisResponse,
): ThesisStats {
  const hypothesis = response.hypothesis ?? {};
  const statistics = asRecord(hypothesis.statistics);
  const correlation = (key: string) => asRecord(hypothesis[key]);

  switch (hypothesisKey) {
    case "H1": {
      const comments = correlation("p_neg_vs_num_comments");
      const approval = correlation("p_neg_vs_upvote_ratio");
      return {
        n: Number(comments.n ?? 0),
        rhoComments: Number(comments.spearman_rho ?? 0),
        pComments: String(comments.spearman_p ?? "= 1.0"),
        rhoApproval: Number(approval.spearman_rho ?? 0),
        pApproval: String(approval.spearman_p ?? "= 1.0"),
      };
    }
    case "H2": {
      const data = correlation("score_vs_polarity_magnitude");
      return {
        n: Number(data.n ?? 0),
        rho: Number(data.spearman_rho ?? 0),
        pVal: String(data.spearman_p ?? "= 1.0"),
      };
    }
    case "H3":
      return {
        n: Number(statistics.sample_size ?? 0),
        coef: Number(statistics.entropy_coef ?? 0),
        pVal: String(statistics.entropy_p_val ?? "= 1.0"),
        r2: Number(statistics.r_squared ?? 0),
      };
    case "H4":
      return {
        n: Number(statistics.sample_size ?? 0),
        coef: Number(statistics.interaction_coef ?? 0),
        pVal: String(statistics.interaction_p_val ?? "= 1.0"),
        r2: Number(statistics.r_squared ?? 0),
      };
    case "H5":
      return {
        totalN:
          Number(statistics.admin_housing_sample_size ?? 0) +
          Number(statistics.lifestyle_culture_sample_size ?? 0),
        adminN: Number(statistics.admin_housing_sample_size ?? 0),
        lifestyleN: Number(statistics.lifestyle_culture_sample_size ?? 0),
        meanNegAdmin: Number(statistics.mean_neg_admin_housing ?? 0),
        meanNegLife: Number(statistics.mean_neg_lifestyle_culture ?? 0),
        tNeg: Number(statistics.t_stat_negative_sentiment ?? 0),
        pNeg: String(statistics.p_val_negative_sentiment ?? "= 1.0"),
        meanUpvoteAdmin: Number(statistics.mean_upvote_ratio_admin_housing ?? 0),
        meanUpvoteLife: Number(statistics.mean_upvote_ratio_lifestyle_culture ?? 0),
        tUpvote: Number(statistics.t_stat_upvote_ratio ?? 0),
        pUpvote: String(statistics.p_val_upvote_ratio ?? "= 1.0"),
      };
    case "H6":
      return {
        n: Number(statistics.sample_size ?? 0),
        fStat: Number(statistics.f_stat ?? 0),
        pVal: String(statistics.p_val ?? "= 1.0"),
        means: JSON.stringify(statistics.group_means ?? {}),
      };
    case "H7":
      return {
        n: Number(statistics.sample_size ?? 0),
        linearCoef: Number(statistics.linear_ttr_coef ?? 0),
        quadCoef: Number(statistics.quadratic_ttr_coef ?? 0),
        quadP: String(statistics.quadratic_ttr_p_val ?? "= 1.0"),
        passed: Boolean(statistics.inverted_u_shaped),
      };
    default:
      return {};
  }
}

/**
 * Determines if a hypothesis has been statistically validated based on its p-values and effect sizes.
 * @param hypothesisKey - The hypothesis identifier (e.g., "H1", "H2")
 * @param stats - Statistical data extracted from the hypothesis response
 * @returns true if the hypothesis is considered passed based on statistical significance
 */
export function isHypothesisPassed(hypothesisKey: string, stats: ThesisStats): boolean {
  const pValue = String(stats.pVal ?? "= 1.0");
  // Check if p-value indicates statistical significance (< 0.05 or < 0.001)
  const isSignificant =
    pValue.includes("< 0.001") || Number(pValue.replace("= ", "")) < 0.05;

  switch (hypothesisKey) {
    case "H1":
      // Positive correlation with statistically significant p-value
      return Number(stats.rhoComments) > 0 && String(stats.pComments).includes("< 0.001");
    case "H2":
      // Positive correlation with statistically significant p-value
      return Number(stats.rho) > 0 && pValue.includes("< 0.001");
    case "H3":
      // Negative coefficient (negative entropy effect) with statistical significance
      return Number(stats.coef) < 0 && isSignificant;
    case "H4":
      // Positive coefficient (positive interaction effect) with statistical significance
      return Number(stats.coef) > 0 && isSignificant;
    case "H5":
      // Negative sentiment t-statistic positive, upvote ratio t-statistic negative
      return Number(stats.tNeg) > 0 && Number(stats.tUpvote) < 0;
    case "H6":
      // Statistical significance for ANOVA-style test
      return isSignificant;
    case "H7":
      // Check if the trend passed validation (inverted U-shaped pattern detected)
      return Boolean(stats.passed);
    default:
      return false;
  }
}

/**
 * Gets today's date in ISO format (YYYY-MM-DD).
 * @returns Today's date as a string in ISO 8601 format
 */
export function getTodayISODate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
