import type { EChartsOption, LineSeriesOption } from "echarts";
import type { HypothesisResponse, ThesisStats } from "@/util/Types";

// ── ECharts Configuration Helpers ──────────────────────────────────

export const AXIS_LABEL_STYLE = {
  color: "#ffffff",
  fontSize: 11,
} as const;

export function getDefaultHourlyLabels(): string[] {
  return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
}

/**
 * Computes a clean integer Y-axis tick interval from a set of plotted values.
 */
export function calculateDynamicGridInterval(
  values: readonly number[],
  desiredGridLines = 15,
): number {
  const maxDataValue = values.length > 0 ? Math.max(...values) : 1;
  return Math.ceil(maxDataValue / desiredGridLines);
}

/**
 * Creates a standardized smooth ECharts line series with top value labels.
 */
export function createHourlyLineSeries({
  name,
  data,
  color,
}: {
  name: string;
  data: number[];
  color: string;
}): LineSeriesOption {
  return {
    name,
    type: "line",
    data,
    color,
    smooth: true,
    label: {
      show: true,
      position: "top",
      color: "#ffffff",
      fontSize: 10,
    },
  };
}

/**
 * Builds the shared ECharts configuration used by hourly analytics charts.
 */
export function createHourlyLineChartOption({
  labels,
  interval,
  series,
  tooltip,
  legend = { show: false },
}: {
  labels: string[];
  interval: number;
  series: LineSeriesOption[];
  tooltip: EChartsOption["tooltip"];
  legend?: EChartsOption["legend"];
}): EChartsOption {
  return {
    tooltip,
    animation: true,
    animationDuration: 1500,
    animationEasing: "cubicOut",
    animationDurationUpdate: 1500,
    legend,
    xAxis: {
      type: "category",
      data: labels,
      splitLine: {
        show: true,
        lineStyle: { width: 0.1 },
      },
      axisTick: {
        alignWithLabel: true,
      },
      axisLabel: AXIS_LABEL_STYLE,
    },
    yAxis: {
      type: "value",
      splitLine: {
        show: true,
        lineStyle: { width: 0.1 },
      },
      interval,
      axisLabel: AXIS_LABEL_STYLE,
    },
    series,
    grid: {
      top: 30,
      left: 10,
      right: 10,
      bottom: 20,
      containLabel: true,
    },
  };
}

// ── Hypothesis Statistical Helpers ─────────────────────────────────

/**
 * Safely converts an unknown value to a plain object record.
 */
export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

/**
 * Formats a statistical value for display, handling null/undefined values and nested objects.
 */
export function formatStatValue(value: unknown): string | number {
  if (value === null || value === undefined) return "N/A";
  if (typeof value !== "object") {
    return typeof value === "number" || typeof value === "string"
      ? value
      : String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "N/A";
  }
}

/**
 * Extracts statistical data from a hypothesis API response based on the hypothesis key.
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
 */
export function isHypothesisPassed(
  hypothesisKey: string,
  stats: ThesisStats,
): boolean {
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
 * Formats hypothesis statistical results into a human-readable summary string.
 */
export function formatHypothesisResult(
  hypothesisKey: string,
  stats: ThesisStats,
): string {
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
